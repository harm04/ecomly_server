const { Schema, model } = require("mongoose");

const orderSchema = Schema({
  orderItems: [
    {
      type: Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: String,
  country: { type: String, required: true },
  phone: { type: String, required: true },
  paymentId: String,
  status: {
    type: String,
    requied: true,
    default: "pending",
    enum: [
      "pending",
      "processed",
      "shipped",
      "delivered",
      "cancelled",
      "ou-for-delivery",
      "expired",
      "on-hold",
    ],
  },
  statusHistory: {
    type: [String],
    requied: true,
    default: "pending",
    enum: [
      "pending",
      "processed",
      "shipped",
      "delivered",
      "cancelled",
      "ou-for-delivery",
      "expired",
      "on-hold",
    ],
  },
  totalPrice: Number,
  user: { type: Schema.Types.ObjectId, ref: "User" },
  dateOrdered: { type: Date, default: Date.now },
});

orderSchema.set("toObject", { virtuals: true });
orderSchema.set("toJSON", { virtuals: true });
exports.Order = model("Order", orderSchema);
