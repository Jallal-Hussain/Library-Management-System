import VendorQuote from "../models/VendorQuote.js";
import Acquisition  from "../models/Acquisition.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

// ── GET /api/vendor-quotes ────────────────────────────────────────────────────
export const getVendorQuotes = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.acquisitionId) filter.acquisitionId = req.query.acquisitionId;
    if (req.query.vendorId)      filter.vendorId      = req.query.vendorId;
    if (req.query.status)        filter.status        = req.query.status;

    const sort =
      req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, quotes] = await Promise.all([
      VendorQuote.countDocuments(filter),
      VendorQuote.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("acquisitionId", "title author isbn status")
        .populate("vendorId", "name email phone contactPerson")
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Vendor quotes fetched successfully.", quotes, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/vendor-quotes/:id ────────────────────────────────────────────────
export const getVendorQuoteById = async (req, res, next) => {
  try {
    const quote = await VendorQuote.findById(req.params.id)
      .populate("acquisitionId", "title author isbn status quantity unitPrice totalPrice")
      .populate("vendorId", "name email phone contactPerson address")
      .lean();

    if (!quote) return next(createError("Vendor quote not found.", 404));

    return sendSuccess(res, 200, "Vendor quote fetched successfully.", quote);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/vendor-quotes ───────────────────────────────────────────────────
export const createVendorQuote = async (req, res, next) => {
  try {
    const quote = await VendorQuote.create(req.body);

    const populated = await VendorQuote.findById(quote._id)
      .populate("acquisitionId", "title author isbn")
      .populate("vendorId", "name email")
      .lean();

    return sendSuccess(res, 201, "Vendor quote submitted successfully.", populated);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/vendor-quotes/:id/status ─────────────────────────────────────────
/**
 * Accepts or rejects a quote.
 * When accepted:
 *  1. Updates the associated Acquisition's vendorId and unitPrice.
 *  2. Rejects all other pending quotes for that acquisition.
 */
export const updateVendorQuoteStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // "accepted" | "rejected"

    const quote = await VendorQuote.findById(req.params.id);
    if (!quote) return next(createError("Vendor quote not found.", 404));

    if (quote.status !== "pending") {
      return next(
        createError(
          `Quote is already ${quote.status} and cannot be modified.`,
          409
        )
      );
    }

    quote.status = status;
    await quote.save();

    if (status === "accepted") {
      // 1. Update the linked acquisition with the winning vendor and price
      await Acquisition.findByIdAndUpdate(
        quote.acquisitionId,
        {
          vendorId: quote.vendorId,
          unitPrice: quote.price,
        },
        { runValidators: true }
      );

      // 2. Reject all competing pending quotes for the same acquisition
      await VendorQuote.updateMany(
        {
          acquisitionId: quote.acquisitionId,
          _id: { $ne: quote._id },
          status: "pending",
        },
        { status: "rejected" }
      );
    }

    const updated = await VendorQuote.findById(quote._id)
      .populate("acquisitionId", "title author isbn vendorId unitPrice")
      .populate("vendorId", "name email")
      .lean();

    return sendSuccess(
      res,
      200,
      `Vendor quote ${status} successfully.`,
      updated
    );
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/vendor-quotes/:id ─────────────────────────────────────────────
/**
 * Permanently deletes a pending quote. Accepted/rejected quotes cannot be deleted.
 */
export const deleteVendorQuote = async (req, res, next) => {
  try {
    const quote = await VendorQuote.findById(req.params.id);
    if (!quote) return next(createError("Vendor quote not found.", 404));

    if (quote.status !== "pending") {
      return next(
        createError(
          `Only pending quotes can be deleted. This quote is "${quote.status}".`,
          409
        )
      );
    }

    await quote.deleteOne();

    return sendSuccess(res, 200, "Vendor quote deleted successfully.");
  } catch (err) {
    next(err);
  }
};
