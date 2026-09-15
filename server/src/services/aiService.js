const { GoogleGenAI } = require("@google/genai");

console.log(
  "Gemini API key loaded:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const createFallbackAnalysis = (reason = "AI analysis could not be completed") => {
  return {
    classification: "UNKNOWN",
    confidence: 0,
    severity: "MEDIUM",
    severityReason: reason,
    summary: "AI analysis unavailable",
    keyInformation: [],
    keywords: [],
    entities: {
      persons: [],
      locations: [],
      dates: [],
      organizations: [],
      vehicles: [],
      other: [],
    },
    timeline: [],
    evidenceMentioned: [],
    missingInformation: [],
    investigationLeads: [],
    riskIndicators: [],
    aiAvailable: false,
  };
};

const analyzeFIR = async (fir) => {
  const prompt = `
IMPORTANT RULES:
1. Use ONLY information explicitly present in the provided case data.
2. Never invent names, dates, locations, evidence, suspects, motives, or events.
3. If information is unavailable, return an empty array or "Not available".
4. Do not declare anyone guilty or make final legal judgments.
5. Clearly distinguish extracted facts from AI-generated suggestions.
6. Keep the summary concise but informative.
7. Return ONLY valid JSON. Do not include markdown, explanations, or code fences.
8. Confidence must reflect confidence in classification, not proof of guilt.
9. Severity should reflect apparent urgency/seriousness based on the available facts.
10. Suggested investigation leads must be reasonable follow-up actions, not assumptions.

ANALYZE THE CASE FOR:
1. classification: Categorize the case into the most appropriate category.
2. confidence: A number between 0 and 1 representing confidence in the classification.
3. severity: Choose one: LOW, MEDIUM, HIGH, CRITICAL.
4. severityReason: Explain the basis for severity briefly.
5. summary: Provide a concise 2-4 sentence factual summary of the case.
6. keyInformation: Extract the most important facts explicitly mentioned in the case.
7. keywords: Extract relevant searchable keywords, entities, crime terms, locations, objects, and evidence references.
8. entities: Extract explicitly mentioned: persons, locations, dates, organizations, vehicles, other.
9. timeline: Create a chronological list of events based only on available dates or relative time references.
10. evidenceMentioned: List evidence or evidence references explicitly mentioned in the case.
11. missingInformation: Identify important information that appears necessary but is absent from the provided case.
12. investigationLeads: Suggest reasonable next investigative steps based only on the available facts.
13. riskIndicators: Identify explicitly mentioned indicators of urgency, danger, repeated offenses, threats, vulnerable persons, or escalation.

OUTPUT FORMAT:
{
  "classification": "THEFT",
  "confidence": 0,
  "severity": "MEDIUM",
  "severityReason": "Why this severity was selected",
  "summary": "Short summary of the incident",
  "keyInformation": [],
  "keywords": ["keyword1", "keyword2"],
  "entities": {
    "persons": [],
    "locations": [],
    "dates": [],
    "organizations": [],
    "vehicles": [],
    "other": []
  },
  "timeline": [],
  "evidenceMentioned": [],
  "missingInformation": [],
  "investigationLeads": [],
  "riskIndicators": []
}

FIR:
- Description: ${fir.incidentDescription || "Not provided"}
- Category: ${fir.category || "Not provided"}
- Location: ${fir.incidentLocation || "Not provided"}
- Incident Date: ${fir.incidentDate || "Not provided"}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const text = response.text.trim();

    const cleanedText = text
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsedAnalysis = JSON.parse(cleanedText);

    return {
      classification: parsedAnalysis.classification || "UNKNOWN",
      confidence:
        typeof parsedAnalysis.confidence === "number"
          ? parsedAnalysis.confidence
          : 0,
      severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(parsedAnalysis.severity)
        ? parsedAnalysis.severity
        : "MEDIUM",
      severityReason: parsedAnalysis.severityReason || "No reasoning available",
      summary: parsedAnalysis.summary || "No summary available",
      keyInformation: Array.isArray(parsedAnalysis.keyInformation)
        ? parsedAnalysis.keyInformation
        : [],
      keywords: Array.isArray(parsedAnalysis.keywords)
        ? parsedAnalysis.keywords
        : [],
      entities: parsedAnalysis.entities || {
        persons: [],
        locations: [],
        dates: [],
        organizations: [],
        vehicles: [],
        other: [],
      },
      timeline: Array.isArray(parsedAnalysis.timeline)
        ? parsedAnalysis.timeline
        : [],
      evidenceMentioned: Array.isArray(parsedAnalysis.evidenceMentioned)
        ? parsedAnalysis.evidenceMentioned
        : [],
      missingInformation: Array.isArray(parsedAnalysis.missingInformation)
        ? parsedAnalysis.missingInformation
        : [],
      investigationLeads: Array.isArray(parsedAnalysis.investigationLeads)
        ? parsedAnalysis.investigationLeads
        : [],
      riskIndicators: Array.isArray(parsedAnalysis.riskIndicators)
        ? parsedAnalysis.riskIndicators
        : [],
      aiAvailable: true,
    };
  } catch (error) {
    const errorMessage = error?.message || "";

    console.error("AI FIR analysis failed:", errorMessage);

    if (
      errorMessage.includes("429") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("resource_exhausted")
    ) {
      return createFallbackAnalysis(
        "Gemini API quota has been exhausted. Analysis will be retried after quota becomes available."
      );
    }

    if (
      errorMessage.includes("503") ||
      errorMessage.toLowerCase().includes("unavailable")
    ) {
      return createFallbackAnalysis(
        "Gemini service is temporarily unavailable."
      );
    }

    return createFallbackAnalysis(
      "AI analysis could not be completed due to a temporary error."
    );
  }
};

module.exports = {
  analyzeFIR,
};