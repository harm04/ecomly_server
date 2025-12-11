const { Schema, model } = require("mongoose");

const userSchema = Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  paymentCustomerId: String,
  street: String,
  appartment: String,
  city: String,
  postalCode: String,
  country: String,
  resetPasswordOTP: Number,
  resetPasswordOTPExpiry: Date,
  cart: [{ type: Schema.Types.ObjectId, ref: "CartProduct" }],
  isAdmin: { type: Boolean, default: false },
  wishList: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Products",
        required: true,
      },
      productName: { type: String, required: true },
      productImage: { type: String, required: true },
      productPrice: { type: Number, required: true },
    },
  ],
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });
exports.User = model("User", userSchema);
