import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAIResponse(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  return response.text;
}

export async function convertTextToTasks(userInput) {
  const magicPrompt = `
You are a task planning assistant. Convert the following rough text into a JSON array of tasks.


Each task should look like this:
{
  "title": "Short task summary",
  "isCompleted": false
}

User's input:
"${userInput}"

Return ONLY a valid JSON array, with NO markdown or code blocks. Do not include any explanations, extra text, or formatting. Only the pure JSON array.
`;

  const result = await generateAIResponse(magicPrompt);
  return result;
}
