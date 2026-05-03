import jwt from "@elysia/jwt";
import Elysia from "elysia";
import { PaymentsService } from "../services/payments.services";

export const PaymentsApp = new Elysia({ prefix: "/payments" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .resolve(async ({ jwt, cookie: { auth }, status }) => {
    try {
      const payload = await jwt.verify(auth.value as string);
      if (!payload || !("userId" in payload)) {
        return status(401, { message: "Unauthorized" });
      }
      return { userId: payload.userId as string };
    } catch {
      return status(401, { message: "Invalid or expired token" });
    }
  })
  .get(
    "/",
    async ({ userId, status }) => {
      try {
        const payments = await PaymentsService.getPayments(userId);
        return status(200, payments);
      } catch {
        return status(400, { message: "Error fetching payments" });
      }
    },
  )
  .get(
    "/sent",
    async ({ userId, status }) => {
      try {
        const payments = await PaymentsService.getSentPayments(userId);
        return status(200, payments);
      } catch {
        return status(400, { message: "Error fetching sent payments" });
      }
    },
  )
  .get(
    "/received",
    async ({ userId, status }) => {
      try {
        const payments = await PaymentsService.getReceivedPayments(userId);
        return status(200, payments);
      } catch {
        return status(400, { message: "Error fetching received payments" });
      }
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, userId, status }) => {
      try {
        const payment = await PaymentsService.getPayment(id, userId);
        return status(200, payment);
      } catch (e) {
        if (e instanceof Error && e.message === "Payment not found") {
          return status(404, { message: "Payment not found" });
        }
        return status(400, { message: "Error fetching payment" });
      }
    },
  )
  .post(
    "/:id/accept",
    async ({ params: { id }, userId, status }) => {
      try {
        await PaymentsService.acceptPayment(id, userId);
        return status(200, { message: "Payment accepted" });
      } catch (e) {
        if (e instanceof Error && e.message === "Payment not found") {
          return status(404, { message: "Payment not found" });
        }
        if (e instanceof Error && e.message === "Payment already accepted") {
          return status(400, { message: "Payment already accepted" });
        }
        return status(400, { message: "Error accepting payment" });
      }
    },
  )
  .post(
    "/:id/reject",
    async ({ params: { id }, userId, status }) => {
      try {
        await PaymentsService.rejectPayment(id, userId);
        return status(200, { message: "Payment rejected" });
      } catch (e) {
        if (e instanceof Error && e.message === "Payment not found") {
          return status(404, { message: "Payment not found" });
        }
        if (e instanceof Error && e.message === "Payment already accepted") {
          return status(400, { message: "Payment already accepted" });
        }
        return status(400, { message: "Error rejecting payment" });
      }
    },
  );