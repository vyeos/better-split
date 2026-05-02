import { t, UnwrapSchema } from "elysia";

export const GROUP_TYPES = ["HOME", "COUPLE", "TRIP", "OTHER"] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

export const GroupsModel = {
  createGroupBody: t.Object({
    name: t.String({ minLength: 1 }),
    type: t.Optional(t.String({ enum: GROUP_TYPES })),
    currency: t.Optional(t.String()),
  }),
  createGroupResponse: t.Object({
    id: t.String(),
    name: t.String(),
    link: t.String(),
    type: t.String(),
    currency: t.String(),
    created_at: t.Date(),
  }),
  createGroupFailure: t.Object({
    message: t.Literal("Error creating group"),
  }),
  getGroupsResponse: t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      type: t.String(),
      currency: t.String(),
      created_at: t.Date(),
    }),
  ),
  getGroupsFailure: t.Object({
    message: t.Literal("Error fetching groups"),
  }),
  getGroupResponse: t.Object({
    id: t.String(),
    name: t.String(),
    link: t.String(),
    type: t.String(),
    currency: t.String(),
    created_by: t.Object({
      id: t.String(),
      name: t.String(),
    }),
    created_at: t.Date(),
    updated_at: t.Date(),
  }),
  getGroupFailure: t.Object({
    message: t.Union([
      t.Literal("Access denied"),
      t.Literal("Group not found"),
    ]),
  }),
  joinGroupBody: t.Object({
    link: t.String(),
  }),
  joinGroupResponse: t.Object({
    message: t.Literal("Joined successfully"),
  }),
  joinGroupFailure: t.Object({
    message: t.Union([
      t.Literal("Invalid invite link"),
      t.Literal("Already a member"),
      t.Literal("Error joining group"),
    ]),
  }),
  inviteGroupResponse: t.Object({
    message: t.Literal("Joined successfully"),
  }),
  inviteGroupFailure: t.Union([
    t.Object({ message: t.Literal("Invalid invite link") }),
    t.Object({ message: t.Literal("Already a member") }),
    t.Object({ message: t.Literal("Error joining group") }),
  ]),
  leaveGroupResponse: t.Object({
    message: t.Literal("Left successfully"),
  }),
  leaveGroupFailure: t.Object({
    message: t.Union([
      t.Literal("Not a member"),
      t.Literal("Error leaving group"),
    ]),
  }),
  deleteGroupResponse: t.Object({
    message: t.Literal("Group deleted"),
  }),
  deleteGroupFailure: t.Object({
    message: t.Union([
      t.Literal("Only admins can delete the group"),
      t.Literal("Error deleting group"),
    ]),
  }),
  getMembersResponse: t.Array(
    t.Object({
      id: t.String(),
      user: t.Object({
        id: t.String(),
        name: t.String(),
        email: t.String(),
      }),
      role: t.String(),
      joined_at: t.Date(),
    }),
  ),
  getMembersFailure: t.Object({
    message: t.Literal("Access denied"),
  }),
  updateMemberBody: t.Object({
    userId: t.String(),
    role: t.Union([t.Literal("ADMIN"), t.Literal("MEMBER")]),
  }),
  updateMemberResponse: t.Object({
    message: t.Literal("Role updated"),
  }),
  updateMemberFailure: t.Object({
    message: t.Union([
      t.Literal("Only admins can update roles"),
      t.Literal("Member not found"),
    ]),
  }),
  updateGroupBody: t.Object({
    name: t.Optional(t.String({ minLength: 1 })),
    currency: t.Optional(t.String()),
    type: t.Optional(t.String({ enum: GROUP_TYPES })),
  }),
  updateGroupResponse: t.Object({
    id: t.String(),
    name: t.String(),
    link: t.String(),
    type: t.String(),
    currency: t.String(),
  }),
  updateGroupFailure: t.Object({
    message: t.Union([
      t.Literal("Only admins can update group"),
      t.Literal("Error updating group"),
    ]),
  }),
  createExpenseBody: t.Object({
    amount: t.Number({ minimum: 0 }),
    note: t.Optional(t.String()),
    splits: t.Array(
      t.Object({
        userId: t.String(),
        amountOwed: t.Number(),
      }),
    ),
  }),
  createExpenseResponse: t.Object({
    id: t.String(),
    amount: t.Number(),
    note: t.Nullable(t.String()),
    created_at: t.Date(),
  }),
  createExpenseFailure: t.Object({
    message: t.Literal("Access denied"),
  }),
  getExpensesResponse: t.Array(
    t.Object({
      id: t.String(),
      amount: t.Number(),
      note: t.Nullable(t.String()),
      paidBy: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      created_at: t.Date(),
    }),
  ),
  getExpensesFailure: t.Object({
    message: t.Literal("Access denied"),
  }),
  getBalancesResponse: t.Array(
    t.Object({
      fromUser: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      toUser: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      amount: t.Number(),
    }),
  ),
  getBalancesFailure: t.Object({
    message: t.Literal("Access denied"),
  }),
  settleBody: t.Object({
    toUserId: t.String(),
  }),
  settleResponse: t.Object({
    message: t.Literal("Settled successfully"),
  }),
  settleFailure: t.Object({
    message: t.Union([
      t.Literal("No balance to settle"),
      t.Literal("Access denied"),
    ]),
  }),
  getTransactionsResponse: t.Array(
    t.Object({
      id: t.String(),
      amount: t.Number(),
      status: t.String(),
      fromUser: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      toUser: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      settled_at: t.Nullable(t.Date()),
      created_at: t.Date(),
    }),
  ),
  getTransactionsFailure: t.Object({
    message: t.Literal("Access denied"),
  }),
  getActivityResponse: t.Array(
    t.Object({
      id: t.String(),
      type: t.String(),
      user: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      metadata: t.Nullable(t.Object({})),
      created_at: t.Date(),
    }),
  ),
  getActivityFailure: t.Object({
    message: t.Literal("Access denied"),
  }),
};

export type GroupsModel = {
  [k in keyof typeof GroupsModel]: UnwrapSchema<(typeof GroupsModel)[k]>;
};
