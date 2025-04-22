import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "i want you to say hello jaimz",
  });
  console.log(response.text);
}

await main();