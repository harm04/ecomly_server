const express = require("express");

const router = express.Router();

const authController = require("../controller/auth_controller");

const { body } = require("express-validator");

const validateUser = [
  body("name").not().isEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .isStrongPassword()
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol"
    ),
  body("phone")
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
];

const validatePassword = [
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .isStrongPassword()
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol"
    ),
];

router.post("/login", authController.login);
router.post("/register", validateUser, authController.register);
router.get("verify-token", authController.verifyToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", validatePassword, authController.resetPassword);

module.exports = router;
