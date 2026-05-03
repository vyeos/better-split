import { db } from "db";

export abstract class ActivitiesService {
  static async getUserActivities(userId: string) {
    const memberships = await db.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    if (groupIds.length === 0) return [];

    const activities = await db.activity.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        user: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    return activities.map((a) => ({
      id: a.id,
      type: a.type,
      user: a.user,
      group: a.group,
      metadata: a.metadata,
      created_at: a.created_at,
    }));
  }

  static async getGroupActivities(groupId: string, userId: string) {
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