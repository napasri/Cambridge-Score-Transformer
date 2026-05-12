import { GoogleGenAI, Type } from "@google/genai";
import { RawScoreResult } from "../types";

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: "Full name of the student" },
      studentId: { type: Type.STRING, description: "Numerical student ID" },
      email: { type: Type.STRING, description: "Student email address" },
      assignmentName: { type: Type.STRING, description: "Name/Number of the assignment (e.g., Assignment 1)" },
      percentageScore: { type: Type.NUMBER, description: "The score as a percentage (0-100)" },
      lateStatus: { type: Type.STRING, description: "On time, Late, etc." },
      completionStatus: { type: Type.STRING, description: "Scored, In progress, etc." },
      className: { type: Type.STRING, description: "The class reference string found in the report header (e.g., 68_2_EN103_241A)" }
    },
    required: ["studentName", "email", "assignmentName", "percentageScore", "className"]
  }
};

export async function parseAssignmentData(text: string): Promise<RawScoreResult[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `You are a data extraction specialist. Parse the following OCR text or file data from a Cambridge assignment report.
          The data contains:
          1. Student lists with Assignment names, Names, and IDs.
          2. Score reports with Emails, Score percentages, Late status, and Completion status.

          CRITICAL: Correlate the scores with the correct assignment. The report usually lists scores sequentially by assignment.
          The output MUST be a JSON array of assignment results.

          Data to parse:
          ${text}
          `
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.1,
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse the data. Please ensure the text is correct.");
  }
}

/**
 * Handle image-based parsing if user uploads screenshots
 */
export async function parseImages(base64Images: string[]): Promise<RawScoreResult[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  try {
    const parts = base64Images.map(b64 => ({
      inlineData: {
        data: b64.split(",")[1],
        mimeType: "image/png"
      }
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          ...parts,
          {
            text: `Extract student assignment results from these screenshots of a Cambridge report.
            Return a JSON array of objects with: studentName, studentId, email, assignmentName, percentageScore, lateStatus, completionStatus, className.
            The 'className' is usually a code like '68_2_EN103_241A' found in the report header or repeatably in lines.
            Capture every score entry for every student (capture All assignments).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.1,
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Vision Parsing Error:", error);
    throw new Error("Failed to process images.");
  }
}

/**
 * Handle document-based parsing for PDFs
 */
export async function parseDocument(base64Data: string, mimeType: string): Promise<RawScoreResult[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data.split(",")[1],
              mimeType: mimeType
            }
          },
          {
            text: `Extract student assignment results from this Cambridge report document.
            Return a JSON array of objects with: studentName, studentId, email, assignmentName, percentageScore, lateStatus, completionStatus, className.
            The 'className' is usually a code like '68_2_EN103_241A' found in the report header or per assignment line.
            Capture every score entry for every student (capture All assignments).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        temperature: 0.1,
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Document Parsing Error:", error);
    throw new Error("Failed to process the document.");
  }
}
