import { extname } from "node:path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { CustomError } from "../lib/custom-error.js";
//import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"; 

//pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs";

const allowedMimeTypes = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const normalizeExtractedText = (value: string): string => value.replace(/\r/g, "").trim();

export type ExtractedImage = {
  contentType: string;
  dataUri: string;
};

export type ParsedDealPage = {
  page: number;
  text: string;
  images: ExtractedImage[];
};

export type ParsedDealFile = ParsedDealPage[];

export const extractDealFileContent = async (file: Express.Multer.File): Promise<ParsedDealFile> => {
  const extension = extname(file.originalname).toLowerCase();
  const hasAllowedMimeType = allowedMimeTypes.has(file.mimetype);
  const hasAllowedExtension = extension === ".pdf" || extension === ".docx";

  if (!hasAllowedMimeType && !hasAllowedExtension) {
    throw new CustomError("Invalid file type. Only PDF or DOCX is allowed.", 400);
  }

  let extractedPages: ParsedDealFile = [];
  const extractedImages: ExtractedImage[] = [];

  try {
    if (extension === ".pdf" || file.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const parsedPdf = await parser.getText();
        const pdfPages = Array.isArray(parsedPdf.pages) ? parsedPdf.pages : [];

        extractedPages = pdfPages.map((pdfPage, index) => ({
          page: typeof pdfPage.num === "number" ? pdfPage.num : index + 1,
          text: normalizeExtractedText(pdfPage.text ?? ""),
          images: [],
        }));

        if (extractedPages.length === 0) {
          extractedPages = [
            {
              page: 1,
              text: normalizeExtractedText(parsedPdf.text ?? ""),
              images: [],
            },
          ];
        }
      } finally {
        await parser.destroy();
      }
    } else if (
      extension === ".docx" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const parsedDocx = await mammoth.extractRawText({ buffer: file.buffer });

      // Extract embedded DOCX images and expose them as data URIs.
      await mammoth.convertToHtml(
        { buffer: file.buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const base64 = await image.readAsBase64String();
            const dataUri = `data:${image.contentType};base64,${base64}`;

            extractedImages.push({
              contentType: image.contentType,
              dataUri,
            });

            return { src: dataUri };
          }),
        },
      );

      extractedPages = [
        {
          page: 1,
          text: normalizeExtractedText(parsedDocx.value),
          images: extractedImages,
        },
      ];
    }
  } catch (e) {
    console.log(e);
    throw new CustomError("Failed to parse the uploaded file.", 422);
  }

  const hasExtractedText = extractedPages.some((entry) => entry.text.length > 0);
  if (!hasExtractedText) {
    throw new CustomError("Unable to extract text from the uploaded file.", 422);
  }

  return extractedPages;
};