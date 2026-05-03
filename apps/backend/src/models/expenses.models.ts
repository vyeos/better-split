import { t, UnwrapSchema } from "elysia";

export const ExpensesModel = {
  getExpenseResponse: t.Object({
    id: t.String(),
    amount: t.Number(),
    note: t.Nullable(t.String()),
    paid_by: t.Object({
      id: t.String(),
      name: t.String(),
    }),
    created_by: t.Object({
      id: t.String(),
      name: t.String(),
    }),
    splits: t.Array(
      t.Object({
        id: t.String(),
        user: t.Object({
          id: t.String(),
          name: t.String(),
        }),
        amount_owed: t.Number(),
      }),
    ),
    created_at: t.Date(),
    updated_at: t.Date(),
  }),
  getExpenseFailure: t.Object({
    message: t.Union([
      t.Literal("Error fetching expense"),
      t.Literal("Expense not found"),
      t.Literal("Access denied"),
    ]),
  }),
  updateExpenseBody: t.Object({
    amount: t.Optional(t.Number({ minimum: 0 })),
    note: t.Optional(t.String()),
  }),
  updateExpenseResponse: t.Object({
    id: t.String(),
    amount: t.Number(),
    note: t.Nullable(t.String()),
    created_at: t.Date(),
    updated_at: t.Date(),
  }),
  updateExpenseFailure: t.Object({
    message: t.Union([
      t.Literal("Error updating expense"),
      t.Literal("Expense not found"),
      t.Literal("Access denied"),
    ]),
  }),
  deleteExpenseResponse: t.Object({
    message: t.Literal("Expense deleted"),
  }),
  deleteExpenseFailure: t.Object({
    message: t.Union([
      t.Literal("Failed to delete Expense"),
      t.Literal("Access denied"),
    ]),
  }),
};

export type ExpensesModel = {
  [k in keyof typeof ExpensesModel]: UnwrapSchema<(typeof ExpensesModel)[k]>;
};