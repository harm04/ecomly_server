const cron = require("node-cron");
const { Product } = require("../models/products_schema");
const { Category } = require("../models/categories_schema");
const { CartProduct } = require("../models/cart_product_schema");
const { default: mongoose } = require("mongoose");

cron.schedule("0 0 * * *", async function () {
  try {
    const categoriesToBeDeleted = await Category.find({
      markedForDeletion: true,
    });

    for (const category of categoriesToBeDeleted) {
      const categoryProductCount = await Product.countDocuments({
        category: category.id,
      });

      if (categoryProductCount < 1) {
        const result = await Category.deleteOne();
      }
    }
    console.log("CRON job completed at:", new Date());
  } catch (error) {
    console.error(`Cron Job Error: ${error.message}`);
  }
});

cron.schedule("0/30 * * * *", async function () {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log("Reservation release CRON job at:", new Date());
    const expiredReservations = await CartProduct.find({
      reserved: true,
      reservationExpiry: { $lte: new Date() },
    }).session(session);
    for (const cartProduct of expiredReservations) {
      const product = await Product.findById(cartProduct.product).session(
        session
      );
      if (product) {
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          { $inc: { countInStock: cartProduct.quantity } },
          { new: true, runValidators: true, session }
        );
        if (!updatedProduct) {
          console.error("product update failed");
          await session.abortTransaction();
          return;
        }
      }
      await CartProduct.findByIdAndUpdate(
        cartProduct._id,
        { reserved: false },
        { session }
      );
    }
    await session.commitTransaction();
    console.log("Completed release CRON job at:", new Date());
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    session.endSession();
  }
});
