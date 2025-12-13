const express = require("express");
const router = express.Router();
const ordersController = require("../controller/orders_controller");


router.get('/users/:userId',ordersController.getUserOrders);
router.get('/:id',ordersController.getOrderById);

module.exports = router;