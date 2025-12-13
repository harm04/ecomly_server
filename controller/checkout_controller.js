const crypto = require("crypto");
const { User } = require("../models/user_schema");
const { Product } = require("../models/products_schema");
const { Order } = require("../models/order_schema");
const { OrderItem } = require("../models/order_items");
const { CartProduct } = require("../models/cart_product_schema");
const { sendOrderConfirmationEmail } = require("../helpers/email_sender");
require("dotenv").config();
const razorpay = require("razorpay");

// ===================================
// RAZORPAY CONFIGURATION
// ===================================
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Extract user ID from JWT middleware
 */
const extractUserId = (req) => {
  if (req.auth && req.auth.id) {
    return req.auth.id;
  }
  throw new Error("User not authenticated. Please login first.");
};

/**
 * Validate request data for order creation
 */
const validateOrderRequest = (cartItems, shippingAddress) => {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Cart items are required and must be an array");
  }

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
    throw new Error("Complete shipping address is required");
  }

  // Validate each cart item
  for (const cartItem of cartItems) {
    if (!cartItem.productId || !cartItem.quantity || cartItem.quantity <= 0) {
      throw new Error("Each cart item must have valid productId and quantity");
    }
  }
};

/**
 * Generate short receipt ID for Razorpay
 */
const generateReceiptId = (userId) => {
  const shortUserId = userId.toString().slice(-6);
  const timestamp = Date.now().toString().slice(-8);
  return `rcpt_${timestamp}_${shortUserId}`;
};

/**
 * Create order items and calculate total price
 */
const createOrderItems = async (cartItems) => {
  let totalPrice = 0;
  const orderItemIds = [];
  const orderItemsDetails = [];

  for (const cartItem of cartItems) {
    // Fetch product details
    const product = await Product.findById(cartItem.productId);
    if (!product) {
      throw new Error(`Product with id ${cartItem.productId} not found`);
    }

    // Check stock availability
    let availableStock = product.countInStock;
    if (typeof availableStock === "string") {
      availableStock = parseInt(availableStock) || 0;
    }

    if (availableStock < cartItem.quantity) {
      throw new Error(
        `Only ${availableStock} items left in stock for ${product.name}`
      );
    }

    // Calculate item total
    const itemTotal = product.price * cartItem.quantity;
    totalPrice += itemTotal;

    // Create OrderItem document
    const orderItem = new OrderItem({
      product: product._id,
      productName: product.name,
      productImage: product.image,
      productPrice: product.price,
      quantity: cartItem.quantity,
      selectedSize: cartItem.size || null,
      selectedColour: cartItem.color || null,
    });

    const savedOrderItem = await orderItem.save();
    orderItemIds.push(savedOrderItem._id);

    // For response
    orderItemsDetails.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      image: product.image,
      size: cartItem.size || null,
      color: cartItem.color || null,
    });
  }

  return { totalPrice, orderItemIds, orderItemsDetails };
};

/**
 * Update product stock after successful payment
 */
