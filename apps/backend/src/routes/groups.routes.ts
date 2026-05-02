import jwt from "@elysia/jwt";
import Elysia from "elysia";
import { GroupsModel, type GroupType } from "../models/groups.model";
import { GroupsService } from "../services/groups.service";

export const GroupsApp = new Elysia({ prefix: "/groups" })
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
  .post(
    "/",
    async ({ body, userId, status }) => {
      try {
        const group = await GroupsService.createGroup(
          userId,
          body.name,
          body.type as GroupType,
          body.currency,
        );
        return status(200, {
          id: group.id,
          name: group.name,
          link: group.link,
          type: group.type,
          currency: group.currency,
          created_at: group.created_at,
        });
      } catch {
        return status(400, { message: "Error creating group" });
      }
    },
    {
      body: GroupsModel.createGroupBody,
      response: {
        200: GroupsModel.createGroupResponse,
        400: GroupsModel.createGroupFailure,
      },
    },
  )
  .get(
    "/",
    async ({ userId, status }) => {
      try {
        const groups = await GroupsService.getGroups(userId);
        return status(200, groups);
      } catch {
        return status(400, { message: "Error fetching groups" });
      }
    },
    {
      response: {
        200: GroupsModel.getGroupsResponse,
        400: GroupsModel.getGroupsFailure,
      },
    },
  )
  .get(
    "/:groupId",
    async ({ params: { groupId }, userId, status }) => {
      try {
        const group = await GroupsService.getGroupById(groupId, userId);
        return status(200, {
          id: group.id,
          name: group.name,
          link: group.link,
          type: group.type,
          currency: group.currency,
          created_by: group.created_by,
          created_at: group.created_at,
          updated_at: group.updated_at,
        });
      } catch (e) {
        if (e instanceof Error && e.message === "Access denied") {
          return status(403, { message: "Access denied" });
        }
        return status(404, { message: "Group not found" });
      }
    },
    {
      response: {
        200: GroupsModel.getGroupResponse,
        403: GroupsModel.getGroupFailure,
        404: GroupsModel.getGroupFailure,
      },
    },
  )
  .post(
    "/join",
    async ({ body, userId, status }) => {
      try {
        await GroupsService.joinGroup(userId, body.link);
        return status(200, { message: "Joined successfully" });
      } catch (e) {
        if (e instanceof Error && e.message === "Invalid invite link") {
          return status(400, { message: "Invalid invite link" });
        }
        if (e instanceof Error && e.message === "Already a member") {
          return status(400, { message: "Already a member" });
        }
        return status(400, { message: "Error joining group" });
      }
    },
    {
      body: GroupsModel.joinGroupBody,
      response: {
        200: GroupsModel.joinGroupResponse,
        400: GroupsModel.joinGroupFailure,
      },
    },
  )
  // use group link to invite instead of groupId
  .post(
    "/:groupLink/invite",
    async ({ params: { groupLink }, userId, status }) => {
      try {
        const result = await GroupsService.inviteGroup(groupLink, userId);
        return status(200, { message: result.message as "Joined successfully" });
      } catch (e) {
        if (e instanceof Error && e.message === "Invalid invite link") {
          return status(400, { message: "Invalid invite link" });
        }
        if (e instanceof Error && e.message === "Already a member") {
          return status(400, { message: "Already a member" });
        }
        return status(400, { message: "Error joining group" });
      }
    },
    {
      response: {
        200: GroupsModel.inviteGroupResponse,
        400: GroupsModel.inviteGroupFailure,
      },
    },
  )
  .delete(
    "/:groupId/leave",
    async ({ params: { groupId }, userId, status }) => {
      try {
        await GroupsService.leaveGroup(groupId, userId);
        return status(200, { message: "Left successfully" });
      } catch (e) {
        if (e instanceof Error && e.message === "Not a member") {
          return status(400, { message: "Not a member" });
        }
        return status(400, { message: "Error leaving group" });
      }
    },
    {
      response: {
        200: GroupsModel.leaveGroupResponse,
        400: GroupsModel.leaveGroupFailure,
      },
    },
  )
  .delete(
    "/:groupId",
    async ({ params: { groupId }, userId, status }) => {
      try {
        await GroupsService.deleteGroup(groupId, userId);
        return status(200, { message: "Group deleted" });
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === "Only admins can delete the group"
        ) {
          return status(403, { message: "Only admins can delete the group" });
        }
        return status(400, { message: "Error deleting group" });
      }
    },
    {
      response: {
        200: GroupsModel.deleteGroupResponse,
        403: GroupsModel.deleteGroupFailure,
        400: GroupsModel.deleteGroupFailure,
      },
    },
  )
  .get(
    "/:groupId/members",
    async ({ params: { groupId }, userId, status }) => {
      try {
        const members = await GroupsService.getMembers(groupId, userId);
        return status(200, members);
      } catch {
        return status(403, { message: "Access denied" });
      }
    },
    {
      response: {
        200: GroupsModel.getMembersResponse,
        403: GroupsModel.getMembersFailure,
      },
    },
  )
  .patch(
    "/:groupId/members/:userId",
    async ({ params: { groupId, userId: targetUserId }, body, status }) => {
      try {
        await GroupsService.updateMemberRole(
          groupId,
          targetUserId,
          body.userId,
          body.role,
        );
        return status(200, { message: "Role updated" });
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === "Only admins can update roles"
        ) {
          return status(403, { message: "Only admins can update roles" });
        }
        return status(404, { message: "Member not found" });
      }
    },
    {
      body: GroupsModel.updateMemberBody,
      response: {
        200: GroupsModel.updateMemberResponse,
        403: GroupsModel.updateMemberFailure,
        404: GroupsModel.updateMemberFailure,
      },
    },
  )
  .patch(
    "/:groupId",
    async ({ params: { groupId }, body, userId, status }) => {
      try {
        const group = await GroupsService.updateGroup(groupId, userId, {
          name: body.name,
          currency: body.currency,
          type: body.type as GroupType,
        });
        return status(200, {
          id: group.id,
          name: group.name,
          link: group.link,
          type: group.type,
          currency: group.currency,
        });
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === "Only admins can update group"
        ) {
          return status(403, { message: "Only admins can update group" });
        }
        return status(400, { message: "Error updating group" });
      }
    },
    {
      body: GroupsModel.updateGroupBody,
      response: {
        200: GroupsModel.updateGroupResponse,
        403: GroupsModel.updateGroupFailure,
        400: GroupsModel.updateGroupFailure,
      },
    },
  )
  .post(
    "/:groupId/expenses",
    async ({ params: { groupId }, body, userId, status }) => {
      try {
        const expense = await GroupsService.createExpense(
          groupId,
          userId,
          body.amount,
          body.note ?? null,
          body.splits,
        );
        return status(200, {
          id: expense.id,
          amount: expense.amount,
          note: expense.note,
          created_at: expense.created_at,
        });
      } catch {
        return status(403, { message: "Access denied" });
      }
    },
    {
      body: GroupsModel.createExpenseBody,
      response: {
        200: GroupsModel.createExpenseResponse,
        403: GroupsModel.createExpenseFailure,
      },
    },
  )
  .get(
    "/:groupId/expenses",
    async ({ params: { groupId }, userId, status }) => {
      try {
        const expenses = await GroupsService.getExpenses(groupId, userId);
        return status(200, expenses);
      } catch {
        return status(403, { message: "Access denied" });
      }
    },
    {
      response: {
        200: GroupsModel.getExpensesResponse,
        403: GroupsModel.getExpensesFailure,
      },
    },
  )
  .get(
    "/:groupId/balances",
    async ({ params: { groupId }, userId, status }) => {
      try {
        const balances = await GroupsService.getBalances(groupId, userId);
        return status(200, balances);
      } catch {
        return status(403, { message: "Access denied" });
      }
    },
    {
      response: {
        200: GroupsModel.getBalancesResponse,
        403: GroupsModel.getBalancesFailure,
      },
    },
  )
  .post(
    "/:groupId/settle",
    async ({ params: { groupId }, body, userId, status }) => {
      try {
        await GroupsService.settle(groupId, userId, body.toUserId);
        return status(200, { message: "Settled successfully" });
      } catch (e) {
        if (e instanceof Error && e.message === "No balance to settle") {
          return status(400, { message: "No balance to settle" });
        }
        return status(403, { message: "Access denied" });
      }
    },
    {
      body: GroupsModel.settleBody,
      response: {
        200: GroupsModel.settleResponse,
        400: GroupsModel.settleFailure,
        403: GroupsModel.settleFailure,
      },
    },
  )
  .get(
    "/:groupId/transactions",
    async ({ params: { groupId }, userId, status }) => {
      try {
        const transactions = await GroupsService.getTransactions(
          groupId,
          userId,
        );
        return status(200, transactions);
      } catch {
        return status(403, { message: "Access denied" });
      }
    },
    {
      response: {
        200: GroupsModel.getTransactionsResponse,
        403: GroupsModel.getTransactionsFailure,
      },
    },
  )
  .get(
    "/:groupId/activity",
    async ({ params: { groupId }, userId, status }) => {
      try {
        const activity = await GroupsService.getActivity(groupId, userId);
        return status(200, activity);
      } catch {
        return status(403, { message: "Access denied" });
      }
    },
    {
      response: {
        200: GroupsModel.getActivityResponse,
        403: GroupsModel.getActivityFailure,
      },
    },
  );
