import { extname } from "node:path";

import mammoth from "mammoth";
import { CustomError } from "../lib/custom-error.js";
import fs from 'fs-extra';
import path from 'path';
import JSZip from 'jszip';
import { extractImages, getDocumentProxy } from 'unpdf'
import sharp from 'sharp';
import axios from "axios";
const allowedMimeTypes = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

interface TextFragment {
  text: string;
  isBold: boolean;
  x: number;
}

interface ExtractedElement {
  type: 'text' | 'image' | 'table-row';
  fragments?: TextFragment[];
  fontSize?: number;
  isRightAligned: boolean;
  relativeY: number;
  fullRawText?: string;
  isLineMainlyBold?: boolean;
  html: string;
  columns?: string[];
  rawY: number; 
}

export type ExtractedImage = {
  contentType: string;
  dataUri: string;
};

export type ParsedBidPage = {
  text: string;
};
export type ParsedBidFile = ParsedBidPage[];

//export const extractBidFileContent = async (file: Express.Multer.File, filePath: string): Promise<ParsedBidFile> => {
export const extractBidFileContent = async (filePath: string, extension: string): Promise<ParsedBidFile> => {
  //const extension = extname(file.originalname).toLowerCase();
  //const hasAllowedMimeType = allowedMimeTypes.has(file.mimetype);
  //const hasAllowedExtension = extension === ".pdf" || extension === ".docx";

  //if (!hasAllowedMimeType && !hasAllowedExtension) {
  //  throw new CustomError("Invalid file type. Only PDF or DOCX is allowed.", 400);
  //}

  let extractedPages: ParsedBidFile = [];

  try {
    if (extension === "pdf") {
     const response = await axios.get(filePath, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data);

        //const cleanFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        //const absolutePath = path.resolve(process.cwd(), cleanFilePath); 

        //if (!fs.existsSync(absolutePath)) {
        //    throw new Error(`File does not exist on disk at: ${absolutePath}`);
        //}
        
        const htmlResult = await convertPdfToDynamicSimpleHtml(buffer);
        
        extractedPages = [{ text: htmlResult}];
      
    } else if (
      extension === "docx"
      //file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
const response = await axios.get(filePath, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data);
        const zip = await JSZip.loadAsync(buffer);

        let headerImageHtml = '';
        let usedHeaderImageName = ''; 

        const headerRelsFiles = Object.keys(zip.files).filter(name => 
            name.startsWith('word/_rels/header') && name.endsWith('.xml.rels')
        );

        let targetImagePart = '';
        if (headerRelsFiles.length > 0 && headerRelsFiles[0]) {
            const fileObject = zip.file(headerRelsFiles[0]);
            if (fileObject) {
                const relsContent = await fileObject.async('text');
                const imageTargetMatch = relsContent.match(/Target="([^"]+)"/);
                
                if (imageTargetMatch && imageTargetMatch[1]) {
                    const cleanPath = imageTargetMatch[1].replace('../', '');
                    targetImagePart = `word/${cleanPath}`;
                }
            }
        }

        if (targetImagePart) {
            usedHeaderImageName = targetImagePart.split('/').pop() || '';
        } else {
            const mediaFiles = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));
            if (mediaFiles.length > 0 && mediaFiles[0]) {
                targetImagePart = mediaFiles[0];
                usedHeaderImageName = targetImagePart.split('/').pop() || '';
            }
        }

        if (targetImagePart) {
            const imageFile = zip.file(targetImagePart);
            if (imageFile) {
                const extension = targetImagePart.split('.').pop() || 'png';
                const base64Data = await imageFile.async('base64');
                headerImageHtml = `<div class="header-image" style="text-align: center; margin-bottom: 20px;">
                    <img src="data:image/${extension};base64,${base64Data}" alt="Header Image" />
                </div>\n`;
            }
        }

        const result = await mammoth.convertToHtml({ 
            buffer: buffer 
        }, {
            convertImage: mammoth.images.imgElement(async (image) => {
                
                const imageBuffer = await image.read();
                const base64 = imageBuffer.toString("base64");
                
                if (usedHeaderImageName) {
                    
                }

                return {
                    src: `data:${image.contentType};base64,${base64}`
                };
            })
        });

        let bodyHtml = result.value;
        if (headerImageHtml && bodyHtml.startsWith('<p><img')) {
            bodyHtml = bodyHtml.replace(/<p><img[^>]+><\/p>/, '');
        }

        extractedPages = [{ text: headerImageHtml + bodyHtml }];

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

