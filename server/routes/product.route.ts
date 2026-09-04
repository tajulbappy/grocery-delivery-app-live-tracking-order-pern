import express from "express";
import {
  createProduct,
  updateProductStock,
  getFlashDeals,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const productRouter = express.Router();

productRouter.get("/flash-deals", getFlashDeals);
productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);
productRouter.post("/", auth, admin, createProduct);
productRouter.put("/:id", auth, admin, updateProduct);
// Mark product as out of stock
productRouter.put("/:id/out-of-stock", auth, admin, updateProductStock);

export default productRouter;
