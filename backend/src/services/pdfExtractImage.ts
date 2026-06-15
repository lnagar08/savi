import { exportImages } from 'pdf-export-images';

export async function exportPdfPagesAsImages(filePath: string): Promise<string[]> {
    try {
        const outputDir = './uploads/extracted';
        console.log(`Exporting PDF pages as images from:`);
        const images = await exportImages(filePath, outputDir) as string[];
        return images; // Return array of image paths
    } catch (error) {
        console.error('Error exporting PDF pages as images:', error);
        throw error;
    }
}