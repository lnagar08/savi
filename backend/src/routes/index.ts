import { Router } from "express";
import authRouter from "./auth.route.js";
import dealRouter from "./deal.route.js";
import path from "path/win32";
import bidLetterRouter from "./bidLetter.route.js";
import ndaRoute from "./nda.route.js";
import dealReportRouter from "./dealReport.route.js";
const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/deals", dealRouter);
mainRouter.use("/bidLetter", bidLetterRouter);
mainRouter.use("/ndaAnalysis", ndaRoute);
mainRouter.use("/report", dealReportRouter);


mainRouter.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = `uploads/${filename}`;

  res.sendFile(filePath, { root: process.cwd() }, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("File not found");
    }
  });
});

mainRouter.get('/uploads/extracted/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('uploads', 'extracted', filename);

  res.sendFile(filePath, { root: process.cwd() }, (err) => {
    if (err) {
      res.status(404).send("Image not found");
    }
  });
});

export default mainRouter;
