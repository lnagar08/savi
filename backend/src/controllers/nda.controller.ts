import type { Request, Response, NextFunction } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma.js";
import mammoth from "mammoth";
//import { PDFParse } from "pdf-parse";
import PDFParser from"pdf2json";
import fs from 'fs';
import path from 'path';
const client = new OpenAI();

// Strict JSON schema matching your frontend UI
const ndaSchema = {
  type: "object",
  properties: {
    overallResult: { type: "string", enum: ["Red", "Amber", "Green"] },
    highPriorityIssues: { type: "integer" },
    acceptability: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string" },
          rag: { type: "string", enum: ["Red", "Amber", "Green"] },
          whatChanged: { type: "string" },
          suggestedResponse: { type: "string" }
        },
        required: ["clause", "rag", "whatChanged", "suggestedResponse"],
        additionalProperties: false
      }
    }
  },
  required: ["overallResult", "highPriorityIssues", "acceptability", "issues"],
  additionalProperties: false
};

const crossCompareSchema = {
  type: "object",
  properties: {
    overallResult: { type: "string", enum: ["Red", "Amber", "Green"] },
    highPriorityIssues: { type: "integer" },
    acceptability: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clause: { type: "string" },
          rag: { type: "string", enum: ["Red", "Amber", "Green"] },
          whatChanged: { type: "string" },
          suggestedResponse: { type: "string" }
        },
        required: ["clause", "rag", "whatChanged", "suggestedResponse"],
        additionalProperties: false
      }
    }
  },
  required: ["overallResult", "highPriorityIssues", "acceptability", "issues"],
  additionalProperties: false
};

/*
export const compareNdaFiles = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { dealId } = req.body;
    if (!files?.houseNda?.[0] || !files?.counterpartyNda?.[0]) {
      return res.status(400).json({ error: "Missing required files: both houseNda and counterpartyNda are required." });
    }

    // Convert raw buffers to strings
    const houseText = files.houseNda[0].buffer.toString("utf-8");
    const counterpartyText = files.counterpartyNda[0].buffer.toString("utf-8");

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      response_format: {
        type: "json_schema",
        json_schema: { name: "nda_report", strict: true, schema: ndaSchema }
      },
      messages: [
        { role: "system", content: "You are a legal AI counsel. Compare the draft against the template, highlight deviations with RAG scores." },
        { role: "user", content: `Template:\n${houseText}\n\nDraft:\n${counterpartyText}` }
      ]
    });
    const houseUrl = `uploads/${Date.now()}_${files.houseNda[0].originalname}`;
    const counterpartyUrl = `uploads/${Date.now()}_${files.counterpartyNda[0].originalname}`;
    
    const parsedAiResults = JSON.parse(completion.choices[0]?.message.content || "{}");
    const newAnalysisRecord = await prisma.ndaAnalysis.create({
      data: {
        dealId: Number(dealId),
        status: parsedAiResults.overallResult, // Saves "Red", "Amber", or "Green"
        issues: parsedAiResults.highPriorityIssues, // Maps integer quantities
        ndaTemplate: houseUrl, // Tracking actual file references
        ndaDraft: counterpartyUrl, // Tracking actual file references
        analysisResult: parsedAiResults, // Saves the entire JSON tree securely into your Json column

        NdaRevised: {
            create: [
                {
                type: "template",
                version: 1
                },
                {
                type: "draft",
                version: 1
                }
            ]
            }
        },
        include: {
            NdaRevised: true
        }
      
    });

    // 3. Return the newly minted database entry directly to your UI view layers
    return res.status(201).json(newAnalysisRecord);

  } catch (error: any) {
    console.error("Controller Error:", error);
    return res.status(500).json({ error: error.message || "Internal text parsing error." });
  }
};


export const revised = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { ndaAnalysisId, type, version } = req.body;
    const file = req.file;

    if (!ndaAnalysisId || !type || !version || !file) {
      return res.status(400).json({ error: "Missing required multi-part form parameters." });
    }

    const analysisIdInt = parseInt(ndaAnalysisId, 10);
    const nextVersionInt = parseInt(version, 10);

    // 1. Fetch current analysis instance status plus existing history array models
    const parentRecord = await prisma.ndaAnalysis.findUnique({
      where: { id: analysisIdInt },
      include: { NdaRevised: true }
    });

    if (!parentRecord) {
      return res.status(404).json({ error: "Target NDA Analysis record tracking instance not found." });
    }

    // SAFE FIX: Process text extraction purely for OpenAI memory context feed
    // NOTE: If using binary formats like .docx or .pdf later, parse the buffer text here 
    // with 'mammoth' or 'pdf-parse' instead of using .toString() directly.
    const cleanExtractedTextForAI = file.buffer.toString("utf-8").replace(/\0/g, ''); 
    const mockUploadedUrlStr = `uploads/${Date.now()}_${file.originalname}`;

    let templateContextText = "";
    let draftContextText = "";

    // 2. Identify latest opposing version file text block data layers
    if (type === "template") {
      templateContextText = cleanExtractedTextForAI;
      // Fetch newest draft variation context
      draftContextText = parentRecord.ndaDraft || "Default draft text empty snapshot buffer context string.";
    } else {
      draftContextText = cleanExtractedTextForAI;
      templateContextText = parentRecord.ndaTemplate || "Default template text empty snapshot buffer context string.";
    }

    // 3. Trigger modern runtime execution to re-compare records via OpenAI 
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      response_format: {
        type: "json_schema",
        json_schema: { name: "nda_recomparison", strict: true, schema: ndaSchema }
      },
      messages: [
        { role: "system", content: "You are a professional legal AI. Compare the draft against the template, highlight deviations with RAG scores." },
        { role: "user", content: `Template Context:\n${templateContextText}\n\nDraft Context:\n${draftContextText}` }
      ]
    });

    const parsedAiResults = JSON.parse(completion.choices[0]?.message.content || "{}");

    // ==========================================
    // CRITICAL FIX FOR DRIVERADAPTERERROR:
    // Store the string file path URL here, NOT the raw text context.
    // ==========================================
    const rootFieldUpdate: any = {};
    if (type === "template") rootFieldUpdate.ndaTemplate = mockUploadedUrlStr; 
    if (type === "draft") rootFieldUpdate.ndaDraft = mockUploadedUrlStr;

    // 4. Commit atomic update transitions down into Prisma Client instance layers
    const updatedAnalysisLedger = await prisma.ndaAnalysis.update({
      where: { id: analysisIdInt },
      data: {
        ...rootFieldUpdate,
        status: parsedAiResults.overallResult || "Amber",
        issues: parsedAiResults.highPriorityIssues || 0,
        analysisResult: parsedAiResults, // Save fresh JSON analytics output trees
        NdaRevised: {
          create: {
            type: type, // "template" or "draft"
            version: nextVersionInt,
            fileUrl: mockUploadedUrlStr // Binds the fileUrl string into history column schemas
          }
        }
      },
      include: {
        NdaRevised: true // Include nested relation tables to populate history on re-render loops
      }
    });

    return res.status(200).json(updatedAnalysisLedger);

  } catch (error: any) {
    console.error("Critical Re-comparison Pipeline Failure:", error);
    return res.status(500).json({ error: error.message || "Failed running internal AI re-comparison loops." });
  }
};
*/
export const ndaListByDeal = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { dealId } = req.params;
    if (!dealId) {
      return res.status(400).json({ error: "Missing required parameter: dealId." });
    }
    const analyses = await prisma.ndaAnalysis.findMany({
      where: { dealId: Number(dealId)
       },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.status(200).json(analyses);
  } catch (error: any) {
    console.error("Error fetching NDA analyses by deal:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch NDA analyses." });
  }
}

