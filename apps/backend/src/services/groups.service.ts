import { db } from "db";

function generateLink(): string {
  return Math.random().toString(36).substring(2, 15);
}

export abstract class GroupsService {
  static async createGroup(
    userId: string,
    name: string,
    type: "HOME" | "COUPLE" | "TRIP" | "OTHER" = "OTHER",
    currency: string = "USD",
  ) {
    const group = await db.group.create({
      data: {
        name,
        type,
        currency,
        link: generateLink(),
        createdUserId: userId,
        groupMeta: {
          create: {
            simplified_debts: true,
            default_split_type: "EQUAL",
          },
        },
      },
      include: {
        groupMeta: true,
      },
    });

    await db.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: "ADMIN",
      },
    });

    return group;
  }

  static async getGroups(userId: string) {
    const memberships = await db.groupMember.findMany({
      where: { userId },
      include: {
        group: true,
      },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      type: m.group.type,
      currency: m.group.currency,
      created_at: m.group.created_at,
    }));
  }

  static async getGroupById(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        created_by: {
          select: { id: true, name: true },
        },
      },
    });

    if (!group) throw new Error("Group not found");

    return group;
  }

  static async joinGroup(userId: string, link: string) {
    const group = await db.group.findFirst({
      where: { link },
    });

    if (!group) throw new Error("Invalid invite link");

    const existingMember = await db.groupMember.findFirst({
      where: { groupId: group.id, userId },
    });

    if (existingMember) throw new Error("Already a member");

    await db.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: "MEMBER",
      },
    });

    return group;
  }

  static async inviteGroup(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const group = await db.group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new Error("Group not found");

    return { link: group.link };
  }

  static async leaveGroup(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Not a member");

    await db.groupMember.delete({
      where: { id: membership.id },
    });

    const remainingMembers = await db.groupMember.count({
      where: { groupId },
    });

    if (remainingMembers === 0) {
      await db.group.delete({ where: { id: groupId } });
    }
  }

  static async deleteGroup(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership || membership.role !== "ADMIN") {
      throw new Error("Only admins can delete the group");
    }

    await db.group.delete({ where: { id: groupId } });
  }

  static async getMembers(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const members = await db.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      user: m.user,
      role: m.role,
      joined_at: m.joined_at,
    }));
  }

  static async updateMemberRole(
    groupId: string,
    targetUserId: string,
    adminUserId: string,
    role: "ADMIN" | "MEMBER",
  ) {
    const adminMembership = await db.groupMember.findFirst({
      where: { groupId, userId: adminUserId },
    });

    if (!adminMembership || adminMembership.role !== "ADMIN") {
      throw new Error("Only admins can update roles");
    }

    const targetMembership = await db.groupMember.findFirst({
      where: { groupId, userId: targetUserId },
    });

    if (!targetMembership) throw new Error("Member not found");

    await db.groupMember.update({
      where: { id: targetMembership.id },
      data: { role },
    });
  }

  static async updateGroup(
    groupId: string,
    userId: string,
    data: { name?: string; currency?: string; type?: "HOME" | "COUPLE" | "TRIP" | "OTHER" },
  ) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership || membership.role !== "ADMIN") {
      throw new Error("Only admins can update group");
    }

    const group = await db.group.update({
      where: { id: groupId },
      data,
    });

    return group;
  }

  static async createExpense(
    groupId: string,
    userId: string,
    amount: number,
    note: string | null,
    splits: { userId: string; amountOwed: number }[],
  ) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const expense = await db.expense.create({
      data: {
        groupId,
        paidUserId: userId,
        createdUserId: userId,
        amount,
        note,
        splits: {
          create: splits.map((s) => ({
            userId: s.userId,
            amount_owed: s.amountOwed,
          })),
        },
      },
      include: {
        splits: true,
      },
    });

    await this.updateBalances(groupId, userId, splits);

    return expense;
  }

  private static async updateBalances(
    groupId: string,
    paidByUserId: string,
    splits: { userId: string; amountOwed: number }[],
  ) {
    for (const split of splits) {
      if (split.userId === paidByUserId) continue;

      const existingBalance = await db.groupBalance.findFirst({
        where: {
          groupId,
          fromUserId: split.userId,
          toUserId: paidByUserId,
        },
      });

      if (existingBalance) {
        await db.groupBalance.update({
          where: { id: existingBalance.id },
          data: { amount: existingBalance.amount + split.amountOwed },
        });
      } else {
        await db.groupBalance.create({
          data: {
            groupId,
            fromUserId: split.userId,
            toUserId: paidByUserId,
            amount: split.amountOwed,
          },
        });
      }
    }
  }

  static async getExpenses(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const expenses = await db.expense.findMany({
      where: { groupId },
      include: {
        paid_by: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      note: e.note,
      paidBy: e.paid_by,
      created_at: e.created_at,
    }));
  }

  static async getBalances(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const balances = await db.groupBalance.findMany({
      where: { groupId, amount: { gt: 0 } },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });

    return balances.map((b) => ({
      fromUser: b.fromUser,
      toUser: b.toUser,
      amount: b.amount,
    }));
  }

  static async settle(groupId: string, userId: string, toUserId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const balance = await db.groupBalance.findFirst({
      where: {
        groupId,
        fromUserId: userId,
        toUserId,
      },
    });

    if (!balance || balance.amount <= 0) throw new Error("No balance to settle");

    const transaction = await db.transaction.create({
      data: {
        groupId,
        fromUserId: userId,
        toUserId,
        amount: balance.amount,
        status: "SUCCESS",
        settled_at: new Date(),
      },
    });

    await db.groupBalance.update({
      where: { id: balance.id },
      data: { amount: 0 },
    });

    return transaction;
  }

  static async getTransactions(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const transactions = await db.transaction.findMany({
      where: {
        groupId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        from_user: { select: { id: true, name: true } },
        to_user: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      status: t.status,
      fromUser: t.from_user,
      toUser: t.to_user,
      settled_at: t.settled_at,
      created_at: t.created_at,
    }));
  }

  static async getActivity(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const activities = await db.activity.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      user: a.user,
      metadata: a.metadata,
      created_at: a.created_at,
    }));
  }
}