import { Router } from "express";
import multer from "multer";
import { crossCampareClause, ndaListByDeal, uploadAndAnalyzeNda } from "../controllers/nda.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import path from "path/win32";
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF and Word documents are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// Enforce multi-part file payloads and point to the controller
/*
router.post(
  "/compare",
  upload.fields([
    { name: "houseNda", maxCount: 1 },
    { name: "counterpartyNda", maxCount: 1 }
  ]),
  authMiddleware,
  compareNdaFiles
);

router.post(
  "/append-and-recompare",
  upload.single("file"),
  authMiddleware,
  revised
);
*/
router.get("/:dealId", authMiddleware, ndaListByDeal);

//router.post('/upload', authMiddleware, upload.single('file'), uploadAndAnalyzeNda);
router.post('/upload', authMiddleware, uploadAndAnalyzeNda);
router.post('/cross-compare-clauses', authMiddleware, crossCampareClause);

export default router;
