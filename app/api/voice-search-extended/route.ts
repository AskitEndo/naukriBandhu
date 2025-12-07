// app/api/voice-search-extended/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  const requestBody = await request.json();
  const { transcript, availableJobs, noResultsFound } = requestBody;

  if (!transcript) {
    return NextResponse.json(
      { error: "No transcript provided" },
      { status: 400 }
    );
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Enhanced prompt for extended search with fuzzy matching
    const prompt = `
You are an advanced job search assistant for "Naukri Bandhu" labor marketplace app.
The user's initial search found ${
      noResultsFound ? "NO RESULTS" : "limited results"
    }.
Now perform an EXTENDED SEARCH with fuzzy matching and location similarity.

User said: "${transcript}"

Available job data context: ${JSON.stringify(availableJobs?.slice(0, 10) || [])}

EXTENDED SEARCH INSTRUCTIONS:
1. Use fuzzy matching for locations (e.g., "Nagasaki" → "Nagasandra", "Electronic City" → "Electronic City Phase 1")
2. Expand job type synonyms (e.g., "construction" includes "building", "civil work", "mason work")
3. Consider nearby areas and similar localities
4. Look for semantic matches (e.g., "hospital work" could match "hospital plumbing maintenance")

Location fuzzy matching examples:
- "Nagasaki" → "Nagasandra" 
- "Yelankha" → "Yelahanka"
- "BTM" → "BTM Layout"
- "Electronic" → "Electronic City"
- "Marathalli" → "Marathahalli" 
- "Jaynagar" → "Jayanagar"
- "Kormangala" → "Koramangala"

Job type expansions:
- construction → building, civil, mason, concrete, site work
- plumbing → pipe work, water work, sanitary
- electrical → wiring, power work, installation
- painting → wall painting, interior, exterior
- cleaning → housekeeping, maintenance

Respond with JSON containing:
1. "searchKeywords": Expanded array with synonyms and related terms
2. "location": Best matched location (with fuzzy matching)
3. "originalLocation": What user actually said
4. "locationSuggestions": Array of alternative location matches
5. "expandedTerms": Object showing how terms were expanded
6. "intent": Detailed understanding of user intent
7. "responseText": Conversational response explaining the expanded search
8. "fuzzyMatches": Array of specific fuzzy matches made
9. "nearbyAreas": Suggested nearby areas to search

Example response:
{
  "searchKeywords": ["construction", "building", "civil work", "mason work"],
  "location": "Nagasandra",
  "originalLocation": "Nagasaki", 
  "locationSuggestions": ["Nagasandra", "Nandini Layout"],
  "expandedTerms": {
    "construction": ["building", "civil work", "mason work"],
    "location": ["Nagasaki → Nagasandra"]
  },
  "intent": "User is looking for construction work in Nagasandra area (originally said Nagasaki)",
  "responseText": "I found construction and building work in Nagasandra - I think you meant Nagasandra when you said Nagasaki. Let me show you these opportunities.",
  "fuzzyMatches": ["Nagasaki → Nagasandra"],
  "nearbyAreas": ["Yelahanka", "Hebbal", "Sahakara Nagar"]
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
        extended: true,
      });
    } catch (parseError) {
      console.error("JSON parsing failed for extended search:", parseError);

      // Fallback with manual fuzzy matching
      const fuzzyLocationMap: { [key: string]: string } = {
        nagasaki: "Nagasandra",
        yelankha: "Yelahanka",
        kormangala: "Koramangala",
        jaynagar: "Jayanagar",
        marathalli: "Marathahalli",
        btm: "BTM Layout",
        electronic: "Electronic City",
        whitfield: "Whitefield",
        indranagar: "Indiranagar",
      };

      const words = transcript.toLowerCase().split(" ");
      let fuzzyLocation = null;
      let originalTerm = null;

      for (const word of words) {
        for (const [fuzzy, correct] of Object.entries(fuzzyLocationMap)) {
          if (word.includes(fuzzy) || fuzzy.includes(word)) {
            fuzzyLocation = correct;
            originalTerm = word;
            break;
          }
        }
        if (fuzzyLocation) break;
      }

      // Expand job keywords
      const jobExpansions: { [key: string]: string[] } = {
        construction: [
          "construction",
          "building",
          "civil work",
          "mason",
          "concrete",
        ],
        painting: ["painting", "wall painting", "interior", "exterior"],
        plumbing: ["plumbing", "pipe work", "water work", "sanitary"],
        electrical: ["electrical", "wiring", "power work", "installation"],
        cleaning: ["cleaning", "housekeeping", "maintenance"],
      };

      let expandedKeywords = words;
      for (const [base, expansions] of Object.entries(jobExpansions)) {
        if (
          words.some(
            (word: string) => word.includes(base) || base.includes(word)
          )
        ) {
          expandedKeywords = [...expandedKeywords, ...expansions];
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          searchKeywords: [...new Set(expandedKeywords)],
          location: fuzzyLocation,
          originalLocation: originalTerm,
          locationSuggestions: fuzzyLocation ? [fuzzyLocation] : [],
          expandedTerms: {},
          intent: `Extended search with fuzzy matching`,
          responseText: fuzzyLocation
            ? `I think you meant ${fuzzyLocation}. Let me search for jobs there.`
            : `Let me search more broadly for your request.`,
          fuzzyMatches: fuzzyLocation
            ? [`${originalTerm} → ${fuzzyLocation}`]
            : [],
          nearbyAreas: [],
        },
        extended: true,
      });
    }
  } catch (error) {
    console.error("Extended search API Error:", error);

    return NextResponse.json(
      {
        error: "Failed to process extended voice search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
