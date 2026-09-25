import Acquisition from "../models/Acquisition.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getAcquisitions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.vendorId) filter.vendorId = req.query.vendorId;

    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
      ];
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, acquisitions] = await Promise.all([
      Acquisition.countDocuments(filter),
      Acquisition.find(filter)
        .populate("vendorId", "name email")
        .populate("requestedBy", "name")
        .populate("approvedBy", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Acquisitions fetched successfully.", acquisitions, {
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

export const getAcquisitionById = async (req, res, next) => {
  try {
    const acquisition = await Acquisition.findById(req.params.id)
      .populate("vendorId", "name email")
      .populate("requestedBy", "name")
      .populate("approvedBy", "name");

    if (!acquisition) return next(createError("Acquisition not found.", 404));

    return sendSuccess(res, 200, "Acquisition fetched successfully.", acquisition);
  } catch (err) {
    next(err);
  }
};

export const createAcquisition = async (req, res, next) => {
  try {
    const acquisition = new Acquisition({
      ...req.body,
      requestedBy: req.user._id,
      requestDate: new Date(),
    });

    await acquisition.save();

    return sendSuccess(res, 201, "Acquisition created successfully.", acquisition);
  } catch (err) {
    next(err);
  }
};

export const updateAcquisition = async (req, res, next) => {
  try {
    const acquisition = await Acquisition.findById(req.params.id);
    if (!acquisition) return next(createError("Acquisition not found.", 404));

    const updatableFields = [
      "title", "author", "isbn", "vendorId", "quantity", "unitPrice", 
      "notes", "budgetId", "branchId"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        acquisition[field] = req.body[field];
      }
    });

    await acquisition.save();

    return sendSuccess(res, 200, "Acquisition updated successfully.", acquisition);
  } catch (err) {
    next(err);
  }
};

export const updateAcquisitionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const acquisition = await Acquisition.findById(req.params.id);
    if (!acquisition) return next(createError("Acquisition not found.", 404));

    acquisition.status = status;

    if (status === "approved") {
      acquisition.approvedBy = req.user._id;
      acquisition.approvedDate = new Date();
    } else if (status === "ordered") {
      acquisition.orderDate = new Date();
    } else if (status === "received") {
      acquisition.receivedDate = new Date();
    }

    await acquisition.save();

    return sendSuccess(res, 200, "Acquisition status updated.", acquisition);
  } catch (err) {
    next(err);
  }
};

export const deleteAcquisition = async (req, res, next) => {
  try {
    const acquisition = await Acquisition.findById(req.params.id);
    if (!acquisition) return next(createError("Acquisition not found.", 404));

    if (!["requested", "cancelled"].includes(acquisition.status)) {
      return next(createError("Can only delete requested or cancelled acquisitions.", 400));
    }

    await Acquisition.deleteOne({ _id: req.params.id });

    return sendSuccess(res, 200, "Acquisition deleted successfully.");
  } catch (err) {
    next(err);
  }
};
