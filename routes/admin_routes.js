const express = require("express");
const router = express.Router();

const userAdminController = require("../controller/admin/user_admin_controller");
const categoriesAdminController = require("../controller/admin/categories_admin_controller");
const ordersAdminController = require("../controller/admin/orders_admin_controller");
const productAdminController = require("../controller/admin/product_admin_controller");

//users
router.get("/users/count", userAdminController.getUsersCount);
router.delete("/users/:id", userAdminController.deleteUser);

//categories
router.post("/categories", categoriesAdminController.addCategory);
router.put("/categories/:id", categoriesAdminController.editCategory);
router.delete("/categories/:id", categoriesAdminController.deleteCategory);

//products
router.get("/products/count", productAdminController.getProductsCount);
router.get("/products", productAdminController.getProducts);
router.post("/products", productAdminController.addProduct);
router.put("/products/:id", productAdminController.editProduct);
router.delete(
  "/products/:id/images",
  productAdminController.deleteProductImages
);
router.delete("/products/:id", productAdminController.deleteProduct);

//orders
router.get("/orders", ordersAdminController.getOrders);
router.get("/orders/count", ordersAdminController.getOrdersCount);
router.put("/orders/:id", ordersAdminController.changeOrderStatus);
router.delete("/orders/:id", ordersAdminController.deleteOrder);

module.exports = router;
