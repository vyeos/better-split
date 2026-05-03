import jwt from "@elysia/jwt";
import Elysia from "elysia";
import { TransactionsService } from "../services/transactions.services";

export const TransactionsApp = new Elysia({ prefix: "/transactions" })
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
        const transactions = await TransactionsService.getTransactions(userId);
        return status(200, transactions);
      } catch {
        return status(400, { message: "Error fetching transactions" });
      }
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, userId, status }) => {
      try {
        const transaction = await TransactionsService.getTransaction(id, userId);
        return status(200, transaction);
      } catch (e) {
        if (e instanceof Error && e.message === "Transaction not found") {
          return status(404, { message: "Transaction not found" });
        }
        return status(400, { message: "Error fetching transaction" });
      }
    },
  )
  .post(
    "/:id/confirm",
    async ({ params: { id }, userId, status }) => {
      try {
        await TransactionsService.confirmTransaction(id, userId);
        return status(200, { message: "Transaction confirmed" });
      } catch (e) {
        if (e instanceof Error && e.message === "Transaction not found") {
          return status(404, { message: "Transaction not found" });
        }
        if (e instanceof Error && e.message === "Transaction already confirmed") {
          return status(400, { message: "Transaction already confirmed" });
        }
        return status(400, { message: "Error confirming transaction" });
      }
    },
  );