export async function convertPdfToDynamicSimpleHtml(fileBuffer: Buffer): Promise<string> {
  const globalPdfjs = (globalThis as any).pdfjsLib;
  if (globalPdfjs) globalPdfjs.verbosity = 0; 

  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const totalPages = pdf.numPages;
  const htmlBlocks: string[] = [];

  const emailRegex = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const headingNumberRegex = /^(\d+\.\s+[A-Za-z\s]{3,})/; 
  const bulletRegex = /^[\u2022\u00b7\u25cf\u25cb-]\s*(.*)/; 

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageHeight = viewport.height;
    const pageWidth = viewport.width;

    const pageElements: ExtractedElement[] = [];

    // ==========================================================
    // Part 1: Extracting and processing images with accurate positioning
    // ==========================================================
    const rawImages = await extractImages(pdf, pageNum);
    const operatorList = await page.getOperatorList();
    
    // @ts-ignore
    const pdfjsOps = globalPdfjs?.OPS || {};
    const validImageTypes = [pdfjsOps.paintImageXObject, pdfjsOps.paintInlineImageXObject];

    let currentTransform: (number | undefined)[] = []; 
    let imageCounter = 0;

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];

      if (fn === pdfjsOps.transform) {
        currentTransform = args;
      }

      if (validImageTypes.includes(fn)) {
        try {
          const img = rawImages[imageCounter];
          imageCounter++;

          if (!img) continue;

          const rawBuffer = Buffer.from(img.data);
          const pngBuffer = await sharp(rawBuffer, {
            raw: { width: img.width, height: img.height, channels: (img.channels || 4) as 3 | 4 }
          }).png().toBuffer();

          const base64String = `data:image/png;base64,${pngBuffer.toString('base64')}`;
          const displayWidth = Math.abs(currentTransform[0] ?? img.width);
          const layoutY = currentTransform[5] ?? 0;
          const relativeY = ((pageHeight - layoutY) / pageHeight) * 100;

          const imgHtml = `<p style="text-align: center; margin: 20px 0;">
            <img src="${base64String}" style="width: ${displayWidth.toFixed(1)}px; max-width: 100%; height: auto;" alt="PDF Attached Image" />
          </p>`;

          pageElements.push({
            type: 'image',
            isRightAligned: false,
            relativeY,
            html: imgHtml,
            rawY: layoutY 
          });
        } catch (err) {
          continue;
        }
      }
    }

    // ==========================================================
    // Part 2: Text merging and table validation with strict rules
    // ==========================================================
    const textContent = await page.getTextContent();
    let currentLineFragments: TextFragment[] = [];
    let currentFontSize = 0;
    let lastY: number | null = null;
    let lastX = 0;

    for (const item of textContent.items) {
      if ('str' in item) {
        const str = item.str;
        const t0 = item.transform[0] ?? 0;
        const t1 = item.transform[1] ?? 0;
        let fontSize = Math.sqrt(t0 * t0 + t1 * t1);
        if (fontSize === 0 && item.height) fontSize = item.height;

        const currentX = item.transform[4] ?? 0;
        const currentY = item.transform[5] ?? 0;

        const fontKey = (item as any).fontName;
        let isBold = false;
        if (fontKey && page.commonObjs?.has(fontKey)) {
          const fontObj = page.commonObjs.get(fontKey);
          const realFontName = fontObj?.name || fontObj?.fontName || '';
          isBold = /bold|heavy|black/i.test(realFontName);
        } else {
          isBold = /bold|heavy|black/i.test(fontKey || '');
        }

        if (lastY !== null && (Math.abs(currentY - lastY) > 8 || Math.abs(fontSize - currentFontSize) > 2)) {
          const fullRawText = currentLineFragments.map(f => f.text).join('').trim();
          
          if (fullRawText !== '') {
            const isRightAligned = lastX > (pageWidth * 0.65);
            const relativeY = ((pageHeight - lastY) / pageHeight) * 100;
            const safeRawY = lastY ?? 0;

            const columns: string[] = [];
            let currentColumnText = '';
            let lastFragX = -1;

            currentLineFragments.sort((a, b) => a.x - b.x);

            for (const frag of currentLineFragments) {
              if (lastFragX !== -1 && (frag.x - lastFragX) > 55) { 
                if (currentColumnText.trim() !== '') columns.push(currentColumnText.trim());
                currentColumnText = '';
              }
              currentColumnText += (currentColumnText.endsWith(' ') || frag.text.startsWith(' ') ? '' : ' ') + frag.text;
              lastFragX = frag.x + (frag.text.length * (currentFontSize * 0.4)); 
            }
            if (currentColumnText.trim() !== '') columns.push(currentColumnText.trim());

            const hasNumericData = columns.some(col => /[\d\£\$]/.test(col));
            const hasShortCells = columns.every(col => col.length < 25);
            const isRealTable = columns.length >= 3 && 
                                fullRawText.length > 5 && 
                                !headingNumberRegex.test(fullRawText) && 
                                hasNumericData && 
                                hasShortCells && 
                                !fullRawText.endsWith('.');

            if (isRealTable) {
              pageElements.push({
                type: 'table-row',
                isRightAligned: false,
                relativeY,
                columns,
                isLineMainlyBold: currentLineFragments.filter(f => f.isBold).length > (currentLineFragments.length / 2),
                html: '',
                rawY: safeRawY
              });
            } else {
              pageElements.push({ 
                type: 'text',
                fragments: [...currentLineFragments], 
                fontSize: currentFontSize, 
                isRightAligned,
                relativeY,
                fullRawText,
                isLineMainlyBold: currentLineFragments.filter(f => f.isBold).length > (currentLineFragments.length / 2),
                html: '',
                rawY: safeRawY
              });
            }
          }
          currentLineFragments = [];
        }

        currentLineFragments.push({ 
          text: str, 
          isBold,
          x: currentX
        });

        currentFontSize = fontSize;
        lastY = currentY;
        lastX = currentX;
      }
    }

    const fullRawText = currentLineFragments.map(f => f.text).join('').trim();
    if (fullRawText !== '' && lastY !== null) {
      const relativeY = ((pageHeight - lastY) / pageHeight) * 100;
      pageElements.push({ 
        type: 'text',
        fragments: currentLineFragments, 
        fontSize: currentFontSize, 
        isRightAligned: lastX > (pageWidth * 0.65),
        relativeY,
        fullRawText,
        isLineMainlyBold: currentLineFragments.filter(f => f.isBold).length > (currentLineFragments.length / 2),
        html: '',
        rawY: lastY
      });
    }

    pageElements.sort((a, b) => a.relativeY - b.relativeY);

    // ==========================================================
    // Part 3: Merging multi-line paragraphs and multi-line bullets (Improvement)
    // ==========================================================
    const finalMergedElements: ExtractedElement[] = [];
    let activePara: ExtractedElement | null = null;

    for (const el of pageElements) {
      if (el.type !== 'text') {
        if (activePara) { finalMergedElements.push(activePara); activePara = null; }
        finalMergedElements.push(el);
        continue;
      }

      const rawText = el.fullRawText ?? '';
      const isHeading = headingNumberRegex.test(rawText) || (el.isLineMainlyBold && rawText.length < 60 && !rawText.endsWith('.'));
      const isBullet = bulletRegex.test(rawText);

      if (isHeading || el.isRightAligned || pageNum === 1) {
        if (activePara) { finalMergedElements.push(activePara); activePara = null; }
        finalMergedElements.push(el);
        continue;
      }

      if (activePara) {
        const prevText = activePara.fullRawText ?? '';
        const isPrevHeading = headingNumberRegex.test(prevText) || (activePara.isLineMainlyBold && prevText.length < 60 && !prevText.endsWith('.'));
        const isPrevBullet = bulletRegex.test(prevText);
        
        const gap = Math.abs(activePara.rawY - el.rawY);
        const isFontSizeSame = Math.abs((activePara.fontSize ?? 0) - (el.fontSize ?? 0)) < 1.5;

        
        const shouldMergeParagraph = gap < 16 && !isPrevHeading && isFontSizeSame && !isBullet;
        const shouldMergeBulletContinuation = gap < 16 && isPrevBullet && !isBullet && !isHeading;

        if (shouldMergeParagraph || shouldMergeBulletContinuation) {
          activePara.fragments = [...(activePara.fragments ?? []), ...(el.fragments ?? [])];
          activePara.fullRawText = (activePara.fullRawText ?? '') + ' ' + rawText;
          activePara.rawY = el.rawY; 
        } else {
          finalMergedElements.push(activePara);
          activePara = el;
        }
      } else {
        activePara = el;
      }
    }
    if (activePara) finalMergedElements.push(activePara);
    // ==========================================================
    // Part 4: Final HTML rendering (Double Bullet Root Fix)
    // ==========================================================
    let isInsideList = false;
    let isInsideTable = false;
    for (const element of finalMergedElements) {
        if (element.type === 'image') {
            if (isInsideList) {
                htmlBlocks.push('');
                isInsideList = false;
            }
            if (isInsideTable) {
                htmlBlocks.push('');
                isInsideTable = false;
            }
            htmlBlocks.push(element.html);
            continue;
        }
        if (element.type === 'table-row' && element.columns) {
            if (isInsideList) {
                htmlBlocks.push('');
                isInsideList = false;
            }
            if (!isInsideTable) {
                htmlBlocks.push(`<div class="table-responsive" style="overflow-x: auto; margin: 18px 0;"><table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 13px;"><tbody>`);
                isInsideTable = true;
            }
            const rowBg = element.isLineMainlyBold ? 'background-color: #f8f9fa; font-weight: bold;' : '';
            htmlBlocks.push(`<tr style="border-bottom: 1px solid #e0e0e0; ${rowBg}">`);
            for (const colText of element.columns) {
                let cleanCol = colText.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
                if (emailRegex.test(cleanCol)) cleanCol = cleanCol.replace(emailRegex, '$1');
                if (urlRegex.test(cleanCol)) cleanCol = cleanCol.replace(urlRegex, '$1');
                const padding = element.isLineMainlyBold ? 'padding: 10px 8px;' : 'padding: 8px;';
                const align = /^\d|^\£/.test(cleanCol.trim()) ? 'text-align: right;' : 'text-align: left;';
                htmlBlocks.push(`<td style="${padding} ${align} color: #333; line-height: 1.4;">${cleanCol}</td>`);
            }
            htmlBlocks.push('');
            continue;
        }
        if (isInsideTable && element.type !== 'table-row') {
            htmlBlocks.push('');
            isInsideTable = false;
        }
        const rawText = element.fullRawText ?? '';
        if (element.relativeY < 8.0 && rawText.length < 40) continue;
        if (element.relativeY > 92.0 && (rawText.length < 10 || /^\d+$/.test(rawText))) continue;
        const bulletMatch = rawText.match(bulletRegex);
        
        const stripBulletRegex = /^\s*[\u2022\u00b7\u25cf\u25cb-]\s*/;
        let innerHtml = (element.fragments ?? []).map((f, idx) => {
            let clean = f.text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
            if (bulletMatch && idx === 0) {
                clean = clean.replace(stripBulletRegex, '');
            }
            if (emailRegex.test(clean)) clean = clean.replace(emailRegex, '$1');
            if (urlRegex.test(clean)) clean = clean.replace(urlRegex, '$1');
            return f.isBold ? `<strong>${clean}</strong>` : clean;
        }).join('');
        
        if (bulletMatch) {
            innerHtml = innerHtml.replace(stripBulletRegex, '');
        }

    
    if (emailRegex.test(innerHtml)) {
      innerHtml = innerHtml.replace(emailRegex, '<a href="mailto:$1" style="color: #0066cc; text-decoration: underline;">$1</a>');
    }

    if (urlRegex.test(innerHtml)) {
      innerHtml = innerHtml.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline;">$1</a>');
    }


      if (element.isRightAligned && rawText.length < 35) {
          if (isInsideList) {
              htmlBlocks.push('');
              isInsideList = false;
          }
          htmlBlocks.push(`<p style="text-align: right; font-size: ${(element.fontSize ?? 12).toFixed(1)}px; color: #444; margin-bottom: 4px;">${innerHtml}</p>`);
          continue;
      }
      if (bulletMatch) {
          if (!isInsideList) {
              htmlBlocks.push('');
              isInsideList = true;
          }
          htmlBlocks.push(`<li style="margin-bottom: 6px;">${innerHtml}</li>`);
          continue;
      } else if (isInsideList) {
          htmlBlocks.push('');
          isInsideList = false;
      }
      if (pageNum === 1) {
          if (element.isLineMainlyBold) {
              htmlBlocks.push(`<h1 style="font-size: 24px; font-weight: bold; border-bottom: 3px solid #FF7373; padding-bottom: 8px; margin-top: 30px; margin-bottom: 25px; color: #111; font-family: sans-serif;">${innerHtml}</h1>`);
          } else {
              htmlBlocks.push(`<p style="font-size: 19px; font-weight: 300; font-family: 'Segoe UI Light', 'Helvetica Neue Light', 'Segoe UI', sans-serif; color: #222; opacity: 0.82; margin-bottom: 14px; line-height: 1.3; letter-spacing: 0.3px;">${innerHtml}</p>`);
          }
          continue;
      }
      const isHeadingStructure = headingNumberRegex.test(rawText) || (element.isLineMainlyBold && rawText.length < 60 && !rawText.endsWith('.'));
      if (isHeadingStructure) {
          const isMajorHeading = (element.fontSize ?? 0) > 15 || headingNumberRegex.test(rawText);
          const tag = isMajorHeading ? 'h2' : 'h3';
          const color = isMajorHeading ? '#FF7373' : '#111';
          htmlBlocks.push(`<${tag} style="margin-top: 22px; margin-bottom: 10px; font-weight: bold; color: ${color}; font-family: sans-serif;">${innerHtml}</${tag}>`);
      } else {
          const isContactLine = rawText.length < 35 && ((element.fragments ?? []).some(f => f.isBold) || emailRegex.test(rawText) || rawText.startsWith('M:') || rawText.startsWith('E:'));
          const marginBottom = isContactLine ? 'margin-bottom: 3px;' : 'margin-bottom: 11px;';
          htmlBlocks.push(`<p style="line-height: 1.6; ${marginBottom} color: #222; font-family: sans-serif;">${innerHtml}</p>`);
      }
    }
    if (isInsideTable) htmlBlocks.push('');
    if (isInsideList) htmlBlocks.push('');
  }
  return htmlBlocks.join('\n');
}
