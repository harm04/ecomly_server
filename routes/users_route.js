const express = require("express");
const router = express.Router();

const userController = require("../controller/users_controller");
const wishlistsController = require("../controller/wishlist_controller");
const cartController = require("../controller/cart_controller");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUsersById);
router.put("/:id", userController.updateUser);

//wishlists
router.get("/:id/wishlist", wishlistsController.getUsersWishlist);
router.post("/:id/wishlist", wishlistsController.addToWishlist);
router.delete(
  "/:id/wishlist/:productId",
  wishlistsController.removeFromWishlist
);

//cart
router.get("/:id/cart", cartController.getUsersCart);
router.get("/:id/cart/count", cartController.getUserCartCount);
router.get("/:id/cart/:cartProductId", cartController.getCartProductById);
router.post("/:id/cart", cartController.addToCart);
router.put("/:id/cart/:cartProductId", cartController.modifyProductQuantity);
router.delete("/:id/cart/:cartProductId", cartController.removeFromCart);

module.exports = router;