export const uploadAndAnalyzeNda = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Check if Multer successfully caught the file
    if (!req.file) {
      res.status(400).json({ message: 'No file found in payload payload.' });
      return;
    }

    //const { dealId, fileType } = req.body;
    const { dealId, parentId, version, fileType } = req.body;

    if (!dealId || !fileType) {
      res.status(400).json({ error: "Missing mandatory multi-part form tracking metadata parameters." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const localFilePath = req.file.path;
    const currentDealIdInt = parseInt(dealId, 10);
    const nextVersionInt = parseInt(version, 10);
    const targetParentId = parentId ? parseInt(parentId, 10) : null;

    // 2. Parse payload text out of downloaded documents
    const documentText = await extractTextFromFile(localFilePath);

    const promptMessage = `
  Analyze the provided document content.
  Extract only the explicit legal clauses, facts, or key terms found in the text.
  For each clause found, capture its name and its immediate short value/parameter.
  Do NOT include any explanations, summaries, descriptions, or lengthy text blocks. Keep values under a few words.
  
  Document Content:
  ${documentText}
`;

const chatCompletion = await client.chat.completions.create({
  model: "gpt-5-mini",
  messages: [{ role: 'user', content: promptMessage }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "strict_clause_only_pairs",
      strict: true,
      schema: {
        type: "object",
        properties: {
          clausesList: {
            type: "array",
            items: {
              type: "object",
              properties: {
                // Clause Title
                clauseName: { 
                  type: "string", 
                  description: "The name of the clause or parameter (e.g., 'Governing Law', 'Agreement Term')." 
                },
                // Concise Value Only
                clauseValue: { 
                  type: "string", 
                  description: "The immediate strict value only. Max 2-5 words. No explanations. (e.g., 'England and Wales', '3 Years', 'Mutual')." 
                }
              },
              required: ["clauseName", "clauseValue"],
              additionalProperties: false
            }
          }
        },
        required: ["clausesList"],
        additionalProperties: false
      }
    }
  }
});

const aiAnalysisRaw = chatCompletion.choices[0]?.message.content;
const extractedArray = aiAnalysisRaw ? JSON.parse(aiAnalysisRaw).clausesList : [];

const clauseJsonResult: Record<string, string> = {};
extractedArray.forEach((item: { clauseName: string; clauseValue: string }) => {
  clauseJsonResult[item.clauseName] = item.clauseValue;
});

    const savedRecord = await prisma.ndaAnalysis.create({
      data: {
        dealId: Number(currentDealIdInt), 
        parentId: targetParentId,
        type: fileType,
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        analysisResult: clauseJsonResult,
        version: nextVersionInt === 1 ? 1 : nextVersionInt, // Default to version 1 if not provided
        createdAt: new Date()
      }
    });
    
    res.status(200).json(savedRecord);

  } catch (error: any) {
    console.error('Failure inside multi-step NDA parsing workflow:', error);
    res.status(500).json({ message: error.message || 'Internal Server pipeline crashed.' });
  }
};

