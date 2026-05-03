import { db } from "db";

export abstract class PaymentsService {
  static async getPayments(userId: string) {
    return db.paymentRequest.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        transaction: {
          select: { group: { select: { id: true, name: true } } },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getSentPayments(userId: string) {
    return db.paymentRequest.findMany({
      where: { fromUserId: userId },
      include: {
        toUser: { select: { id: true, name: true } },
        transaction: {
          select: { group: { select: { id: true, name: true } } },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getReceivedPayments(userId: string) {
    return db.paymentRequest.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { id: true, name: true } },
        transaction: {
          select: { group: { select: { id: true, name: true } } },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  static async getPayment(paymentId: string, userId: string) {
    const payment = await db.paymentRequest.findFirst({
      where: {
        id: paymentId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        transaction: {
          select: { group: { select: { id: true, name: true } } },
        },
      },
    });

    if (!payment) throw new Error("Payment not found");
    return payment;
  }

  static async acceptPayment(paymentId: string, userId: string) {
    const payment = await db.paymentRequest.findFirst({
      where: {
        id: paymentId,
        toUserId: userId,
      },
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.status === "SUCCESS") {
      throw new Error("Payment already accepted");
    }

    await db.paymentRequest.update({
      where: { id: paymentId },
      data: { status: "SUCCESS" },
    });

    return { message: "Payment accepted" };
  }

  static async rejectPayment(paymentId: string, userId: string) {
    const payment = await db.paymentRequest.findFirst({
      where: {
        id: paymentId,
        toUserId: userId,
      },
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.status === "SUCCESS") {
      throw new Error("Payment already accepted");
    }

    await db.paymentRequest.update({
      where: { id: paymentId },
      data: { status: "CANCELLED" },
    });

    return { message: "Payment rejected" };
  }
}
