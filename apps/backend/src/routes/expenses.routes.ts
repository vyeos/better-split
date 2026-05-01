import { Elysia } from "elysia";

export const ExpensesApp = new Elysia({ prefix: "/expenses" })
  .get("/:id", () => {}, {})
  .patch("/:id", () => {}, {})
  .delete("/:id", () => {}, {});
