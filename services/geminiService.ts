
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SEARCH_BASE_URLS: Record<string, string> = {
  "fashion": "https://www.amazon.com/s?k=",
  "shoe": "https://www.nike.com/w?q=",
  "electronics": "https://www.bestbuy.com/site/searchpage.jsp?st=",
  "default": "https://www.google.com/search?q=buy+"
};

const SYSTEM_INSTRUCTION = `
You are a high-performance computer vision expert specializing in retail and e-commerce.
Your task is to detect and identify commercial products in the provided image frame.
For each product found:
1. Provide a specific product name.
2. Identify a category (fashion, electronics, home decor, beauty, accessories, furniture, food).
3. Provide normalized bounding box coordinates [ymin, xmin, ymax, xmax] between 0 and 1000.
4. Confidence score (0.0 to 1.0).

Return ONLY a JSON object.
`;

export async function detectProducts(base64Image: string): Promise<DetectionResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Detect all visible products that could be purchased. Return JSON with 'products' array containing: {id, name, category, box: [ymin, xmin, ymax, xmax], confidence}." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  box: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    minItems: 4,
                    maxItems: 4,
                  },
                  confidence: { type: Type.NUMBER }
                },
                required: ["id", "name", "category", "box", "confidence"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The AI model returned an empty response.");
    
    const result = JSON.parse(text);
    
    if (!result.products || !Array.isArray(result.products)) {
      return { products: [] };
    }

    const products = result.products.map((p: any) => {
      const baseUrl = SEARCH_BASE_URLS[p.category.toLowerCase()] || SEARCH_BASE_URLS["default"];
      const ymin = p.box[0];
      const xmin = p.box[1];
      const ymax = p.box[2];
      const xmax = p.box[3];

      return {
        ...p,
        box: { ymin, xmin, ymax, xmax },
        shoppingLink: `${baseUrl}${encodeURIComponent(p.name)}`
      };
    });

    return { products };
  } catch (error: any) {
    console.error("Gemini Detection Error:", error);
    // Propagate meaningful error messages
    if (error.message?.includes("API_KEY")) {
      throw new Error("Invalid or missing API Key. Please check your configuration.");
    }
    throw new Error(error.message || "An unexpected error occurred during product detection.");
  }
}
