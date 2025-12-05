const { validationResult } = require("express-validator");
const { User } = require("../models/user_schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Token } = require("../models/token_schema");
const mailSender = require("../helpers/email_sender");

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
      return res.status(500).json({
        type: "Internal server error",
        message: "Unable to register user",
      });
    }
    return res.status(201).json(user);
  } catch (error) {
    if (error.message.includes("email_1 dup key")) {
      return res
        .status(409)
        .json({ type: "AuthError", message: "Email already in use" });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const accessToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.ACESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "60d" }
    );

    const token = await Token.findOne({ userId: user.id });
    if (token) await token.deleteOne();
    await new Token({ userId: user.id, accessToken, refreshToken }).save();

    user.passwordHash = undefined;
    return res.json({ ...user._doc, accessToken });
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.verifyToken = async function (req, res) {
  try {
    let accessToken = req.headers.authorization;
    if (!accessToken) return res.json(false);
    accessToken = accessToken.replace("Bearer", "").trim();
    const token = await Token.findOne({ accessToken });
    if (!token) return res.json(false);
    const tokenData = jwt.decode(token.refreshToken);
    const user = await User.findById(tokenData.id);
    if (!user) return res.json(false);
    const isValid = jwt.verify(
      token.refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!isValid) return res.json(false);
    return res.json(true);
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.forgotPassword = async function (req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = Date.now() + 600;
    await user.save();
    const response = await mailSender.sendMail(
      email,
      "Password Reset OTP",
      `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`
    );
    return res.json({ message: response });
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
exports.verifyOtp = async function (req, res) {};
exports.resetPassword = async function (req, res) {};
