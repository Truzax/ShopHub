import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY' });

export class AiService {
    /**
     * Generates a comprehensive sales summary from the provided aggregated order data.
     */
    static async generateSalesSummary(ordersData: any): Promise<any> {
        try {
            const prompt = `
            You are an expert e-commerce business analyst. Analyze the following sales data and provide a concise, structured business summary.
            The response must be in strict JSON format with exactly these keys and nested structures:
            {
              "revenue": { "value": "$12,450", "trend": "+15%", "isPositive": true, "insight": "Driven by..." },
              "bestSelling": { "category": "Wireless Headphones", "insight": "Accounted for 30% volume" },
              "growth": { "value": "8.5%", "isPositive": true, "insight": "Consistent daily increases" },
              "improvementArea": { "area": "Accessories", "insight": "Consider bundling to clear stock" },
              "customerPattern": { "insight": "High cart abandonment on weekends" }
            }
            
            Do NOT include markdown formatting (\`\`\`json) in the response, just the raw JSON object. Use realistic approximations for values and trends based on the data.
            
            Sales Data:
            ${JSON.stringify(ordersData, null, 2)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = response.text || "{}";
            // Clean up possible markdown if model includes it despite instructions
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error: any) {
            console.error("AI Sales Summary Error:", error);
            throw new Error("Failed to generate AI sales summary");
        }
    }

    /**
     * Generates actionable performance insights based on product and inventory data.
     */
    static async generatePerformanceInsights(productsData: any, ordersData: any): Promise<any> {
        try {
            const prompt = `
            You are an e-commerce inventory and performance optimization AI. 
            Evaluate the following product inventory and recent order data to provide 3-5 actionable insights and recommendations.
            
            Examples of good insights: 
            - "Restock Product X immediately as it is trending but low in stock."
            - "Bundle Product Y with Z to increase AOV."
            - "Category A sales have dropped, consider a promotion."
            
            The response must be a strict JSON array of objects, where each object has:
            - "type": "warning" | "success" | "info" | "recommendation"
            - "title": A short, punchy title.
            - "description": The detailed insight and recommended action.

            Do NOT include markdown formatting (\`\`\`json) in the response, just the raw JSON array.
            
            Products Data:
            ${JSON.stringify(productsData, null, 2)}
            
            Orders Data:
            ${JSON.stringify(ordersData, null, 2)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = response.text || "[]";
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error: any) {
            console.error("AI Performance Insights Error:", error);
            throw new Error("Failed to generate AI performance insights");
        }
    }

    /**
     * Generates a detailed product description based on basic inputs.
     */
    static async generateProductDescription(inputs: { name: string; category: string; features: string; tone: string; keywords: string }): Promise<any> {
        try {
            const prompt = `
            You are an expert e-commerce copywriter and SEO specialist. 
            Generate a compelling product description based on the following inputs:
            - Product Name: ${inputs.name}
            - Category: ${inputs.category}
            - Features: ${inputs.features}
            - Target Tone: ${inputs.tone}
            - SEO Keywords: ${inputs.keywords}
            
            The response must be in strict JSON format with the following keys:
            - "shortDescription": A 1-2 sentence catchy summary.
            - "longDescription": A detailed, multi-paragraph marketing description.
            - "bulletPoints": An array of strings highlighting key features.
            - "seoKeywords": An array of strings containing suggested SEO keywords based on the input.
            
            Do NOT include markdown formatting (\`\`\`json) in the response, just the raw JSON object.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = response.text || "{}";
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error: any) {
            console.error("AI Product Description Error:", error);
            throw new Error("Failed to generate AI product description");
        }
    }

    /**
     * Handles the conversational AI Shopping Assistant.
     */
    static async handleChat(messages: { role: 'user' | 'model'; content: string }[], contextData: any, role: string): Promise<string> {
        try {
            let systemPrompt = '';

            if (role === 'admin') {
                systemPrompt = `
                You are an intelligent business and operations assistant for an e-commerce platform.
                Your role is to help the admin manage the store, analyze sales, check inventory, and understand customer behavior.
                
                Context Data (Recent Orders, Low Stock, etc.):
                ${JSON.stringify(contextData, null, 2)}
                
                Rules:
                1. Answer questions concisely and focus on operational efficiency.
                2. Use the provided Context Data to answer questions accurately. Do not invent data.
                3. If asked for recommendations, suggest business actions (e.g. "Restock this item", "Run a promotion").
                4. Use Markdown tables, bullet points, and bold text to make your responses easy to read.
                5. If a query is unrelated to store management, politely steer the conversation back.
                `;
            } else {
                systemPrompt = `
                You are a helpful, professional, and friendly AI Shopping Assistant for an e-commerce store.
                Your goal is to help customers find products, provide recommendations, and answer questions about the store's offerings.
                
                Context Data (Available Products, etc.):
                ${JSON.stringify(contextData, null, 2)}
                
                Rules:
                1. Only recommend products that exist in the Context Data.
                2. If asked about prices or stock, use the data provided.
                3. Be concise, engaging, and conversational.
                4. Prioritize helping the user find what they need and encourage conversion.
                5. Do NOT use markdown for JSON; use regular markdown for formatting text (bold, lists).
                `;
            }

            // Prepare history for Gemini
            const contents = messages.map(msg => ({
                role: msg.role, // 'user' or 'model'
                parts: [{ text: msg.content }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
                config: {
                    systemInstruction: systemPrompt
                }
            });
            
            return response.text || "I'm sorry, I couldn't process that request.";
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            throw new Error("Failed to handle AI chat request");
        }
    }
}
