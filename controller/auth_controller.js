const { validationResult } = require("express-validator");
const { User } = require("../models/user_schema");
const bcrypt = require("bcrypt");

exports.register = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    return res.status(400).json({ errors: errorMessages });
  }

  try {
    let user = User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
    });
    user = await user.save();
    if (!user) {
      return res
        .status(500)
        .json({
          type: "Internal server error",
          message: "Unable to register user",
        });
    }
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
exports.login = async function (req, res) {};
exports.forgotPassword = async function (req, res) {};
exports.verifyOtp = async function (req, res) {};
exports.resetPassword = async function (req, res) {};
