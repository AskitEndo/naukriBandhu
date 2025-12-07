// components/VoiceSearch.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceSearchProps {
  onSearch: (keywords: string[], location: string | null) => void;
  onTranscriptChange?: (transcript: string) => void;
  availableJobs?: any[]; // Available jobs for context
  lastSearchResultCount?: number; // Number of results from last search
}

interface VoiceSearchResult {
  searchKeywords: string[];
  location: string | null;
  intent: string;
  responseText: string;
  // Extended search properties
  originalLocation?: string;
  locationSuggestions?: string[];
  expandedTerms?: { [key: string]: string[] };
  fuzzyMatches?: string[];
  nearbyAreas?: string[];
}

interface ExtendedSearchResult extends VoiceSearchResult {
  extended: boolean;
}

export default function VoiceSearch({
  onSearch,
  onTranscriptChange,
  availableJobs = [],
  lastSearchResultCount = 0,
}: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtendedProcessing, setIsExtendedProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceSearchResult | null>(null);
  const [extendedResult, setExtendedResult] =
    useState<ExtendedSearchResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showProcessMore, setShowProcessMore] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      synthesisRef.current = speechSynthesis;

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        console.log("🎤 Voice recognition started");
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        onTranscriptChange?.(fullTranscript);

        // If we have a final result, process it
        if (finalTranscript) {
          console.log("🎯 Final transcript:", finalTranscript);
          processVoiceQuery(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("🚫 Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          alert(
            "🎤 Microphone access denied. Please enable microphone permissions to use voice search."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("🎤 Voice recognition ended");
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("🚫 Speech recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [onTranscriptChange]);

  const startListening = () => {
    if (!recognitionRef.current || !isSupported) {
      alert(
        "🚫 Voice search is not supported in your browser. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      setTranscript("");
      setResult(null);
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceQuery = async (voiceTranscript: string) => {
    setIsProcessing(true);
    setShowProcessMore(false);
    setExtendedResult(null);

    try {
      console.log("🧠 Processing with Gemini:", voiceTranscript);

      const response = await fetch("/api/voice-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: voiceTranscript }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const searchResult = data.data as VoiceSearchResult;
        setResult(searchResult);

        console.log("✅ Search processed:", searchResult);

        // Trigger search with extracted keywords and location
        onSearch(searchResult.searchKeywords, searchResult.location);

        // Show "Process More" button after a delay to check results
        setTimeout(() => {
          setShowProcessMore(true);
          console.log(
            "🔍 Process More button shown, lastSearchResultCount:",
            lastSearchResultCount
          );
        }, 3000);

        // Speak the response
        speakResponse(searchResult.responseText);
      } else {
        throw new Error("Failed to process voice query");
      }
    } catch (error) {
      console.error("❌ Voice processing error:", error);

      // Fallback: use raw transcript as search term
      const words = voiceTranscript.toLowerCase().split(" ");
      onSearch(words, null);

      // Always show Process More on error for better fallback
      setTimeout(() => {
        setShowProcessMore(true);
      }, 2000);

      speakResponse(`I'll search for jobs related to: ${voiceTranscript}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processExtendedSearch = async () => {
    if (!transcript) return;

    setIsExtendedProcessing(true);
    setShowProcessMore(false);

    try {
      console.log("🔍 Extended processing:", transcript);

      const response = await fetch("/api/voice-search-extended", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          availableJobs,
          noResultsFound: lastSearchResultCount === 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Extended API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const extendedSearchResult = data.data as ExtendedSearchResult;
        setExtendedResult({ ...extendedSearchResult, extended: true });

        console.log("✅ Extended search processed:", extendedSearchResult);

        // Trigger search with expanded keywords and fuzzy location
        onSearch(
          extendedSearchResult.searchKeywords,
          extendedSearchResult.location
        );

        // Speak the extended response
        speakResponse(extendedSearchResult.responseText);
      } else {
        throw new Error("Failed to process extended search");
      }
    } catch (error) {
      console.error("❌ Extended search error:", error);
      speakResponse(
        "I'm having trouble with the extended search. Let me try a broader search."
      );

      // Fallback extended search with manual logic
      const fuzzyLocationMap: { [key: string]: string } = {
        ilanka: "Yelahanka",
        yelankha: "Yelahanka",
        yellanka: "Yelahanka",
        nagasaki: "Nagasandra",
        kormangala: "Koramangala",
        jaynagar: "Jayanagar",
        electronic: "Electronic City",
        whitfield: "Whitefield",
        btm: "BTM Layout",
      };

      const words = transcript.toLowerCase().split(" ");
      let fuzzyLocation = null;
      let expandedKeywords = [...words];

      // Find fuzzy location match
      for (const word of words) {
        for (const [fuzzy, correct] of Object.entries(fuzzyLocationMap)) {
          if (word.includes(fuzzy) || fuzzy.includes(word)) {
            fuzzyLocation = correct;
            break;
          }
        }
        if (fuzzyLocation) break;
      }

      // Expand job keywords
      if (words.some((w) => w.includes("hospital"))) {
        expandedKeywords.push(
          "medical",
          "healthcare",
          "plumbing",
          "maintenance"
        );
      }
      if (
        words.some((w) => w.includes("construction") || w.includes("building"))
      ) {
        expandedKeywords.push("construction", "building", "civil", "mason");
      }
      if (words.some((w) => w.includes("job") || w.includes("work"))) {
        expandedKeywords.push("job", "work", "employment");
      }

      const fallbackResult = {
        searchKeywords: [...new Set(expandedKeywords)],
        location: fuzzyLocation,
        originalLocation: words.find(
          (w) =>
            fuzzyLocation &&
            w.includes(fuzzyLocation.toLowerCase().substring(0, 3))
        ),
        intent: `Extended search with manual fallback`,
        responseText: fuzzyLocation
          ? `I think you meant ${fuzzyLocation}. Let me search for jobs there.`
          : `Let me search more broadly for your request.`,
        fuzzyMatches: fuzzyLocation
          ? [`${words.join(" ")} → ${fuzzyLocation}`]
          : [],
        extended: true,
      };

      setExtendedResult(fallbackResult as ExtendedSearchResult);
      onSearch(fallbackResult.searchKeywords, fallbackResult.location);
      speakResponse(fallbackResult.responseText);
    } finally {
      setIsExtendedProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthesisRef.current) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log("🔊 Started speaking:", text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("🔊 Finished speaking");
    };

    utterance.onerror = (event) => {
      console.error("🚫 Speech synthesis error:", event.error);
      setIsSpeaking(false);
    };

    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-center">
        <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          Voice search not supported in this browser.
          <br />
          Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Mic className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Voice Job Search</h3>
            <p className="text-sm text-blue-600">Ask about jobs in your area</p>
          </div>
        </div>

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">Stop</span>
          </button>
        )}
      </div>

      {/* Voice Control Buttons */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <AnimatePresence mode="wait">
          {!isListening ? (
            <motion.button
              key="start"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={startListening}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Mic className="w-5 h-5" />
              <span>Start Voice Search</span>
            </motion.button>
          ) : (
            <motion.button
              key="stop"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={stopListening}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <MicOff className="w-5 h-5" />
              <span>Stop Listening</span>
            </motion.button>
          )}
        </AnimatePresence>

        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-center space-x-6 mb-4 text-sm">
        <div
          className={`flex items-center space-x-1 ${
            isListening ? "text-green-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isListening ? "bg-green-500 animate-pulse" : "bg-gray-300"
            }`}
          ></div>
          <span>Listening</span>
        </div>
        <div
          className={`flex items-center space-x-1 ${
            isProcessing ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isProcessing ? "bg-blue-500 animate-pulse" : "bg-gray-300"
            }`}
          ></div>
          <span>Processing</span>
        </div>
        <div
          className={`flex items-center space-x-1 ${
            isSpeaking ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isSpeaking ? "bg-purple-500 animate-pulse" : "bg-gray-300"
            }`}
          ></div>
          <span>Speaking</span>
        </div>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start space-x-2">
            <Search className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-gray-600 mb-1">You said:</p>
              <p className="text-gray-900 font-medium">"{transcript}"</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-2">
            <div className="p-1 bg-green-100 rounded-full">
              <Search className="w-3 h-3 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-600 font-medium mb-2">
                Search Results:
              </p>

              {result.searchKeywords.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-green-600 mb-1">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.searchKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.location && (
                <div className="mb-2">
                  <p className="text-xs text-green-600 mb-1">Location:</p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                    📍 {result.location}
                  </span>
                </div>
              )}

              <p className="text-sm text-green-700 italic">
                "{result.responseText}"
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Extended Search Result Display */}
      {extendedResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-xl p-4"
        >
          <div className="flex items-start space-x-2">
            <div className="p-1 bg-purple-100 rounded-full">
              <Search className="w-3 h-3 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-purple-600 font-medium mb-2">
                🔍 Extended Search Results:
              </p>

              {extendedResult.fuzzyMatches &&
                extendedResult.fuzzyMatches.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-purple-600 mb-1">
                      Location Corrections:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {extendedResult.fuzzyMatches.map((match, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium"
                        >
                          {match}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {extendedResult.searchKeywords.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-purple-600 mb-1">
                    Expanded Keywords:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {extendedResult.searchKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extendedResult.location && (
                <div className="mb-2">
                  <p className="text-xs text-purple-600 mb-1">
                    Matched Location:
                  </p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                    📍 {extendedResult.location}
                    {extendedResult.originalLocation &&
                      extendedResult.originalLocation !==
                        extendedResult.location && (
                        <span className="text-xs text-gray-500 ml-1">
                          (from "{extendedResult.originalLocation}")
                        </span>
                      )}
                  </span>
                </div>
              )}

              <p className="text-sm text-purple-700 italic">
                "{extendedResult.responseText}"
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Process More Button */}
      {showProcessMore && !isExtendedProcessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 text-center"
        >
          <button
            onClick={processExtendedSearch}
            className="flex items-center space-x-2 px-6 py-3 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mx-auto"
          >
            <Search className="w-4 h-4" />
            <span>🔍 Process More (Fuzzy Search)</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Click for smarter search with location corrections & expanded
            keywords
          </p>
        </motion.div>
      )}

      {isExtendedProcessing && (
        <div className="flex items-center justify-center space-x-2 text-orange-600 mt-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            Processing extended search...
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 mb-1">
          💡 Try natural queries: "Can I get a job in Ilanka?" or "Any hospital
          work available?"
        </p>
        <p className="text-xs text-gray-400">
          🔍 Use "Process More" for fuzzy location matching (Ilanka → Yelahanka,
          Nagasaki → Nagasandra)
        </p>
      </div>
    </div>
  );
}
