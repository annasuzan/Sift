import pdfParse from "@cyber2024/pdf-parse-fixed";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfData = await pdfParse(buffer);
  const cleaned = cleanResumeText(pdfData.text);
  if (!cleaned || cleaned.trim().length === 0) {
    throw new Error("No extractable text found in PDF");
  }
  return cleaned;
}

function cleanResumeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\w\s\n\.\,\-\(\)\@\/\+\#]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[\s\-\_\=\*\.]+$/gm, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
    .join("\n")
    .trim();
}
