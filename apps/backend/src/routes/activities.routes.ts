import jwt from "@elysia/jwt";
import Elysia from "elysia";
import { ActivitiesService } from "../services/activities.services";

export const ActivitiesApp = new Elysia({ prefix: "/activities" })
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
        const activities = await ActivitiesService.getUserActivities(userId);
        return status(200, activities);
      } catch {
        return status(400, { message: "Error fetching activities" });
      }
    },
  );