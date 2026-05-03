import { db } from "db";
import type { SplitType } from "@prisma/client";

export abstract class GroupSettingsService {
  static async getGroupMeta(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    let meta = await db.groupMeta.findUnique({
      where: { groupId },
    });

    if (!meta) {
      meta = await db.groupMeta.create({
        data: { groupId },
      });
    }

    return meta;
  }

  static async updateGroupMeta(
    groupId: string,
    userId: string,
    data: {
      simplified_debts?: boolean;
      whiteboard?: string;
      default_split_type?: SplitType;
    },
  ) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");
    if (membership.role !== "ADMIN") throw new Error("Only admins can update settings");

    const meta = await db.groupMeta.upsert({
      where: { groupId },
      update: data,
      create: { groupId, ...data },
    });

    return meta;
  }

  static async setDefaultSplits(
    groupId: string,
    userId: string,
    splits: { userId: string; percentage: number }[],
  ) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");
    if (membership.role !== "ADMIN") throw new Error("Only admins can set default splits");

    const existingMembers = await db.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const memberIds = new Set(existingMembers.map((m) => m.userId));
    for (const split of splits) {
      if (!memberIds.has(split.userId)) {
        throw new Error("User not a group member");
      }
    }

    const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error("Percentages must sum to 100");
    }

    await db.$transaction(
      splits.map((split) =>
        db.groupDefaultSplit.upsert({
          where: { groupId_userId: { groupId, userId: split.userId } },
          update: { percentage: split.percentage },
          create: { groupId, userId: split.userId, percentage: split.percentage },
        }),
      ),
    );

    return { message: "Default splits updated" };
  }

  static async getDefaultSplits(groupId: string, userId: string) {
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    const splits = await db.groupDefaultSplit.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true } } },
    });

    return splits.map((s) => ({
      userId: s.userId,
      user: s.user,
      percentage: s.percentage,
    }));
  }
}