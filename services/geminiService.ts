
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const sendMessageToGemini = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return "API Key is missing. Please check your environment.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a friendly, concise, and futuristic AI assistant residing in a liquid glass body. Use warm, helpful language and keep responses engaging but relatively brief.",
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong with my processing unit. Could you try again?";
  }
};
