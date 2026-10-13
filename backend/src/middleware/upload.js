import multer from "multer";
import { createError } from "../utils/apiResponse.js";

// Memory storage buffer for direct cloud upload
const storage = multer.memoryStorage();

// Accept only image/jpeg, image/png, image/webp
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      createError(
        "Invalid file format. Only JPEG, PNG, and WebP images are allowed.",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

export default upload;
