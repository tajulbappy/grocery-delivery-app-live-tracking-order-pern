import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/db.js";
import { inngest } from "../inngest/index.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const endpointSecret = process.env.STRIPE_WEB_SECRET;

export const stripeWebhook = async (request: Request, response: Response) => {
  // --------------------------------------------------
  // 1. Make sure webhook secret exists
  // --------------------------------------------------
  if (!endpointSecret) {
    console.error("STRIPE_WEB_SECRET is not configured");

    return response.status(500).json({
      message: "Stripe webhook secret is not configured",
    });
  }

  // --------------------------------------------------
  // 2. Get Stripe signature
  // --------------------------------------------------
  const signature = request.headers["stripe-signature"];

  if (!signature) {
    console.error("Missing Stripe signature");

    return response.status(400).json({
      message: "Missing Stripe signature",
    });
  }

  // --------------------------------------------------
  // 3. Verify and construct Stripe event
  // --------------------------------------------------
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      signature,
      endpointSecret
    );
  } catch (error: any) {
    console.error("⚠️ Webhook signature verification failed:", error.message);

    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  console.log(`✅ Stripe webhook received: ${event.type}`);

  // --------------------------------------------------
  // 4. Handle Stripe events
  // --------------------------------------------------
  try {
    switch (event.type) {
      // ==================================================
      // PAYMENT SUCCESS
      // ==================================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Stripe Checkout Session:", session.id);

        // Make sure payment was actually successful
        if (session.payment_status !== "paid") {
          console.log(`Checkout session ${session.id} is not paid yet`);
          break;
        }

        // Get orderId from metadata
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error(`No orderId found in Stripe session ${session.id}`);
          break;
        }

        // --------------------------------------------------
        // Find order
        // --------------------------------------------------
        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          console.error(`Order ${orderId} not found`);
          break;
        }

        // --------------------------------------------------
        // Idempotency protection
        // --------------------------------------------------
        // If Stripe sends the same event again, don't
        // decrease stock twice.
        if (order.isPaid) {
          console.log(`Order ${orderId} is already marked as paid`);
          break;
        }

        // --------------------------------------------------
        // Mark order as paid
        // --------------------------------------------------
        const paidOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
          },
        });

        // --------------------------------------------------
        // Decrease product stock
        // --------------------------------------------------
        const orderItems = Array.isArray(paidOrder.items)
          ? paidOrder.items
          : [];

        for (const item of orderItems as any[]) {
          await prisma.product.update({
            where: { id: item.product },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // --------------------------------------------------
        // Send inventory update events
        // --------------------------------------------------
        for (const item of orderItems as any[]) {
          await inngest.send({
            name: "inventory/stock.updated",
            data: {
              productId: item.product,
            },
          });
        }

        // --------------------------------------------------
        // Send order placed event
        // --------------------------------------------------
        await inngest.send({
          name: "order/placed",
          data: {
            orderId,
          },
        });

        console.log(`✅ Order ${orderId} payment processed successfully`);

        break;
      }

      // ==================================================
      // PAYMENT FAILED
      // ==================================================
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log(`❌ Payment failed: ${paymentIntent.id}`);

        // We don't delete the order here.
        // Keeping the order is better for tracking/debugging.
        break;
      }

      // ==================================================
      // PAYMENT CANCELED
      // ==================================================
      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        console.log(`⚠️ Payment canceled: ${paymentIntent.id}`);

        // Keep the order instead of deleting it.
        break;
      }

      // ==================================================
      // OTHER EVENTS
      // ==================================================
      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }

    // --------------------------------------------------
    // 5. Acknowledge Stripe
    // --------------------------------------------------
    return response.status(200).json({
      received: true,
    });
  } catch (error: any) {
    console.error("❌ Stripe webhook processing error:", error);

    return response.status(500).json({
      message: "Webhook processing failed",
    });
  }
};
