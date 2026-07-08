import type { Request, Response } from "express";
import { extractBidFileContent } from "../services/bidLetter.service.js";
//import { analyzeBidContent } from "../services/openAiBidLetter.service.js";
import { prisma } from "../lib/prisma.js";
import { CustomError } from "../lib/custom-error.js";
import fs from 'fs'; // Put this at the very top of your file
import OpenAI from "openai";
const client = new OpenAI(); 
import { AuthenticatedRequest } from '../types/express.js';
export const createBidLetter = async (req: Request, res: Response) => {
  try {
    const { dealId, fileName, fileSize, extension, file } = req.body;
    //const file = req.file
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" })
    }
    
    // 1. Generate filename safely
    //const filename = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/_+/g, '_')}`;
    //const relativeUploadPath = `./uploads/${filename}`;

    // 2. Ensure directory exists and write file SYNCHRONOUSLY to block until done
    //if (!fs.existsSync('./uploads')) {
    //    fs.mkdirSync('./uploads', { recursive: true });
    //}
   // fs.writeFileSync(relativeUploadPath, file.buffer); 

    const pages = await extractBidFileContent(file, extension);

    const dealData = await prisma.deal.findUnique({
      where: { id: Number(req.body.dealId) },
      include: {
        deal_identification: true,
        property_details: true,
        tenant_information: true,
        lease_information: true,
        financial_information: true,
        market_context: true,
        deal_pipeline: true
      }
    });

    const userIdString = typeof (req as AuthenticatedRequest).user === 'object' ? (req as AuthenticatedRequest).user!.id : (req as AuthenticatedRequest).user;

    const userIdParsed = Number(userIdString);

    if (isNaN(userIdParsed)) {
      return res.status(400).json({ error: "Invalid User ID format. Express request failed to parse Int." });
    }

    const userData = await prisma.user.findUnique({
      where: { 
        id: userIdParsed 
      }
    });

    if (!dealData) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const clientDetails = {
      name: userData?.name || "Client Representative",
      company: (userData as any).company || "Commercial Property Investments Ltd", 
      address: (userData as any).address || "Corporate Office, London, UK", 
      phone: (userData as any).phone || "Phone Number",
      email: userData?.email || "recipient@company.com"
    };
    
    const finalHtmlOutput = await generateBidLetterFromData(dealData, pages[0]?.text ?? "", clientDetails);

    const deal = await prisma.bidLetter.create({
        data: {
            dealId: Number(req.body.dealId), 
            rawContent: finalHtmlOutput.content, 
        }
    });
    res.status(201).json({
      success: true,
      message: "Bid Letter parsed successfully",
      data: finalHtmlOutput,
    });
}catch (error) {
    console.error("Error creating bid letter:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

async function generateBidLetterFromData(dealData: any, bidLetterTemplate: string, clientDetails: any): Promise<{ projectName: string; content: string }> {
  
  const base64Regex = /data:image\/[a-zA-Z]+;base64,[^"']+/g;
  const savedImages: string[] = [];
  let imageCounter = 0;

  const temporaryHtml = bidLetterTemplate.replace(base64Regex, (match) => {
    savedImages.push(match);
    const placeholder = "%DYNAMIC_IMAGE_" + imageCounter + "%";
    imageCounter++;
    return placeholder;
  });

  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: 'system',
        content: `You are an elite commercial real estate underwriting specialist. Your sole task is to fully populate the provided 'Bid Letter HTML Template' using the detailed 'Deal JSON' records.

        CRITICAL GLOBAL CONTACT REPLACEMENT RULE (ANYWHERE IN TEMPLATE):
        - Scan the ENTIRE HTML template from top to bottom. The old placeholder contacts, names, phone numbers, and emails are NOT in fixed positions and can appear ANYWHERE in the document.
        - Actively look for any old placeholder people details, phone numbers, or email blocks scattered throughout the template (whether inside paragraphs, lists, header containers, or table cells).
        - COMPLETELY REMOVE those old placeholder contacts wherever you find them in the template.
        - In every exact location where those old contacts were removed, replace them beautifully and professionally by inserting the actual dynamic contact details retrieved from 'property_details.contacts'.
        - If a formal greeting or salutation (e.g., "Dear Simon...") appears anywhere, automatically update it to address the primary contact person listed inside the new 'property_details.contacts'.

        CRITICAL TABLE MAPPING RULES (ALL 6 TABLES):
        - DEAL IDENTIFICATION: Map 'deal_identification.ref', 'deal_name', 'location', and 'asset_class'.
        - PROPERTY DETAILS: Integrate 'property_details.property_description', 'site_area', 'floors', 'number_of_assets', and 'additional_features'. Use 'property_details.contacts' globally for all contact replacements.
        - TENANT INFORMATION: Map 'tenant_information.tenant_name', 'credit_rating', and 'business_description'.
        - LEASE INFORMATION: Map 'lease_information.lease_term_years', 'remaining_lease', 'indexation_formula' (Cap/Collar), and 'stabllised_NOI'.
        - FINANCIAL INFORMATION: Extract 'financial_information.purchase_price', 'asking_price', 'net_initial_yield_percent', and 'initial_payment'. Fully populate the financial grid/table.
        - MARKET CONTEXT: Synthesize 'market_context.location_overview', 'connectivity', and 'rental_levels' into professional investment paragraphs.

        Technical Rules:
        - Maintain all exact layout structures, tables, fonts, and inline CSS styles.
        - DO NOT change, delete, or modify image placeholders like %DYNAMIC_IMAGE_0%.

        OUTPUT FORMAT RULE:
        You must return a strict JSON object with exactly two keys:
        {
          "projectName": "Extracted title or heading name here",
          "content": "The full raw populated HTML string here"
        }
        `
      },
      {
        role: 'user',
        content: `New Property Contacts Data to Insert Globally:\n${JSON.stringify(dealData.property_details.contacts, null, 2)}\n\nDeal JSON Data (All 6 Tables):\n${JSON.stringify(dealData, null, 2)}\n\nHTML Template to Process:\n${temporaryHtml}`
      }
    ]
  });

  const rawJsonString = response.choices?.[0]?.message?.content || "{}";
  const parsedData = JSON.parse(rawJsonString);

  let finalBidHtml = (parsedData.content || "").trim();
  let extractedProjectName = parsedData.projectName || "Default_Project";

  savedImages.forEach((originalBase64, index) => {
    const placeholderToFind = "%DYNAMIC_IMAGE_" + index + "%";
    finalBidHtml = finalBidHtml.replace(placeholderToFind, originalBase64);
  });

  return {
    projectName: extractedProjectName,
    content: finalBidHtml
  };
}




