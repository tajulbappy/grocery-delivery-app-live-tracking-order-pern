import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import { serve } from "inngest/express";

import { inngest, functions } from "./inngest/index.js";
import authRouter from "./routes/auth.route.js";
import productRouter from "./routes/product.route.js";
import uploadRouter from "./routes/upload.route.js";
import orderRouter from "./routes/order.route.js";
import addressRouter from "./routes/address.route.js";
import adminRouter from "./routes/admin.route.js";
import deliveryPartnerRouter from "./routes/deliveryPartner.route.js";
import { stripeWebhook } from "./controllers/webhooks.controller.js";

const app = express();

app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ── Middleware  ─────────────────────
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// ── Health check ─────────────────────
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Grocery Delivery Shop (Live Order Tracking) is running 🚀",
  });
});

// ── Endpoint routes ─────────────────────
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/orders", orderRouter);
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/addresses", addressRouter);
app.use("/api/admin", adminRouter);
app.use("/api/delivery", deliveryPartnerRouter);

// ── Error handling(server) ─────────────────────
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(500).json({
    message: error.message,
  });
});

// ✅ Only listen locally, Vercel handles this in production
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

export default app; // ✅ Vercel needs this
