const { Order } = require("../../models/order_schema");
const { OrderItem } = require("../../models/order_items");

exports.getOrders = async function (req, res) {
  try {
    const orders = await Order.find()
      .select("-statusHistory")
      .populate("user", "name email")
      .sort({ dateOrdered: -1 })
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          select: "name",
          populate: { path: "category", select: "name" },
        },
      });

    if (!orders) {
      return res.status(404).json({ message: "No orders found" });
    }
    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getOrdersCount = async function (req, res) {
  try {
    const count = await Order.countDocuments();
    if (!count)
      return res
        .status(500)
        .json({ message: "Could not retrieve orders count" });
    return res.json({ count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.changeOrderStatus = async function (req, res) {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;
    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    order.status = newStatus;
    order = await order.save();
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteOrder = async function (req, res) {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }
    for (const orderItemId of order.orderItems) {
      await OrderItem.findByIdAndDelete(orderItemId);
    }
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
