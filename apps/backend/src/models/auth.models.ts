import { t, UnwrapSchema } from "elysia";

export const AuthModel = {
  signUpBody: t.Object({
    name: t.String({ minLength: 3 }),
    email: t.String({ format: "email" }),
    password: t.String({ minLength: 8 }),
  }),
  signUpResponse: t.Object({
    message: t.Literal("Signed Up Successfully"),
  }),
  signUpFailure: t.Object({
    message: t.Union([
      t.Literal("Error while signing up"),
      t.Literal("User already exists"),
    ]),
  }),
  signInBody: t.Object({
    email: t.String(),
    password: t.String(),
  }),
  signInResponse: t.Object({
    message: t.Literal("Signed In Successfully"),
  }),
  signInFailure: t.Object({
    message: t.Union([
      t.Literal("Invalid credentials"),
      t.Literal("User doesn't exist with this email"),
    ]),
  }),
  meResponse: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String(),
    payment_link: t.Nullable(t.String()),
    created_at: t.Date(),
    updated_at: t.Date(),
  }),
  meFailure: t.Object({
    message: t.Union([
      t.Literal("User not found"),
      t.Literal("Error fetching profile"),
    ]),
  }),
  debtResposne: t.Array(
    t.Object({
      id: t.String(),
      groupId: t.String(),
      groupName: t.String(),
      groupCurrency: t.String(),
      fromUserId: t.String(),
      fromUserName: t.String(),
      toUserId: t.String(),
      toUserName: t.String(),
      amount: t.Number(),
    }),
  ),
  debtFailure: t.Object({
    message: t.Literal("Error fetching debts"),
  }),
};

export type AuthModel = {
  [k in keyof typeof AuthModel]: UnwrapSchema<(typeof AuthModel)[k]>;
};
