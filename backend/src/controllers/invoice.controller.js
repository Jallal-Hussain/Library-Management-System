import Invoice from "../models/Invoice.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getInvoices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.acquisitionId) filter.acquisitionId = req.query.acquisitionId;
    if (req.query.invoiceNumber) {
      filter.invoiceNumber = new RegExp(req.query.invoiceNumber.trim(), "i");
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, invoices] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .populate("vendorId", "name email")
        .populate("acquisitionId", "title quantity totalPrice")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Invoices fetched successfully.", invoices, {
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

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("vendorId", "name email contactPerson")
      .populate("acquisitionId");

    if (!invoice) return next(createError("Invoice not found.", 404));

    return sendSuccess(res, 200, "Invoice fetched successfully.", invoice);
  } catch (err) {
    next(err);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create(req.body);
    return sendSuccess(res, 201, "Invoice created successfully.", invoice);
  } catch (err) {
    next(err);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!invoice) return next(createError("Invoice not found.", 404));

    return sendSuccess(res, 200, "Invoice updated successfully.", invoice);
  } catch (err) {
    next(err);
  }
};

export const payInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(createError("Invoice not found.", 404));

    if (invoice.paymentStatus === "paid") {
      return next(createError("Invoice is already paid.", 400));
    }

    invoice.paymentStatus = "paid";
    invoice.paymentDate = new Date();
    invoice.paymentMethod = req.body.paymentMethod || "transfer";
    
    if (req.body.notes) {
      invoice.notes = invoice.notes ? `${invoice.notes}\n${req.body.notes}` : req.body.notes;
    }

    await invoice.save();

    return sendSuccess(res, 200, "Invoice marked as paid.", invoice);
  } catch (err) {
    next(err);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(createError("Invoice not found.", 404));

    if (invoice.paymentStatus === "paid") {
      return next(createError("Cannot delete a paid invoice.", 400));
    }

    await Invoice.deleteOne({ _id: req.params.id });

    return sendSuccess(res, 200, "Invoice deleted successfully.");
  } catch (err) {
    next(err);
  }
};
