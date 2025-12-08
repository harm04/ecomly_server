const express = require("express");
const router = express.Router();

const categoriesController = require("../controller/categories_controller");

router.get('/',categoriesController.getCategories);
router.get('/:id',categoriesController.getCategoriesById);


module.exports=router;
