const express = require("express");
const router = express.Router();
const checkoutController = require("../controller/checkout_controller");

router.post("/create-order", checkoutController.createOrder);
router.post("/verify-payment", checkoutController.verifyPayment);
router.post("/payment-failure", checkoutController.paymentFailure);
router.get("/order/:orderId", checkoutController.getOrder);

// Add this to your checkout_routes.js
router.get("/debug-orders", checkoutController.debugOrders);
module.exports = router;
