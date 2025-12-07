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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Create a prompt to extract job search keywords and location
    const prompt = `
You are an advanced job search assistant for "Naukri Bandhu" labor marketplace app.
Your job is to extract job search keywords and location from natural language queries.

User said: "${transcript}"

INSTRUCTIONS:
1. Extract job-related keywords from natural speech patterns
2. Handle conversational queries like "Can I get a job in [location]?", "Any work in [area]?", "I need [job type] work"
3. Use fuzzy location matching for common misspellings/variations
4. Extract multiple job types if mentioned
5. Be liberal with keyword extraction - better to include more than miss important ones

JOB CATEGORIES (be flexible with variations):
- construction, building, civil work, mason work, concrete work, site work
- painting, wall painting, interior painting, exterior painting
- plumbing, pipe work, water work, sanitary work, bathroom work
- electrical, wiring, power work, electrical installation
- cleaning, housekeeping, maintenance, sanitation
- gardening, landscaping, plant work
- hospital work, medical facility work, healthcare jobs
- delivery, moving, transport, logistics
- security, guard work, watchman
- cooking, kitchen work, food preparation

LOCATION FUZZY MATCHING:
- "Ilanka", "Yelankha", "Yellanka" → "Yelahanka"
- "Nagasaki", "Nagasandhra" → "Nagasandra"
- "Kormangala", "Koramangla" → "Koramangala"
- "Jaynagar", "Jayanagr" → "Jayanagar"
- "Electronic", "Electroni City" → "Electronic City"
- "Whitfield", "Whitefeld" → "Whitefield"
- "BTM", "BTM Layout" → "BTM Layout"
- "Marathalli", "Marathhalli" → "Marathahalli"
- "Indranagar", "Indiranagar" → "Indiranagar"

EXAMPLES:
- "Can I get a job in Ilanka?" → {"searchKeywords": ["job", "work"], "location": "Yelahanka"}
- "Any construction work near Electronic City?" → {"searchKeywords": ["construction", "building", "civil work"], "location": "Electronic City"}
- "I need hospital jobs" → {"searchKeywords": ["hospital", "medical", "healthcare", "cleaning", "maintenance"], "location": null}
- "Painting work in Jaynagar" → {"searchKeywords": ["painting", "wall painting"], "location": "Jayanagar"}

Respond with JSON:
{
  "searchKeywords": ["relevant", "job", "keywords"],
  "location": "Corrected Location Name or null",
  "intent": "Understanding of what user wants",
  "responseText": "Natural response to speak back"
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
