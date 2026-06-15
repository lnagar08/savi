import { Router } from "express";
import multer from "multer";
import { createBidLetter, parseBid, bidLetterSubmit, getBidLetterByBidId, getBidLetterById, updateBidLetterById, deleteBidLetterById } from "../controllers/bidLetter.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const bidLetterRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

bidLetterRouter.post("/", authMiddleware, upload.single("file"), createBidLetter);
bidLetterRouter.get("/bid/:id", authMiddleware, getBidLetterByBidId);
bidLetterRouter.get("/:id", authMiddleware, getBidLetterById);
bidLetterRouter.put("/:id", authMiddleware, updateBidLetterById);
bidLetterRouter.delete("/:id", authMiddleware, deleteBidLetterById);
bidLetterRouter.post("/parse", authMiddleware, upload.single("file"), parseBid);

bidLetterRouter.post("/bidSubmit", authMiddleware, bidLetterSubmit);

export default bidLetterRouter;
