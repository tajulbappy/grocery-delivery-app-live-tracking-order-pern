import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import { serve } from "inngest/express";

import { inngest, functions } from "./inngest/index.js";
import authRouter from "./routes/auth.route.js";
import productRouter from "./routes/product.route.js";
import uploadRouter from "./routes/upload.route.js";
import orderRouter from "./routes/order.route.js";

const app = express();

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
