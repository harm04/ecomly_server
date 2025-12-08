const express = require("express");
const router = express.Router();

const productsController = require("../controller/products_controller");
const reviewsController = require("../controller/reviews_controller");

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductsById);
router.get("/search", productsController.searchProducts);
router.post("/:id/reviews", reviewsController.leaveReview);
router.get("/:id/reviews", reviewsController.getProductReviews);

module.exports = router;
