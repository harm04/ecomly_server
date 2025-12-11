const jwt = require("jsonwebtoken");
const { User } = require("../models/user_schema");
const { Product } = require("../models/products_schema");

exports.checkout = async function (req, res) {
  const accessToken = req.header("Authorization").replace("Bearer ", "").trim();
  const tokenData = jwt.decode(accessToken);
  const user = await User.findById(tokenData.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  for (const cartItem of req.body.cartItems) {
    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res
        .status(404)
        .json({ message: `Product with id ${cartItem.productName} not found` });
    } else if (!cartItem.reserved && product.countInStock < cartItem.quantity) {
      const message = `Only ${product.countInStock} items left in stock for product ${product.name}`;
      return res.status(400).json({ message });
    }
  }
};
