// app/api/voice-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  const requestBody = await request.json();
  const { transcript } = requestBody;

  if (!transcript) {
    return NextResponse.json(
      { error: "No transcript provided" },
      { status: 400 }
    );
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a prompt to extract job search keywords and location
    const prompt = `
You are a job search assistant for a labor marketplace app called "Naukri Bandhu". 
Analyze this voice query and extract relevant search keywords and location information.

User said: "${transcript}"

Please respond with a JSON object containing:
1. "searchKeywords": Array of relevant job-related keywords (skills, job types, etc.)
2. "location": Location mentioned (if any, otherwise null)
3. "intent": Brief description of what the user is looking for
4. "responseText": A natural response to speak back to the user

Focus on these job categories: construction, painting, plumbing, electrical work, cleaning, gardening, moving, delivery, security, cooking, etc.

Common locations in Bangalore: Jayanagar, Yelahanka, Electronic City, Whitefield, Koramangala, BTM Layout, JP Nagar, Indiranagar, Marathahalli, etc.

Example response:
{
  "searchKeywords": ["construction", "painting"],
  "location": "Yelahanka",
  "intent": "Looking for construction or painting jobs in Yelahanka area",
  "responseText": "I found some construction and painting jobs in Yelahanka. Let me show you the available opportunities."
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Parse the JSON response from Gemini
      const parsedResponse = JSON.parse(text);

      return NextResponse.json({
        success: true,
        data: parsedResponse,
      });
    } catch (parseError) {
      // If JSON parsing fails, return a fallback response
      return NextResponse.json({
        success: true,
        data: {
          searchKeywords: [transcript.toLowerCase()],
          location: null,
          intent: "General job search",
          responseText: `I'll search for jobs related to: ${transcript}`,
        },
      });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);

    // Fallback response without API
    return NextResponse.json({
      success: true,
      data: {
        searchKeywords: [transcript.toLowerCase()],
        location: null,
        intent: "General job search",
        responseText: `I'll search for jobs related to: ${transcript}`,
      },
    });
  }
}
