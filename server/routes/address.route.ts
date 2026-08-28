import express from "express";
import auth from "../middleware/auth.js";
import {
  addUserAddresses,
  deleteUserAddresses,
  getUserAddresses,
  updateUserAddresses,
} from "../controllers/address.controller.js";

const addressRouter = express.Router();

addressRouter.get("/", auth, getUserAddresses);
addressRouter.post("/", auth, addUserAddresses);
addressRouter.put("/:id", auth, updateUserAddresses);
addressRouter.delete("/:id", auth, deleteUserAddresses);

export default addressRouter;