const updateProductStock = async (orderItems) => {
  for (const orderItem of orderItems) {
    try {
      const productId = orderItem.product;
      const quantity = orderItem.quantity;

      console.log(
        `Updating stock for product ${productId}, quantity: ${quantity}`
      );

      // Get current product data
      const product = await Product.findById(productId);
      if (!product) {
        console.log(`Product not found: ${productId}`);
        continue;
      }

      // Convert string to number if needed
      let currentStock = product.countInStock;
      if (typeof currentStock === "string") {
        currentStock = parseInt(currentStock) || 0;
        console.log(
          `Converting countInStock from string "${product.countInStock}" to number ${currentStock}`
        );
      }

      // Calculate new stock (ensure it doesn't go negative)
      const newStock = Math.max(0, currentStock - quantity);

      console.log(
        `Stock update: ${currentStock} - ${quantity} = ${newStock}`
      );

      // Update with explicit value
      const result = await Product.findByIdAndUpdate(
        productId,
        { countInStock: newStock },
        { new: true }
      );

      if (result) {
        console.log(
          `Stock updated for product ${productId}: ${result.countInStock} remaining`
        );
      } else {
        console.log(`Failed to update product: ${productId}`);
      }
    } catch (error) {
      console.error(
        `Failed to update stock for product ${orderItem.product}:`,
        error
      );
      // Continue with other items even if one fails
    }
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
};

/**
 * Send order confirmation email
 */
const sendConfirmationEmail = async (order) => {
  try {
    const orderForEmail = {
      _id: order._id,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.dateOrdered,
      orderItems: order.orderItems.map((orderItem) => ({
        name: orderItem.productName,
        price: orderItem.productPrice,
        quantity: orderItem.quantity,
        image: orderItem.productImage,
      })),
      shippingAddress: {
        address: order.shippingAddress,
        city: order.city,
        postalCode: order.postalCode,
        country: order.country,
      },
    };

    console.log("Sending order confirmation email...");
    const emailResult = await sendOrderConfirmationEmail(
      order.user.email,
      order.user.name,
      orderForEmail
    );

    const emailSent = emailResult?.success || false;
    console.log(`Email result: ${emailSent ? "Success" : "Failed"}`);
    return emailSent;
  } catch (emailError) {
    console.error("Error sending order confirmation email:", emailError);
    return false;
  }
};

// ===================================
// MAIN CONTROLLER FUNCTIONS
// ===================================

/**
 * Create new order and Razorpay payment
 */
exports.createOrder = async function (req, res) {
  try {
    console.log("Starting order creation process...");

    // Extract and validate user
    const userId = extractUserId(req);
    console.log("User ID extracted:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log("User found:", user.email);

    // Validate request data
    const { cartItems, shippingAddress } = req.body;
    validateOrderRequest(cartItems, shippingAddress);

    // Create order items and calculate total
    const { totalPrice, orderItemIds, orderItemsDetails } =
      await createOrderItems(cartItems);
    console.log(`Total order amount: ₹${totalPrice}`);

    // Generate receipt ID
    const shortReceipt = generateReceiptId(userId);

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(totalPrice * 100), // Amount in paise
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        userId: userId,
        itemCount: orderItemIds.length,
        userEmail: user.email,
      },
    };

    console.log("Creating Razorpay order with receipt:", shortReceipt);
    const razorpayOrder = await razorpayInstance.orders.create(
      razorpayOrderOptions
    );

    // Create Order document in database
    const order = new Order({
      user: userId,
      orderItems: orderItemIds,
      shippingAddress: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.postalCode}`,
      phone: user.phone || shippingAddress.phone || "",
      city: shippingAddress.city,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      totalPrice: totalPrice,
      status: "pending",
      statusHistory: ["pending"],
      paymentDetails: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "pending",
        receipt: shortReceipt,
      },
    });

    const savedOrder = await order.save();
    console.log("Order saved with ID:", savedOrder._id);

    // Return success response
    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY,
      receipt: shortReceipt,
      order: savedOrder,
      orderDetails: orderItemsDetails,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment order",
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay payment and complete order
 */
exports.verifyPayment = async function (req, res) {
  try {
    console.log("Starting payment verification...");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    console.log("🔍 Verification data received:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: "present",
    });

    // Verify payment signature
    const isSignatureValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      console.log(" Payment signature verification failed");
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    console.log("Payment signature verified successfully");

    // Find and populate the order
    const order = await Order.findOne({
      "paymentDetails.razorpayOrderId": razorpay_order_id,
    })
      .populate("user")
      .populate("orderItems");

    if (!order) {
      console.log(
        "Order not found for razorpay_order_id:",
        razorpay_order_id
      );
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("Order found:", order._id);

    // Check if payment is already completed
    if (order.paymentDetails?.paymentStatus === "completed") {
      console.log("Payment already completed for this order");
      return res.status(200).json({
        success: true,
        message: "Payment already verified for this order",
        order: order,
        emailSent: true,
      });
    }

    // Update order status and payment details
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.paymentDetails.paymentStatus = "completed";
    order.paymentDetails.paidAt = new Date();
    order.status = "processed";

    // Update status history
    if (!order.statusHistory.includes("processed")) {
      order.statusHistory.push("processed");
    }

    // Update product stock
    await updateProductStock(order.orderItems);

    // Clear user's cart
    try {
      await CartProduct.deleteMany({ user: order.user._id || order.user });
      console.log("User cart cleared");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      // Continue even if cart clearing fails
    }

    // Save updated order
    await order.save();
    console.log("✅ Order updated successfully");

    // Send confirmation email
    const emailSent = await sendConfirmationEmail(order);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      order: order,
      emailSent: emailSent,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

/**
 * Handle payment failure
 */
exports.paymentFailure = async function (req, res) {
  try {
    console.log("Processing payment failure...");

    const { razorpay_order_id, error_description, error_code } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Find and update order with failure details
    const order = await Order.findOne({
      "paymentDetails.razorpayOrderId": razorpay_order_id,
    });

    if (order && order.paymentDetails.paymentStatus !== "completed") {
      order.paymentDetails.paymentStatus = "failed";
      order.paymentDetails.errorDescription = error_description;
      order.paymentDetails.errorCode = error_code;
      order.status = "cancelled";

      if (!order.statusHistory.includes("cancelled")) {
        order.statusHistory.push("cancelled");
      }

      await order.save();
      console.log("Order marked as failed:", order._id);
    }

    return res.status(200).json({
      success: false,
      message: "Payment failed",
      error: error_description || "Payment failed",
      errorCode: error_code,
    });
  } catch (error) {
    console.error("Payment failure handling error:", error);
    return res.status(500).json({
      success: false,
      message: "Error handling payment failure",
      error: error.message,
    });
  }
};

/**
 * Get specific order details
 */
exports.getOrder = async function (req, res) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("orderItems");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

