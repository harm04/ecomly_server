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
   paymentDetails: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    receipt: { type: String },
    paidAt: { type: Date },
    errorDescription: { type: String },
    errorCode: { type: String }
  },
});

orderSchema.set("toObject", { virtuals: true });
orderSchema.set("toJSON", { virtuals: true });
exports.Order = model("Order", orderSchema);
