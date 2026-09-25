import ILL from "../models/ILL.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getILLRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.requestedBy) filter.requestedBy = req.query.requestedBy;

    if (req.user.role === "patron") {
      filter.requestedBy = req.user._id;
    }

    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { partnerLibrary: searchRegex },
      ];
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, requests] = await Promise.all([
      ILL.countDocuments(filter),
      ILL.find(filter)
        .populate("requestedBy", "name email membershipId")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "ILL requests fetched successfully.", requests, {
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

export const getILLRequestById = async (req, res, next) => {
  try {
    const request = await ILL.findById(req.params.id).populate("requestedBy", "name email membershipId");
    
    if (!request) return next(createError("ILL request not found.", 404));

    if (req.user.role === "patron" && request.requestedBy._id.toString() !== req.user._id.toString()) {
      return next(createError("Access denied.", 403));
    }

    return sendSuccess(res, 200, "ILL request fetched successfully.", request);
  } catch (err) {
    next(err);
  }
};

export const createILLRequest = async (req, res, next) => {
  try {
    const request = new ILL({
      ...req.body,
      requestedBy: req.user.role === "patron" ? req.user._id : req.body.requestedBy || req.user._id,
      requestDate: new Date(),
      status: "requested"
    });

    await request.save();

    return sendSuccess(res, 201, "ILL request created successfully.", request);
  } catch (err) {
    next(err);
  }
};

export const updateILLStatus = async (req, res, next) => {
  try {
    const { status, dueDate, borrowingFee, partnerLibraryContact, notes } = req.body;
    
    const request = await ILL.findById(req.params.id);
    if (!request) return next(createError("ILL request not found.", 404));

    request.status = status;
    
    if (status === "received") {
      request.receivedDate = new Date();
    } else if (status === "returned") {
      request.returnedDate = new Date();
    }

    if (dueDate) request.dueDate = dueDate;
    if (borrowingFee !== undefined) request.borrowingFee = borrowingFee;
    if (partnerLibraryContact) request.partnerLibraryContact = partnerLibraryContact;
    if (notes) request.notes = notes;

    await request.save();

    return sendSuccess(res, 200, "ILL request status updated successfully.", request);
  } catch (err) {
    next(err);
  }
};
