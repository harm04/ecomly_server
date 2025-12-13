const nodemailer = require("nodemailer");

// 🔑 YOUR EXISTING FUNCTION - OTP Email (UNCHANGED)
exports.sendMail = async function (
  email,
  subject,
  body,
  successMessage,
  errorMessage
) {
  return new Promise((resolve, reject) => {
    const transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: subject,
      text: body,
    };

    transport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(Error("Error in sending email"));
      }
      console.log("Email sent:", info.response);
      resolve("Password reset OTP sent to your email");
    });
  });
};

// 🛒 NEW FUNCTION - Order Confirmation Email
exports.sendOrderConfirmationEmail = async function (
  userEmail,
  userName,
  order
) {
  try {
    const transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const orderItemsHtml = order.orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">
          ${item.name}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${
          item.price
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${
          item.price * item.quantity
        }</td>
      </tr>
    `
      )
      .join("");

    const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: `🎉 Order Confirmed - Order #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed! 🎉</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px;">
            <div style="margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">Hello ${userName},</h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px; margin: 0;">
                Your order has been confirmed and is now being processed. We'll notify you when it ships!
              </p>
            </div>

            <!-- Order Info Box -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📦 Order Details</h3>
              <p><strong>Order ID:</strong> #${order._id}</p>
              <p><strong>Order Date:</strong> ${new Date(
                order.dateOrdered || order.createdAt
              ).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${order.status.toUpperCase()}</span></p>
              <p><strong>Payment:</strong> <span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">PAID ✓</span></p>
            </div>

            <!-- Order Items -->
            <div style="margin: 25px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🛍️ Items Ordered</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #667eea;">
                    <th style="padding: 15px; color: white; text-align: left; font-weight: bold;">Product</th>
                    <th style="padding: 15px; color: white; text-align: center; font-weight: bold;">Qty</th>
                    <th style="padding: 15px; color: white; text-align: right; font-weight: bold;">Price</th>
                    <th style="padding: 15px; color: white; text-align: right; font-weight: bold;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Total Amount -->
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <h2 style="color: white; margin: 0; font-size: 24px;">
                💰 Total Amount: ₹${order.totalPrice}
              </h2>
            </div>

            ${
              order.shippingAddress
                ? `
            <!-- Shipping Address -->
            <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 18px;">🚚 Shipping Address</h3>
              <p style="color: #333; line-height: 1.6; margin: 0;">
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
                ${order.shippingAddress.country}
              </p>
            </div>
            `
                : ""
            }

            <!-- Support -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; font-size: 16px; margin: 0;">
                Questions about your order? We're here to help!
              </p>
              <p style="color: #667eea; font-weight: bold; margin: 5px 0 0 0;">
                📧 ${process.env.EMAIL}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #333; padding: 25px; text-align: center;">
            <p style="color: #ccc; margin: 0; font-size: 14px;">
              Thank you for choosing our store! 
            </p>
          </div>
        </div>
      `,
    };

    const info = await transport.sendMail(mailOptions);
    console.log(
      "✅ Order confirmation email sent successfully:",
      info.messageId
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending order confirmation email:", error);
    return { success: false, error: error.message };
  }
};
