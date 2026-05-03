import { db } from "db";

export abstract class TransactionsService {
  static async getTransactions(userId: string) {
    return db.transaction.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        from_user: { select: { id: true, name: true } },
        to_user: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getTransaction(transactionId: string, userId: string) {
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        from_user: { select: { id: true, name: true } },
        to_user: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
    });

    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  static async confirmTransaction(transactionId: string, userId: string) {
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        fromUserId: userId,
      },
    });

    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status === "SUCCESS") {
      throw new Error("Transaction already confirmed");
    }

    await db.transaction.update({
      where: { id: transactionId },
      data: { status: "SUCCESS", settled_at: new Date() },
    });

    return { message: "Transaction confirmed" };
  }
}