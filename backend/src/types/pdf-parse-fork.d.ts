declare module 'pdf-parse-fork' {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }
  const pdf: (dataBuffer: Buffer, options?: any) => Promise<PdfData>;
  export default pdf;
}
