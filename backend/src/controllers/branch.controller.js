import Branch from "../models/Branch.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getBranches = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const branches = await Branch.find(filter).sort({ name: 1 }).lean();
    return sendSuccess(res, 200, "Branches fetched successfully.", branches);
  } catch (err) {
    next(err);
  }
};

export const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).lean();
    if (!branch) return next(createError("Branch not found.", 404));

    return sendSuccess(res, 200, "Branch fetched successfully.", branch);
  } catch (err) {
    next(err);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const branch = await Branch.create(req.body);
    return sendSuccess(res, 201, "Branch created successfully.", branch);
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!branch) return next(createError("Branch not found.", 404));

    return sendSuccess(res, 200, "Branch updated successfully.", branch);
  } catch (err) {
    next(err);
  }
};

export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return next(createError("Branch not found.", 404));

    branch.isActive = false;
    await branch.save();

    return sendSuccess(res, 200, "Branch deactivated successfully.");
  } catch (err) {
    next(err);
  }
};
