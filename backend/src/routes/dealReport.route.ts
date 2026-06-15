import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { generateDealReport, getReportsByDealId } from "../controllers/dealReport.controller.js";
const dealReportRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

dealReportRouter.post("/:id", authMiddleware, upload.single("file"), generateDealReport);
dealReportRouter.get("/deal/:id", authMiddleware, getReportsByDealId);

export default dealReportRouter;