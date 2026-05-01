import { Elysia } from "elysia";

export const PaymentsApp = new Elysia({ prefix: "/payments" }).post(
  "/:id",
  () => {},
  {},
);
