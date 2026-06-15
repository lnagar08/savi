import {
    ServicePrincipalCredentials,
    PDFServices,
    MimeType,
    ExtractPDFParams,
    ExtractElementType,
    ExtractPDFJob,
    ExtractPDFResult,
    ExportPDFToImagesParams,
    ExportPDFToImagesTargetFormat,
    ExportPDFToImagesOutputType,
    ExportPDFToImagesJob,
    ExportPDFToImagesResult,
    ClientConfig
} from "@adobe/pdfservices-node-sdk";
import fs from "fs";
import unzipper from "unzipper";
import sharp from "sharp";
import path from "path";

export async function exportPdfPagesAsImages(filePath: string) {
    let readStream: fs.ReadStream | undefined;
    const outputFolder = "./uploads/extracted";
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

    try {
        const credentials = new ServicePrincipalCredentials({
            clientId: process.env.PDF_SERVICES_CLIENT_ID!,
            clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET!
        });

        const clientConfig = new ClientConfig({ 
            timeout: 600000 // 10 minutes
        });

        const pdfServices = new PDFServices({ 
            credentials, 
            clientConfig 
        });
        readStream = fs.createReadStream(filePath);
        
        const inputAsset = await pdfServices.upload({ readStream, mimeType: MimeType.PDF });

        // --- JOB 1: JSON Extract ---
        const extractParams = new ExtractPDFParams({ elementsToExtract: [ExtractElementType.TEXT] });
        const extractJob = new ExtractPDFJob({ inputAsset, params: extractParams });
        const extractURL = await pdfServices.submit({ job: extractJob });

        // --- JOB 2: Export to Images ---
        const exportParams = new ExportPDFToImagesParams({
            targetFormat: ExportPDFToImagesTargetFormat.JPEG,
            outputType: ExportPDFToImagesOutputType.LIST_OF_PAGE_IMAGES
        });
        const exportJob = new ExportPDFToImagesJob({ inputAsset, params: exportParams });
        const exportURL = await pdfServices.submit({ job: exportJob });

        // wait for both jobs to complete in parallel
        const [extractRes, exportRes] = await Promise.all([
            pdfServices.getJobResult({ pollingURL: extractURL, resultType: ExtractPDFResult }),
            pdfServices.getJobResult({ pollingURL: exportURL, resultType: ExportPDFToImagesResult })
        ]);

        // 1. get JSON data from extract job
        const jsonStream = await pdfServices.getContent({ asset: extractRes.result!.resource! });
        const chunks: any[] = [];
        for await (const chunk of jsonStream.readStream) chunks.push(chunk);
        const zipBuffer = Buffer.concat(chunks);
        const directory = await unzipper.Open.buffer(zipBuffer);
        const file = directory.files.find(f => f.path === 'structuredData.json');
        const jsonData = JSON.parse((await file!.buffer()).toString());

        // 2. save images from export job to disk
        const pageImagePaths: string[] = [];
        const resultAssets = exportRes.result!.assets!; 
        
        for (let i = 0; i < resultAssets.length; i++) {
            const imgPath = path.join(outputFolder, `page_${i}.jpeg`);
            const stream = await pdfServices.getContent({ asset: resultAssets[i]! });
            const writeStream = fs.createWriteStream(imgPath);
            stream.readStream.pipe(writeStream);
            await new Promise(r => writeStream.on('finish', r));
            pageImagePaths.push(imgPath);
        }

        // 3. Crop images based on JSON data using Sharp
        const cropResults = [];
        for (const page of jsonData.pages) {
            const inputPagePath: string | undefined = pageImagePaths[page.page_number];
            if (inputPagePath) {
                if (fs.existsSync(inputPagePath)) {
                    const metadata = await sharp(inputPagePath).metadata();
                    const [x1, y1, x2, y2] = page.boxes.CropBox;

                    const scaleX = metadata.width! / page.width;
                    const scaleY = metadata.height! / page.height;

                    const extractArea = {
                        left: Math.round(x1 * scaleX),
                        top: Math.round((page.height - y2) * scaleY), // Adobe (Bottom-Left) to Sharp (Top-Left)
                        width: Math.round((x2 - x1) * scaleX),
                        height: Math.round((y2 - y1) * scaleY)
                    };

                    const outPath = path.join(outputFolder, `final_crop_${page.page_number}.jpeg`);
                    await sharp(inputPagePath).extract(extractArea).toFile(outPath);
                    cropResults.push(outPath);
                }
            }
            
        }

        return { jsonData, cropResults };

    } catch (err) {
        console.error("Error:", err);
        throw err;
    }
}
