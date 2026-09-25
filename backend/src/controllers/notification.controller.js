import Notification from "../models/Notification.js";
import { sendSuccess, createError } from "../utils/apiResponse.js";

export const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === "true";
    }

    const sort = { createdAt: -1 };

    const [total, notifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendSuccess(res, 200, "Notifications fetched successfully.", notifications, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!notification) return next(createError("Notification not found.", 404));

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return sendSuccess(res, 200, "Notification marked as read.", notification);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return sendSuccess(res, 200, "All notifications marked as read.");
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!deleted) return next(createError("Notification not found.", 404));

    return sendSuccess(res, 200, "Notification deleted successfully.");
  } catch (err) {
    next(err);
  }
};
