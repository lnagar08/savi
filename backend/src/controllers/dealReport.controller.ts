import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { CustomError } from "../lib/custom-error.js";
import fs from 'fs';
import { extractBidFileContent } from "../services/bidLetter.service.js";

export const generateDealReport = async (req: Request, res: Response) => {

  try{

    const { id, name } = req.body;
    const dealId = Number(id);
    if (!Number.isInteger(dealId) || dealId <= 0) {
        throw new CustomError("Invalid deal id", 400);
    }

    const file = req.file
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // 1. Generate filename safely
    const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/_+/g, '_')}`;
    const relativeUploadPath = `./uploads/${filename}`;

    // 2. Ensure directory exists and write file SYNCHRONOUSLY to block until done
    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads', { recursive: true });
    }
    fs.writeFileSync(relativeUploadPath, file.buffer); 

    const pages = await extractBidFileContent(file, `/uploads/${filename}`);
    
    await prisma.dealReport.create({
        data: {
            dealId: dealId, 
            fileName: name,
            fileUrl: `/uploads/${filename}`,
            rawContent: pages[0]?.text ?? "", 
        }
    });
    res.status(201).json({
      success: true,
      message: "Deal Report generated successfully",
      data: pages[0]?.text,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}


export const getReportsByDealId = async (req: Request, res: Response) => {
   try {
        const dealId = Number(req.params.id);
        if (!Number.isInteger(dealId) || dealId <= 0) {
            throw new CustomError("Invalid deal id", 400);
        }
        const reports = await prisma.dealReport.findMany({
            where: { dealId },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            message: "Reports retrieved successfully",
            data: reports,
        });
        
   } catch (error) {
        res.status(500).json({ message: "Internal server error" })
   }
}