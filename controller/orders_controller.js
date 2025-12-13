const { Order } = require("../models/order_schema");
const { User } = require("../models/user_schema");

exports.getUserOrders = async function (req, res) {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .select("orderItems status totalPrice dateOrdered")
      .populate({ path: "orderItems", select: "productName productImage" })
      .sort({ dateOrdered: -1 });
    if (!orders) {
      return res.status(404).json({ message: "No orders found for this user" });
    }
    const completed = [];
    const cancelled = [];
    const active = [];
    for (const order of orders) {
      if (order.status === "delivered") {
        completed.push(order);
      } else if (["cancelled", "expired"].includes(order.status)) {
        cancelled.push(order);
      } else {
        active.push(order);
      }
    }

    return res.status(200).json({
      total: orders.length,
      active,
      completed,
      cancelled,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
exports.getOrderById = async function (req, res) {
  try {
    const order = await Order.findById(req.params.id).populate("orderItems");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
