const express = require("express");
const router = express.Router();

const userController = require("../controller/users_controller");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUsersById);
router.put("/:id", userController.updateUser);

module.exports = router;
