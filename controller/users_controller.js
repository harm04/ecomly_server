const { User } = require("../models/user_schema");

exports.getUsers = async (_, res) => {
  try {
    const user = await User.find().select("name email id isAdmin");
    if (!user) {
      return res.status(404).json({
        message: "No users found",
      });
    }
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getUsersById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-passwordHash -resetPasswordOTP -resetPasswordOTPExpiry"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.passwordHash = undefined;
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
