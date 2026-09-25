import Settings from "../models/Settings.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getSettings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.group) filter.group = req.query.group;

    const settings = await Settings.find(filter).sort({ group: 1, key: 1 }).lean();
    return sendSuccess(res, 200, "Settings fetched successfully.", settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body; // Expecting array of { key, value }
    if (!Array.isArray(settings)) {
      return next(createError("Settings array is required.", 400));
    }

    const updatedSettings = [];
    for (const item of settings) {
      if (item.key && item.value !== undefined) {
        const updated = await Settings.findOneAndUpdate(
          { key: item.key, isEditable: true },
          { value: item.value },
          { new: true, runValidators: true }
        );
        if (updated) updatedSettings.push(updated);
      }
    }

    return sendSuccess(res, 200, "Settings updated successfully.", updatedSettings);
  } catch (err) {
    next(err);
  }
};
