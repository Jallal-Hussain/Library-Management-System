import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Setting value is required"],
    },
    label: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    group: {
      type: String,
      enum: ["circulation", "fines", "membership", "notifications", "general"],
      default: "general",
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

settingsSchema.index({ group: 1 });

export default mongoose.model("Settings", settingsSchema);