export const bidLetterSubmit = async (req: Request, res: Response) => {
  try {
    const { dealId, rowContent, name } = req.body;
    if (!dealId && !rowContent) {
      return res.status(400).json({ message: "Data not submited" })
    }

    const deal = await prisma.bidLetterUpdated.create({
        data: {
            dealId: Number(dealId), 
            projectName: name,
            rawContent: rowContent ?? "", 
        }
    });
    if(!deal.id){
      res.status(400).json({ message: "Something went wrong!" })
    }
    res.status(201).json({
      success: true,
      message: "Bid Letter Submited Successfully"
    });

  } catch (error) {
    console.error("Error submitting bid letter:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const parseBid = async (req: Request, res: Response) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" })
    }   
    } catch (error) {
    console.error("Error parsing bid letter:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getBidLetterByBidId = async (req: Request, res: Response) => {

  const dealId = Number(req.params.id);
  if (!Number.isInteger(dealId) || dealId <= 0) {
    throw new CustomError("Invalid deal id", 400);
  }

  const bidLetter = await prisma.bidLetterUpdated.findMany({
    where: {
      dealId
    }
  });

  if (!bidLetter) {
    throw new CustomError("Bid Letter not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Bid Letter retrieved successfully",
    data: bidLetter,
  });
};

export const getBidLetterById = async (req: Request, res: Response) => {

  const bidId = Number(req.params.id);
  if (!Number.isInteger(bidId) || bidId <= 0) {
    throw new CustomError("Invalid deal id", 400);
  }

  const bidLetter = await prisma.bidLetterUpdated.findFirst({
    where: {
      id: bidId
    },
    select: {
      id: true,
      projectName: true,
      rawContent: true,
    },
  });

  if (!bidLetter) {
    throw new CustomError("Bid Letter not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Bid Letter retrieved successfully",
    data: bidLetter,
  });
};

export const updateBidLetterById = async (req: Request, res: Response) => {

  const bidId = Number(req.params.id);
  if (!Number.isInteger(bidId) || bidId <= 0) {
    throw new CustomError("Invalid deal id", 400);
  }

  const { name, rowContent } = req.body;

  const updatedBidLetter = await prisma.bidLetterUpdated.update({
    where: {
      id: bidId
    },
    data: {
      projectName: name,       
      rawContent: rowContent, 
    }
  });

  // 4. Success Response
  res.status(200).json({
    success: true,
    message: "Bid Letter updated successfully",
    data: updatedBidLetter,
  });
};

export const deleteBidLetterById = async (req: Request, res: Response) => {
  const bidId = Number(req.params.id);

  if (!Number.isInteger(bidId) || bidId <= 0) {
    throw new CustomError("Invalid bid id", 400);
  }

  await prisma.bidLetterUpdated.delete({
    where: {
      id: bidId
    }
  });

  res.status(200).json({
    success: true,
    message: "Bid Letter removed successfully",
  });
};
