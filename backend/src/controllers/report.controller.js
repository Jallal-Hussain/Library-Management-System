import Transaction from "../models/Transaction.js";
import Fine from "../models/Fine.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalBooks,
      totalUsers,
      activeTransactions,
      overdueTransactions,
      totalFinesUnpaid,
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: "patron" }),
      Transaction.countDocuments({ status: "active" }),
      Transaction.countDocuments({ status: "active", dueDate: { $lt: new Date() } }),
      Fine.aggregate([
        { $match: { isPaid: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    return sendSuccess(res, 200, "Dashboard stats fetched successfully.", {
      totalBooks,
      totalUsers,
      activeTransactions,
      overdueTransactions,
      totalFinesUnpaid: totalFinesUnpaid[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};
