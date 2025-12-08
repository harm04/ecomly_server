const { Product } = require("../models/products_schema");

exports.leaveReview = async function (req, res) {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getProductReviews = async function (req, res) {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
