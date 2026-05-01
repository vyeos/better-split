import { Elysia } from "elysia";

export const TransactionsApp = new Elysia({ prefix: "/transactions" }).post(
  "/:id/confirm",
  () => {},
  {},
);
