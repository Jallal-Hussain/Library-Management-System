/**
 * report.controller.js — Phase 4: Reports, Analytics & Data Export
 *
 * Endpoints:
 *  GET /api/reports/dashboard-stats       — KPI cards with period comparison
 *  GET /api/reports/circulation-trends    — borrow/return counts by day or month
 *  GET /api/reports/popular-books         — top N most-borrowed books
 *  GET /api/reports/overdue-aging         — overdue buckets (1-7, 8-14, 15-30, 30+)
 *  GET /api/reports/financial-summary     — fines + invoice payment totals
 *  GET /api/reports/category-distribution — inventory & loan share per category
 *  GET /api/reports/export/:type          — CSV export (books|members|transactions|fines)
 */

import Transaction  from "../models/Transaction.js";
import Fine         from "../models/Fine.js";
import Book         from "../models/Book.js";
import User         from "../models/User.js";
import Invoice      from "../models/Invoice.js";
import Reservation  from "../models/Reservation.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";
import { AsyncParser } from "@json2csv/node";
import { Readable } from "stream";

// ── Shared date-range helper ──────────────────────────────────────────────────

/**
 * Parse optional ?startDate / ?endDate query params and return a Mongoose
 * date range object. Defaults to the last 30 days when omitted.
 */
function parseDateRange(query) {
  const now = new Date();
  const end   = query.endDate   ? new Date(query.endDate)   : now;
  const start = query.startDate ? new Date(query.startDate) : new Date(now - 30 * 24 * 60 * 60 * 1000);
  // Normalise end to end-of-day
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── CSV streaming helper ──────────────────────────────────────────────────────

function streamCsv(res, next, data, fields, filename) {
  try {
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(filename);

    const opts = { fields };
    const parser = new AsyncParser(opts);
    const input = Readable.from(data);

    const csvStream = parser.parse(input);
    csvStream.on("error", (err) => {
      if (!res.headersSent) {
        next(err);
      } else {
        console.error("CSV streaming error:", err);
      }
    });
    csvStream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/dashboard-stats
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const now       = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalBooks,
      totalUsers,
      totalPatrons,
      activeTransactions,
      overdueTransactions,
      returnedThisMonth,
      borrowedThisMonth,
      borrowedLastMonth,
      finesUnpaid,
      finesPaidThisMonth,
      totalReservationsPending,
      newMembersThisMonth,
    ] = await Promise.all([
      Book.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ role: "patron", isActive: true }),
      Transaction.countDocuments({ status: "active" }),
      Transaction.countDocuments({ status: "overdue" }),
      Transaction.countDocuments({ status: "returned", returnDate: { $gte: thisMonth } }),
      Transaction.countDocuments({ type: "borrow", createdAt: { $gte: thisMonth } }),
      Transaction.countDocuments({ type: "borrow", createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
      Fine.aggregate([
        { $match: { isPaid: false, $or: [{ waivedAt: { $exists: false } }, { waivedAt: null }] } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Fine.aggregate([
        { $match: { isPaid: true, datePaid: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Reservation.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "patron", createdAt: { $gte: thisMonth } }),
    ]);

    const borrowTrend = borrowedLastMonth > 0
      ? Math.round(((borrowedThisMonth - borrowedLastMonth) / borrowedLastMonth) * 100)
      : null;

    return sendSuccess(res, 200, "Dashboard stats fetched successfully.", {
      inventory: {
        totalBooks,
        totalUsers,
        totalPatrons,
        newMembersThisMonth,
      },
      circulation: {
        activeTransactions,
        overdueTransactions,
        borrowedThisMonth,
        returnedThisMonth,
        borrowTrendPercent: borrowTrend,
        pendingReservations: totalReservationsPending,
      },
      financials: {
        totalFinesUnpaid: finesUnpaid[0]?.total ?? 0,
        finesPaidThisMonth: finesPaidThisMonth[0]?.total ?? 0,
      },
      generatedAt: now,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/circulation-trends
// Query: ?startDate &endDate &groupBy=day|month
// ─────────────────────────────────────────────────────────────────────────────
export const getCirculationTrends = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const groupBy = req.query.groupBy === "month" ? "month" : "day";

    const dateFormat = groupBy === "month"
      ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }
      : { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          type: { $in: ["borrow", "return"] },
        },
      },
      {
        $group: {
          _id: { period: dateFormat, type: "$type" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.period",
          borrows:  { $sum: { $cond: [{ $eq: ["$_id.type", "borrow"] }, "$count", 0] } },
          returns:  { $sum: { $cond: [{ $eq: ["$_id.type", "return"] }, "$count", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ];

    const raw = await Transaction.aggregate(pipeline);

    // Shape into a clean array with an ISO date label
    const trends = raw.map((r) => {
      const p = r._id;
      const label = groupBy === "month"
        ? `${p.year}-${String(p.month).padStart(2, "0")}`
        : `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
      return { period: label, borrows: r.borrows, returns: r.returns };
    });

    return sendSuccess(res, 200, "Circulation trends fetched successfully.", {
      groupBy,
      dateRange: { start, end },
      trends,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/popular-books
// Query: ?limit=10 &startDate &endDate
// ─────────────────────────────────────────────────────────────────────────────
export const getPopularBooks = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const books = await Transaction.aggregate([
      {
        $match: {
          type:      "borrow",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id:        "$bookId",
          borrowCount: { $sum: 1 },
        },
      },
      { $sort: { borrowCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from:         "books",
          localField:   "_id",
          foreignField: "_id",
          as:           "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmpty: false } },
      {
        $project: {
          _id:         0,
          bookId:      "$_id",
          title:       "$book.title",
          author:      "$book.author",
          isbn:        "$book.isbn",
          category:    "$book.category",
          coverImage:  "$book.coverImage",
          borrowCount: 1,
        },
      },
    ]);

    return sendSuccess(res, 200, "Popular books fetched successfully.", {
      dateRange: { start, end },
      limit,
      books,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/overdue-aging
// ─────────────────────────────────────────────────────────────────────────────
export const getOverdueAging = async (req, res, next) => {
  try {
    const now = new Date();

    const overdueTransactions = await Transaction.find({
      status: { $in: ["active", "overdue"] },
      dueDate: { $lt: now },
    })
      .populate("userId", "name email membershipId")
      .populate("bookId", "title author isbn")
      .lean();

    // Bucket definitions (in days)
    const buckets = {
      "1-7 days":   { min: 1,  max: 7,   items: [] },
      "8-14 days":  { min: 8,  max: 14,  items: [] },
      "15-30 days": { min: 15, max: 30,  items: [] },
      "30+ days":   { min: 31, max: Infinity, items: [] },
    };

    for (const tx of overdueTransactions) {
      const ms      = now - new Date(tx.dueDate);
      const days    = Math.ceil(ms / (1000 * 60 * 60 * 24));
      const entry   = {
        transactionId: tx._id,
        daysOverdue:   days,
        dueDate:       tx.dueDate,
        user:          tx.userId,
        book:          tx.bookId,
        fine:          tx.fine ?? 0,
      };

      for (const [label, bucket] of Object.entries(buckets)) {
        if (days >= bucket.min && days <= bucket.max) {
          bucket.items.push(entry);
          break;
        }
      }
    }

    const summary = Object.entries(buckets).map(([label, bucket]) => ({
      bucket: label,
      count:  bucket.items.length,
      items:  bucket.items,
    }));

    return sendSuccess(res, 200, "Overdue aging report fetched successfully.", {
      totalOverdue: overdueTransactions.length,
      generatedAt:  now,
      buckets: summary,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/financial-summary  (admin only)
// Query: ?startDate &endDate
// ─────────────────────────────────────────────────────────────────────────────
export const getFinancialSummary = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const [
      finesIssued,
      finesCollected,
      finesWaived,
      finesOutstanding,
      invoicePaid,
      invoicePending,
      invoiceOverdue,
    ] = await Promise.all([
      // All fines issued in period
      Fine.aggregate([
        { $match: { dateIssued: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Fines paid in period
      Fine.aggregate([
        { $match: { isPaid: true, datePaid: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Fines waived in period
      Fine.aggregate([
        { $match: { waivedAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Currently outstanding (unpaid, not waived)
      Fine.aggregate([
        { $match: { isPaid: false, $or: [{ waivedAt: { $exists: false } }, { waivedAt: null }] } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Vendor invoices paid in period
      Invoice.aggregate([
        { $match: { paymentStatus: "paid", paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Vendor invoices still pending
      Invoice.aggregate([
        { $match: { paymentStatus: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Vendor invoices overdue
      Invoice.aggregate([
        { $match: { paymentStatus: "overdue" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    return sendSuccess(res, 200, "Financial summary fetched successfully.", {
      dateRange: { start, end },
      fines: {
        issued:      { amount: finesIssued[0]?.total      ?? 0, count: finesIssued[0]?.count      ?? 0 },
        collected:   { amount: finesCollected[0]?.total   ?? 0, count: finesCollected[0]?.count   ?? 0 },
        waived:      { amount: finesWaived[0]?.total      ?? 0, count: finesWaived[0]?.count      ?? 0 },
        outstanding: { amount: finesOutstanding[0]?.total ?? 0, count: finesOutstanding[0]?.count ?? 0 },
      },
      vendorInvoices: {
        paid:    { amount: invoicePaid[0]?.total    ?? 0, count: invoicePaid[0]?.count    ?? 0 },
        pending: { amount: invoicePending[0]?.total ?? 0, count: invoicePending[0]?.count ?? 0 },
        overdue: { amount: invoiceOverdue[0]?.total ?? 0, count: invoiceOverdue[0]?.count ?? 0 },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/category-distribution
// ─────────────────────────────────────────────────────────────────────────────
export const getCategoryDistribution = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req.query);

    const [inventoryByCategory, loansByCategory] = await Promise.all([
      // Inventory: total copies & available copies per category
      Book.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id:             "$category",
            totalTitles:     { $sum: 1 },
            totalCopies:     { $sum: "$totalCopies" },
            availableCopies: { $sum: "$availableCopies" },
          },
        },
        { $sort: { totalCopies: -1 } },
      ]),
      // Loans: borrow count per category over the date range
      Transaction.aggregate([
        {
          $match: {
            type:      "borrow",
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $lookup: {
            from:         "books",
            localField:   "bookId",
            foreignField: "_id",
            as:           "book",
          },
        },
        { $unwind: { path: "$book", preserveNullAndEmpty: false } },
        {
          $group: {
            _id:         "$book.category",
            borrowCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Merge inventory + loan data by category
    const loanMap = new Map(loansByCategory.map((l) => [l._id, l.borrowCount]));
    const totalLoans = loansByCategory.reduce((s, l) => s + l.borrowCount, 0);
    const totalCopies = inventoryByCategory.reduce((s, i) => s + i.totalCopies, 0);

    const distribution = inventoryByCategory.map((inv) => ({
      category:        inv._id ?? "Unknown",
      totalTitles:     inv.totalTitles,
      totalCopies:     inv.totalCopies,
      availableCopies: inv.availableCopies,
      inventoryShare:  totalCopies > 0
        ? Math.round((inv.totalCopies / totalCopies) * 10000) / 100
        : 0,
      borrowCount: loanMap.get(inv._id) ?? 0,
      loanShare:   totalLoans > 0
        ? Math.round(((loanMap.get(inv._id) ?? 0) / totalLoans) * 10000) / 100
        : 0,
    }));

    return sendSuccess(res, 200, "Category distribution fetched successfully.", {
      dateRange: { start, end },
      distribution,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/export/:type
// Param: type = books | members | transactions | fines
// Query: ?startDate &endDate (applied to createdAt for transactions/fines)
// ─────────────────────────────────────────────────────────────────────────────
export const exportCsv = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { start, end } = parseDateRange(req.query);
    const filename = `${type}-report-${Date.now()}.csv`;

    switch (type) {
      case "books": {
        const data = await Book.find({ isActive: true })
          .select("title author isbn category genre publisher publishYear totalCopies availableCopies status location createdAt")
          .lean();

        const fields = [
          { label: "Title",            value: "title" },
          { label: "Author",           value: "author" },
          { label: "ISBN",             value: "isbn" },
          { label: "Category",         value: "category" },
          { label: "Genre",            value: "genre" },
          { label: "Publisher",        value: "publisher" },
          { label: "Publish Year",     value: "publishYear" },
          { label: "Total Copies",     value: "totalCopies" },
          { label: "Available Copies", value: "availableCopies" },
          { label: "Status",           value: "status" },
          { label: "Location",         value: "location" },
          { label: "Added Date",       value: (row) => row.createdAt ? new Date(row.createdAt).toISOString() : "" },
        ];

        return streamCsv(res, next, data, fields, filename);
      }

      case "members": {
        const data = await User.find({ role: "patron" })
          .select("name email membershipId phone address isActive approvalStatus joinDate membershipExpiry borrowingLimit currentBorrows finesOwed createdAt")
          .lean();

        const fields = [
          { label: "Name",             value: "name" },
          { label: "Email",            value: "email" },
          { label: "Membership ID",    value: "membershipId" },
          { label: "Phone",            value: "phone" },
          { label: "Address",          value: "address" },
          { label: "Status",           value: (row) => row.isActive ? "Active" : "Inactive" },
          { label: "Approval Status",  value: "approvalStatus" },
          { label: "Join Date",        value: (row) => row.joinDate ? new Date(row.joinDate).toISOString() : "" },
          { label: "Membership Expiry",value: (row) => row.membershipExpiry ? new Date(row.membershipExpiry).toISOString() : "" },
          { label: "Borrowing Limit",  value: "borrowingLimit" },
          { label: "Current Borrows",  value: "currentBorrows" },
          { label: "Fines Owed",       value: "finesOwed" },
        ];

        return streamCsv(res, next, data, fields, filename);
      }

      case "transactions": {
        const data = await Transaction.find({
          createdAt: { $gte: start, $lte: end },
        })
          .populate("userId", "name email membershipId")
          .populate("bookId", "title author isbn")
          .lean();

        const flat = data.map((tx) => ({
          transactionId: tx._id,
          type:          tx.type,
          status:        tx.status,
          userName:      tx.userId?.name  ?? "",
          userEmail:     tx.userId?.email ?? "",
          membershipId:  tx.userId?.membershipId ?? "",
          bookTitle:     tx.bookId?.title  ?? "",
          bookAuthor:    tx.bookId?.author ?? "",
          isbn:          tx.bookId?.isbn   ?? "",
          issueDate:     tx.issueDate  ? new Date(tx.issueDate).toISOString()  : "",
          dueDate:       tx.dueDate   ? new Date(tx.dueDate).toISOString()   : "",
          returnDate:    tx.returnDate ? new Date(tx.returnDate).toISOString() : "",
          renewCount:    tx.renewCount,
          fine:          tx.fine ?? 0,
        }));

        const fields = [
          { label: "Transaction ID",  value: "transactionId" },
          { label: "Type",            value: "type" },
          { label: "Status",          value: "status" },
          { label: "Member Name",     value: "userName" },
          { label: "Member Email",    value: "userEmail" },
          { label: "Membership ID",   value: "membershipId" },
          { label: "Book Title",      value: "bookTitle" },
          { label: "Author",          value: "bookAuthor" },
          { label: "ISBN",            value: "isbn" },
          { label: "Issue Date",      value: "issueDate" },
          { label: "Due Date",        value: "dueDate" },
          { label: "Return Date",     value: "returnDate" },
          { label: "Renewals",        value: "renewCount" },
          { label: "Fine ($)",        value: "fine" },
        ];

        return streamCsv(res, next, flat, fields, filename);
      }

      case "fines": {
        const data = await Fine.find({
          dateIssued: { $gte: start, $lte: end },
        })
          .populate("userId", "name email membershipId")
          .populate("transactionId", "bookId issueDate dueDate")
          .lean();

        // Resolve book titles from populated transactionId
        const bookIds = [...new Set(data.map((f) => f.transactionId?.bookId).filter(Boolean))];
        const books   = await Book.find({ _id: { $in: bookIds } }).select("title isbn").lean();
        const bookMap = new Map(books.map((b) => [b._id.toString(), b]));

        const flat = data.map((fine) => {
          const bookId  = fine.transactionId?.bookId?.toString();
          const book    = bookId ? bookMap.get(bookId) : null;
          return {
            fineId:       fine._id,
            userName:     fine.userId?.name  ?? "",
            userEmail:    fine.userId?.email ?? "",
            membershipId: fine.userId?.membershipId ?? "",
            bookTitle:    book?.title ?? "",
            isbn:         book?.isbn  ?? "",
            amount:       fine.amount,
            reason:       fine.reason,
            reasonNote:   fine.reasonNote ?? "",
            dateIssued:   fine.dateIssued  ? new Date(fine.dateIssued).toISOString()  : "",
            isPaid:       fine.isPaid ? "Yes" : "No",
            datePaid:     fine.datePaid    ? new Date(fine.datePaid).toISOString()    : "",
            isWaived:     fine.waivedAt    ? "Yes"                                    : "No",
            waivedAt:     fine.waivedAt    ? new Date(fine.waivedAt).toISOString()    : "",
          };
        });

        const fields = [
          { label: "Fine ID",       value: "fineId" },
          { label: "Member Name",   value: "userName" },
          { label: "Member Email",  value: "userEmail" },
          { label: "Membership ID", value: "membershipId" },
          { label: "Book Title",    value: "bookTitle" },
          { label: "ISBN",          value: "isbn" },
          { label: "Amount ($)",    value: "amount" },
          { label: "Reason",        value: "reason" },
          { label: "Notes",         value: "reasonNote" },
          { label: "Date Issued",   value: "dateIssued" },
          { label: "Paid",          value: "isPaid" },
          { label: "Date Paid",     value: "datePaid" },
          { label: "Waived",        value: "isWaived" },
          { label: "Waived At",     value: "waivedAt" },
        ];

      }

      default:
        return next(createError(`Unknown export type "${type}". Valid types: books, members, transactions, fines.`, 400));
    }
  } catch (err) {
    next(err);
  }
};
