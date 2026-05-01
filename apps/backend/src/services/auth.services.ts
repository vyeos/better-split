import { db } from "db";
import type { AuthModel } from "../models/auth.models";

export abstract class AuthService {
  static async signUp(name: string, email: string, password: string) {
    const userExist = await db.user.findFirst({
      where: { email: email.trim() },
    });
    if (userExist) throw new Error("User with this email already exists");
    const hashPassword = await Bun.password.hash(password);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashPassword,
      },
    });
    return user;
  }

  static async signIn(email: string, password: string) {
    const user = await db.user.findFirst({
      where: {
        email,
      },
    });
    if (!user) throw new Error("User doesn't exist");
    const validPassword = await Bun.password.verify(password, user.password);
    if (!validPassword) throw new Error("Invalid credentials");
    return user;
  }

  static async getUserById(userId: string): Promise<AuthModel["meResponse"]> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        payment_link: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  static async getUserDebts(userId: string): Promise<AuthModel["debtResposne"]> {
    const balances = await db.groupBalance.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
        amount: { gt: 0 },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return balances.map((balance) => ({
      id: balance.id,
      groupId: balance.group.id,
      groupName: balance.group.name,
      groupCurrency: balance.group.currency,
      fromUserId: balance.fromUser.id,
      fromUserName: balance.fromUser.name,
      toUserId: balance.toUser.id,
      toUserName: balance.toUser.name,
      amount: balance.amount,
    }));
  }
}
