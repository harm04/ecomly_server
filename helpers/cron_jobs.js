const cron = require("node-cron");
const { Product } = require("../models/products_schema");
const { Category } = require("../models/categories_schema");

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
