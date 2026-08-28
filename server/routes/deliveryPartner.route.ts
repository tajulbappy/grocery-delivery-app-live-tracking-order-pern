import express from "express";
import {
  cancelDelivery,
  completeDelivery,
  getDeliveryDetail,
  getMyDeliveries,
  loginPartner,
  updateDeliveryStatus,
  updateLiveLocation,
} from "../controllers/deliveryPartner.controller.js";
import deliveryPartnerAuth from "../middleware/deliveryPartnerAuth.js";

const deliveryPartnerRouter = express.Router();

deliveryPartnerRouter.post("/login", loginPartner);
deliveryPartnerRouter.get(
  "/my-deliveries",
  deliveryPartnerAuth,
  getMyDeliveries
);
deliveryPartnerRouter.get(
  "/my-deliveries/:id",
  deliveryPartnerAuth,
  getDeliveryDetail
);
deliveryPartnerRouter.put(
  "/my-deliveries/:id/complete",
  deliveryPartnerAuth,
  completeDelivery
);

deliveryPartnerRouter.put(
  "/my-deliveries/:id/cancel",
  deliveryPartnerAuth,
  cancelDelivery
);

deliveryPartnerRouter.put(
  "/my-deliveries/:id/status",
  deliveryPartnerAuth,
  updateDeliveryStatus
);

deliveryPartnerRouter.put(
  "/my-deliveries/:id/location",
  deliveryPartnerAuth,
  updateLiveLocation
);

export default deliveryPartnerRouter;
