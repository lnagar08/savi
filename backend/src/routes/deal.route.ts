import { Router } from "express";
import multer from "multer";
import { createDeal, parseDeal, getDeals, getDealById, updateInputs } from "../controllers/deal.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const dealRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

dealRouter.get("/", authMiddleware, getDeals);
dealRouter.get("/:id", authMiddleware, getDealById);
dealRouter.post("/", authMiddleware, upload.single("file"), createDeal);
dealRouter.post("/parse", authMiddleware, upload.single("file"), parseDeal);
dealRouter.put("/inputs/:dealId", authMiddleware, updateInputs);

export default dealRouter;