export const extractTextFromFile = async (filePath: string): Promise<string> => {
  const fileBuffer = fs.readFileSync(filePath); 
  const extension = path.extname(filePath).toLowerCase();

  try {
    if (extension === '.pdf') {
      //const parser = new PDFParse({ data: fileBuffer });
      //const parsedPdf = await parser.getText();
      //await parser.destroy(); 
      //return parsedPdf.text; 
const parsedPdf: any = await new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      resolve(pdfData);
    });

    pdfParser.parseBuffer(fileBuffer);
  });

  if (!parsedPdf?.Pages) {
    throw new Error("Invalid PDF structure");
  }

  const text = parsedPdf.Pages.map((page: any) => {
    return page.Texts?.map((textItem: any) => {
      return textItem.R?.map((r: any) => safeDecode(r.T || "")).join(" ") || "";
    }).join(" ") || "";
  }).join("\n");

  return text;
  
    }

    if (extension === '.docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value; 
    }

    throw new Error('Unsupported file extension.');
  } catch (error: any) {
    console.error(`Error parsing document extraction for ${extension}:`, error);
    throw new Error(`Failed to extract document contents: ${error.message}`);
  }
};

export const crossCampareClause = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceFileId, targetLookupFileId } = req.body;
    if (!sourceFileId && !targetLookupFileId) {
      res.status(400).json({ message: 'Template and Counterparty clauses are required.' });
      return;
    }

    // 1. Fetch both target analysis result blocks out of database records
    const sourceRecord = await prisma.ndaAnalysis.findUnique({ where: { id: parseInt(sourceFileId, 10) } });
    const targetRecord = await prisma.ndaAnalysis.findUnique({ where: { id: parseInt(targetLookupFileId, 10) } });

    if (!sourceRecord || !targetRecord) {
      res.status(500).json({ message:'Could not locate one or both analysis files in database tracking records.' });
    }

    const sourceClausesText = typeof sourceRecord?.analysisResult === 'string' 
      ? sourceRecord?.analysisResult 
      : JSON.stringify(sourceRecord?.analysisResult);

    const targetClausesText = typeof targetRecord?.analysisResult === 'string' 
      ? targetRecord?.analysisResult 
      : JSON.stringify(targetRecord?.analysisResult);

    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      response_format: {
        type: "json_schema",
        json_schema: { name: "nda_recomparison", strict: true, schema: ndaSchema }
      },
      messages: [
        { 
          role: "system", 
          content: `You are a professional legal AI. Compare the draft against the template and highlight deviations with RAG scores.
          CRITICAL INSTRUCTION FOR TEXT LENGTH:
          - 'whatChanged' MUST be a very short sentence explaining only the direct change (Max 5-8 words). Example: "Changed from England & Wales to New York"
          - 'suggestedResponse' MUST be a punchy, actionable fragment (Max 3-5 words). Example: "Revert to England & Wales" or "Review if acceptable". Do not write long paragraphs or explanations.` 
        },
        { 
          role: "user", 
          content: `SOURCE FILE CLAUSES:\n${sourceClausesText}\n\n-------------------------\n\nCOMPARED TARGET FILE CLAUSES:\n${targetClausesText}`
        }
      ]
    });

    const parsedResults = JSON.parse(completion.choices[0]?.message.content || "{}");
    res.status(200).json(parsedResults);
  } catch (error: any) {
    console.error('Error during clause cross-comparison:', error);
    res.status(500).json({ message: error.message || 'Internal Server pipeline crashed.' });
  }
}
export const safeDecode =  (text: string): string => {
  try {
    return decodeURIComponent(text.replace(/\+/g, " "));
  } catch {
    return text;
  }
}
