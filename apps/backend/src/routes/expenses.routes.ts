import jwt from "@elysia/jwt";
import { Elysia } from "elysia";
import { ExpensesModel } from "../models/expenses.models";
import { ExpensesService } from "../services/expenses.services";

export const ExpensesApp = new Elysia({ prefix: "/expenses" })
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
    "/:id",
    async ({ params: { id }, userId, status }) => {
      try {
        const expense = await ExpensesService.getExpense(id, userId);
        if (!expense) return status(404, { message: "Expense not found" });
        return expense;
      } catch (e) {
        if (e instanceof Error && e.message === "Access denied") {
          return status(403, { message: "Access denied" });
        }
        if (e instanceof Error && e.message === "Expense not found") {
          return status(404, { message: "Expense not found" });
        }
        return status(400, { message: "Error fetching expense" });
      }
    },
    {
      response: {
        200: ExpensesModel.getExpenseResponse,
        403: ExpensesModel.getExpenseFailure,
        404: ExpensesModel.getExpenseFailure,
        400: ExpensesModel.getExpenseFailure,
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, userId, status }) => {
      try {
        const expense = await ExpensesService.updateExpense(id, userId, {
          amount: body.amount,
          note: body.note,
        });
        return status(200, expense);
      } catch (e) {
        if (e instanceof Error && e.message === "Access denied") {
          return status(403, { message: "Access denied" });
        }
        if (e instanceof Error && e.message === "Expense not found") {
          return status(404, { message: "Expense not found" });
        }
        return status(400, { message: "Error updating expense" });
      }
    },
    {
      body: ExpensesModel.updateExpenseBody,
      response: {
        200: ExpensesModel.updateExpenseResponse,
        403: ExpensesModel.updateExpenseFailure,
        404: ExpensesModel.updateExpenseFailure,
        400: ExpensesModel.updateExpenseFailure,
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, userId, status }) => {
      try {
        await ExpensesService.deleteExpense(id, userId);
        return status(200, { message: "Expense deleted" });
      } catch (e) {
        if (e instanceof Error && e.message === "Access denied") {
          return status(403, { message: "Access denied" });
        }
        return status(400, { message: "Failed to delete Expense" });
      }
    },
    {
      response: {
        200: ExpensesModel.deleteExpenseResponse,
        403: ExpensesModel.deleteExpenseFailure,
        400: ExpensesModel.deleteExpenseFailure,
      },
    },
  );