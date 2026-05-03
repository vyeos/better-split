import { db } from "db";

export abstract class ExpensesService {
  static async getExpenseById(expenseId: string, userId: string) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      select: { groupId: true },
    });

    if (!expense) throw new Error("Expense not found");

    const membership = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    return expense;
  }

  static async getExpense(expenseId: string, userId: string) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      select: { groupId: true },
    });

    if (!expense) throw new Error("Expense not found");

    const membership = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    return db.expense.findUnique({
      where: { id: expenseId },
      include: {
        paid_by: { select: { id: true, name: true } },
        created_by: { select: { id: true, name: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  static async updateExpense(
    expenseId: string,
    userId: string,
    data: { amount?: number; note?: string },
  ) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      select: { groupId: true },
    });

    if (!expense) throw new Error("Expense not found");

    const membership = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    return db.expense.update({
      where: { id: expenseId },
      data,
      select: {
        id: true,
        amount: true,
        note: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  static async deleteExpense(expenseId: string, userId: string) {
    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      select: { groupId: true },
    });

    if (!expense) throw new Error("Expense not found");

    const membership = await db.groupMember.findFirst({
      where: { groupId: expense.groupId, userId },
    });

    if (!membership) throw new Error("Access denied");

    await db.expense.delete({ where: { id: expenseId } });

    return { message: "Expense deleted" };
  }
}