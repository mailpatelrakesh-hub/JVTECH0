import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Parse JSON payloads with a higher limit for base64 file and image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Initialize Gemini Client Lazily/Safely or using Client-passed Key
  function getGeminiClient(customApiKey?: string) {
    const apiKey = (customApiKey && customApiKey.trim() !== "" && customApiKey !== "undefined" && customApiKey !== "null")
      ? customApiKey.trim()
      : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets/Environment or save a valid Gemini API Key in Admin Panel -> Settings.");
    }
    return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  }

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Resume & Photo Autofill Extraction Endpoint
  app.post("/api/gemini/extract", async (req, res) => {
    try {
      const { base64, mimeType } = req.body;
      const customApiKey = req.headers["x-gemini-api-key"] as string;
      if (!base64 || !mimeType) {
        return res.status(400).json({ error: "Missing base64 data or mimeType in request body." });
      }

      const ai = getGeminiClient(customApiKey);

      // Clean prefix if present (e.g. "data:image/png;base64,")
      let cleanBase64 = base64;
      if (base64.includes(";base64,")) {
        cleanBase64 = base64.split(";base64,")[1];
      }

      let textResult = "";
      const isWordDoc = mimeType.includes("word") || 
                        mimeType.includes("officedocument") || 
                        mimeType.includes("msword") || 
                        mimeType.includes("doc");

      const isText = mimeType.includes("text/") || mimeType === "application/json";

      if (isWordDoc) {
        try {
          const buffer = Buffer.from(cleanBase64, "base64");
          const result = await mammoth.extractRawText({ buffer });
          textResult = result.value || "";
          console.log(`Extracted ${textResult.length} characters from docx using mammoth.`);
        } catch (err: any) {
          console.error("Mammoth parsing failed, attempting plain text extraction fallback:", err);
          try {
            const buffer = Buffer.from(cleanBase64, "base64");
            const strings = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
            textResult = strings.slice(0, 50000);
          } catch (e) {
            console.error("Plain text extraction fallback failed:", e);
          }
        }
      } else if (isText) {
        try {
          textResult = Buffer.from(cleanBase64, "base64").toString("utf-8");
        } catch (e) {
          console.error("Failed to decode text file:", e);
        }
      }

      let response;
      if (textResult && textResult.trim().length > 0) {
        console.log("Sending text-based prompt to Gemini for extraction.");
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            `Extract all candidate profile details from the following resume text:\n\n${textResult}`,
          ],
          config: {
            systemInstruction: "You are an expert Indian recruiting assistant. Extract candidate registration details accurately. Ensure Dates are formatted as YYYY-MM-DD. For maritalStatus, use 'Single' or 'Married'. For ecrEcnr, determine if ECR (Emigration Check Required) or ECNR (Emigration Check Not Required) based on standard Indian passport norms. If age is not directly listed but DOB is present, calculate the age relative to year 2026. Fields to extract: name, fatherName, motherName, phone (Mobile Number), trade (Job Applied For), country, dateOfBirth (YYYY-MM-DD), age (Integer), address, maritalStatus, education (Educational Qualification, e.g. '10th', '12th', 'ITI', 'Graduate', etc.), language, passportNumber, passportExpires (YYYY-MM-DD), ecrEcnr ('ECR' or 'ECNR'). Return empty strings or null for completely missing details.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                fatherName: { type: Type.STRING },
                motherName: { type: Type.STRING },
                phone: { type: Type.STRING },
                trade: { type: Type.STRING },
                country: { type: Type.STRING },
                dateOfBirth: { type: Type.STRING },
                age: { type: Type.INTEGER },
                address: { type: Type.STRING },
                maritalStatus: { type: Type.STRING },
                education: { type: Type.STRING },
                language: { type: Type.STRING },
                passportNumber: { type: Type.STRING },
                passportExpires: { type: Type.STRING },
                ecrEcnr: { type: Type.STRING }
              }
            }
          }
        });
      } else {
        console.log(`Sending inlineData to Gemini for extraction. MimeType: ${mimeType}`);
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            },
            "Extract all candidate profile details from this resume, photo, or document. Return a JSON structure."
          ],
          config: {
            systemInstruction: "You are an expert Indian recruiting assistant. Extract candidate registration details accurately. Ensure Dates are formatted as YYYY-MM-DD. For maritalStatus, use 'Single' or 'Married'. For ecrEcnr, determine if ECR (Emigration Check Required) or ECNR (Emigration Check Not Required) based on standard Indian passport norms. If age is not directly listed but DOB is present, calculate the age relative to year 2026. Fields to extract: name, fatherName, motherName, phone (Mobile Number), trade (Job Applied For), country, dateOfBirth (YYYY-MM-DD), age (Integer), address, maritalStatus, education (Educational Qualification, e.g. '10th', '12th', 'ITI', 'Graduate', etc.), language, passportNumber, passportExpires (YYYY-MM-DD), ecrEcnr ('ECR' or 'ECNR'). Return empty strings or null for completely missing details.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                fatherName: { type: Type.STRING },
                motherName: { type: Type.STRING },
                phone: { type: Type.STRING },
                trade: { type: Type.STRING },
                country: { type: Type.STRING },
                dateOfBirth: { type: Type.STRING },
                age: { type: Type.INTEGER },
                address: { type: Type.STRING },
                maritalStatus: { type: Type.STRING },
                education: { type: Type.STRING },
                language: { type: Type.STRING },
                passportNumber: { type: Type.STRING },
                passportExpires: { type: Type.STRING },
                ecrEcnr: { type: Type.STRING }
              }
            }
          }
        });
      }

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned from Gemini API.");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          parsedData = JSON.parse(match[1].trim());
        } else {
          throw new Error("Gemini returned invalid JSON structure: " + text);
        }
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("AI Extraction Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to extract data." });
    }
  });

  // AI Demand Letter/Photo Extraction Endpoint
  app.post("/api/gemini/extract-demand", async (req, res) => {
    try {
      const { base64, mimeType } = req.body;
      const customApiKey = req.headers["x-gemini-api-key"] as string;
      if (!base64 || !mimeType) {
        return res.status(400).json({ error: "Missing base64 data or mimeType in request body." });
      }

      const ai = getGeminiClient(customApiKey);

      // Clean prefix if present (e.g. "data:image/png;base64,")
      let cleanBase64 = base64;
      if (base64.includes(";base64,")) {
        cleanBase64 = base64.split(";base64,")[1];
      }

      let textResult = "";
      const isWordDoc = mimeType.includes("word") || 
                        mimeType.includes("officedocument") || 
                        mimeType.includes("msword") || 
                        mimeType.includes("doc");

      const isText = mimeType.includes("text/") || mimeType === "application/json";

      if (isWordDoc) {
        try {
          const buffer = Buffer.from(cleanBase64, "base64");
          const result = await mammoth.extractRawText({ buffer });
          textResult = result.value || "";
          console.log(`Extracted ${textResult.length} characters from demand docx using mammoth.`);
        } catch (err: any) {
          console.error("Mammoth demand parsing failed, attempting plain text extraction fallback:", err);
          try {
            const buffer = Buffer.from(cleanBase64, "base64");
            const strings = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
            textResult = strings.slice(0, 50000);
          } catch (e) {
            console.error("Plain text extraction fallback failed:", e);
          }
        }
      } else if (isText) {
        try {
          textResult = Buffer.from(cleanBase64, "base64").toString("utf-8");
        } catch (e) {
          console.error("Failed to decode text file:", e);
        }
      }

      let response;
      if (textResult && textResult.trim().length > 0) {
        console.log("Sending text-based prompt to Gemini for demand extraction.");
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            `Extract scheduled client interview details from the following job demand or advertisement text:\n\n${textResult}`,
          ],
          config: {
            systemInstruction: "You are an expert Indian recruiting assistant. Extract scheduled client interview details from the uploaded job demand letter, advertisement, or text. Fields to extract:\n1. date: The interview/selection date if mentioned (format as YYYY-MM-DD. If only month/day or relative date is mentioned, assume year 2026. If no date is found, leave null or empty).\n2. companyName: The hiring company/employer name (e.g. 'Bin Laden Group', 'Almarai', etc.).\n3. trade: Extract EVERY SINGLE job trade/profile mentioned in the document or text. Do NOT omit, combine, or summarize any trade under any circumstance, even if there are 50+ different job profiles listed (e.g. 'Civil Engineer, Pipe Fitter, Welder, Electrician, Plumber, Mason, rigger, driver, laborer...'). Return all of them as a complete, comma-separated string of the trades.\n4. country: The country where the jobs are located. Check if it matches or can be mapped to one of these common ones: 'Saudi Arabia', 'Qatar', 'UAE', 'Oman', 'Kuwait', 'Bahrain', 'Russia', 'Croatia', 'Europe', 'Singapore', 'Romania'. If not, return the matched country name. Return empty strings or null for completely missing details.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                companyName: { type: Type.STRING },
                trade: { type: Type.STRING },
                country: { type: Type.STRING }
              }
            }
          }
        });
      } else {
        console.log(`Sending inlineData to Gemini for demand extraction. MimeType: ${mimeType}`);
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            },
            "Extract scheduled client interview details from this job demand letter, advertisement, or photo. Return a JSON structure with date, companyName, trade, and country."
          ],
          config: {
            systemInstruction: "You are an expert Indian recruiting assistant. Extract scheduled client interview details from the uploaded job demand letter, advertisement, or photo. Fields to extract:\n1. date: The interview/selection date if mentioned (format as YYYY-MM-DD. If only month/day or relative date is mentioned, assume year 2026. If no date is found, leave null or empty).\n2. companyName: The hiring company/employer name (e.g. 'Bin Laden Group', 'Almarai', etc.).\n3. trade: Extract EVERY SINGLE job trade/profile mentioned in the document or image. Do NOT omit, combine, or summarize any trade under any circumstance, even if there are 50+ different job profiles listed (e.g. 'Civil Engineer, Pipe Fitter, Welder, Electrician, Plumber, Mason, rigger, driver, laborer...'). Return all of them as a complete, comma-separated string of the trades.\n4. country: The country where the jobs are located. Check if it matches or can be mapped to one of these common ones: 'Saudi Arabia', 'Qatar', 'UAE', 'Oman', 'Kuwait', 'Bahrain', 'Russia', 'Croatia', 'Europe', 'Singapore', 'Romania'. If not, return the matched country name. Return empty strings or null for completely missing details.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                companyName: { type: Type.STRING },
                trade: { type: Type.STRING },
                country: { type: Type.STRING }
              }
            }
          }
        });
      }

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned from Gemini API.");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          parsedData = JSON.parse(match[1].trim());
        } else {
          throw new Error("Gemini returned invalid JSON structure: " + text);
        }
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("AI Demand Extraction Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to extract demand details." });
    }
  });

  // Serve Vite Assets in Development, static folder in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
