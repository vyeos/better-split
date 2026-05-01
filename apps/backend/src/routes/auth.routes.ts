import jwt from "@elysia/jwt";
import Elysia, { t } from "elysia";
import { AuthModel } from "../models/auth.models";
import { AuthService } from "../services/auth.services";

export const AuthApp = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "Fischl von Luftschloss Narfidort",
    }),
  )
  .post(
    "/signup",
    async ({ body, jwt, cookie: { auth }, status }) => {
      try {
        const user = await AuthService.signUp(
          body.name,
          body.email,
          body.password,
        );
        const value = await jwt.sign({ userId: user.id });
        auth.set({
          value,
          httpOnly: true,
          maxAge: 7 * 86400,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        return status(200, { message: "Signed Up Successfully" });
      } catch (e) {
        console.error(e);
        if (e instanceof Error && e.message.includes("already exists"))
          return status(400, { message: "User already exists" });
        else return status(400, { message: "Error while signing up" });
      }
    },
    {
      body: AuthModel.signUpBody,
      response: {
        200: AuthModel.signUpResponse,
        400: AuthModel.signUpFailure,
      },
    },
  )
  .post(
    "/login",
    async ({ body, jwt, status, cookie: { auth } }) => {
      try {
        const user = await AuthService.signIn(body.email, body.password);
        const value = await jwt.sign({ userId: user.id });
        auth.set({
          value,
          httpOnly: true,
          maxAge: 7 * 86400,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        return status(200, { message: "Signed In Successfully" });
      } catch (e) {
        if (e instanceof Error && e.message.includes("exists"))
          return status(400, { message: "User doesn't exist with this email" });
        else return status(400, { message: "Invalid credentials" });
      }
    },
    {
      body: AuthModel.signInBody,
      response: {
        200: AuthModel.signInResponse,
        400: AuthModel.signInFailure,
      },
    },
  )
  .resolve(async ({ jwt, cookie: { auth }, status }) => {
    try {
      const payload = await jwt.verify(auth.value as string);
      if (!payload || !("userId" in payload)) {
        return status(401, { message: "Unauthorized" });
      }
      return { userId: payload.userId as string };
    } catch {
      return status(401, "Invalid or expired token");
    }
  })
  .get(
    "/me",
    async ({ userId, status }) => {
      console.log(userId);
      try {
        const userData = await AuthService.getUserById(userId);
        if (!userData) return status(404, { message: "User not found" });
        return status(200, userData);
      } catch {
        return status(400, { message: "Error fetching profile" });
      }
    },
    {
      response: {
        200: AuthModel.meResponse,
        404: AuthModel.meFailure,
        400: AuthModel.meFailure,
      },
    },
  )
  .get(
    "/me/debts",
    async ({ userId, status }) => {
      try {
        const debts = await AuthService.getUserDebts(userId);
        return status(200, debts);
      } catch {
        return status(500, { message: "Error fetching debts" });
      }
    },
    {
      response: {
        200: AuthModel.debtResposne,
        500: AuthModel.debtFailure,
      },
    },
  );
