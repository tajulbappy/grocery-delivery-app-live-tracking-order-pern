import express, { Request, Response } from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";

const uploadRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

uploadRouter.post(
  "/",
  auth,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`; // Fixed: added comma

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "grocery-pern-app",
        resource_type: "auto",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      });

      res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({
        message: error.message || "Failed to upload image",
        error: error.toString(),
      });
    }
  }
);

export default uploadRouter;
