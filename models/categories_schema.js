const { Schema, model } = require("mongoose");

const categoriesSchema = Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#000000" },
  image: { type: String, required: true },
  markedForDeletion: { type: bollean, default: false },
});

categoriesSchema.set("toObject", { virtuals: true });
categoriesSchema.set("toJSON", { virtuals: true });
exports.Category = model("Category", categoriesSchema);
