import { memoryStorage } from "multer";

export const createMulterConfig = (
  uploadType: "profile" | "cover" | "legal"
) => {
  const isLegal = uploadType === "legal";

  const limits = {
    fileSize: isLegal ? 10 * 1024 * 1024 : 5 * 1024 * 1024,
  };

  return {
    storage: memoryStorage(),
    limits,
    fileFilter: (_req, file, cb) => {
      const imageMimes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      const allowedMimes = isLegal
        ? ["application/pdf", ...imageMimes]
        : imageMimes;

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            isLegal
              ? "Invalid file type. Only PDF, JPEG, PNG, and WebP files are allowed for legal documents."
              : "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
          ),
          false
        );
      }
    },
  };
};
