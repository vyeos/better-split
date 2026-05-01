import { Elysia } from "elysia";

export const GroupsApp = new Elysia({ prefix: "/groups" })
  .post("/", () => {}, {})
  .get("/", () => {}, {})
  .post("/:id", () => {}, {})
  .delete("/:id", () => {}, {})
  .patch("/:id", () => {}, {})
  .post("/:id/join", () => {}, {})
  .post("/:id/invite", () => {}, {})
  .delete("/:id/leave", () => {}, {})
  .get("/:id/members", () => {}, {})
  .patch("/:id/members/:userId", () => {}, {})
  .post("/:id/expenses", () => {}, {})
  .get("/:id/expenses", () => {}, {})
  .get("/:id/balances", () => {}, {})
  .post("/:id/settle", () => {}, {})
  .get("/:id/transactions", () => {}, {})
  .get("/:id/activity", () => {}, {});
