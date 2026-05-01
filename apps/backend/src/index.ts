import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { AuthApp } from "./routes/auth.routes";
import { GroupsApp } from "./routes/groups.routes";
import { ExpensesApp } from "./routes/expenses.routes";
import { TransactionsApp } from "./routes/transactions.routes";
import { PaymentsApp } from "./routes/payments.routes";
import "dotenv/config";

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:3001",
      credentials: true,
    }),
  )
  .get("/", () => {
    "Hello Elysia";
    console.log(process.env.DATABASE_URL)
  })
  .use(AuthApp)
  .use(GroupsApp)
  .use(ExpensesApp)
  .use(TransactionsApp)
  .use(PaymentsApp)
  .listen(3000);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
