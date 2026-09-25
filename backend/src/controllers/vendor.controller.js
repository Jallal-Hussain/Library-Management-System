import Vendor from "../models/Vendor.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getVendors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { contactPerson: searchRegex },
      ];
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, vendors] = await Promise.all([
      Vendor.countDocuments(filter),
      Vendor.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Vendors fetched successfully.", vendors, {
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

export const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).lean();
    if (!vendor) return next(createError("Vendor not found.", 404));

    return sendSuccess(res, 200, "Vendor fetched successfully.", vendor);
  } catch (err) {
    next(err);
  }
};

export const createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    return sendSuccess(res, 201, "Vendor created successfully.", vendor);
  } catch (err) {
    next(err);
  }
};

export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return next(createError("Vendor not found.", 404));

    return sendSuccess(res, 200, "Vendor updated successfully.", vendor);
  } catch (err) {
    next(err);
  }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return next(createError("Vendor not found.", 404));

    vendor.isActive = false;
    await vendor.save();

    return sendSuccess(res, 200, "Vendor deactivated successfully.");
  } catch (err) {
    next(err);
  }
};
