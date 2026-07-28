export type ParkingResearchInput = {
  adventureTitle: string;
  startAddress: string;
  startLat: number;
  startLng: number;
  campusName?: string;
  city?: string;
  state?: string;
};

export type GeminiInteraction = {
  id: string;
  status?: "pending" | "running" | "completed" | "failed" | string;
  error?: unknown;
  steps?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

// This is the Deep Research agent name from Google's current docs.
// Because it is a preview agent, this name may change over time.
const DEEP_RESEARCH_AGENT = "deep-research-preview-04-2026";

// This is the Gemini Interactions API endpoint used to start background research jobs.
const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  return apiKey;
}

// This builds the actual prompt we send to Gemini Deep Research.
// Keep it strict so Deep Research returns a short parking brief instead of a full report.
export function buildParkingResearchPrompt(input: ParkingResearchInput) {
  return `
Find visitor parking for this walking tour / puzzle adventure.

Location:
- Name: ${input.adventureTitle}
- Campus/location: ${input.campusName || "Unknown"}
- Start address: ${input.startAddress}
- Start coordinates: ${input.startLat}, ${input.startLng}
- City/state: ${input.city || "Unknown"}, ${input.state || "Unknown"}

Goal:
Return the best practical visitor parking recommendation for someone starting this walking tour.

Research rules:
- Prefer official campus, city, venue, or parking department sources.
- Use unofficial sources only if official sources are unavailable.
- Do not recommend permit-only, resident-only, employee-only, or private parking unless it is clearly available to visitors.
- If access, price, hours, or distance are unclear, write "unknown".
- Include at most 2 source URLs.

Output rules:
- Maximum 180 words total.
- Return only the final parking details.
- Do not include background history.
- Do not include broad policy explanations.
- Do not include markdown tables.
- Do not include more than one alternate option.
- Do not describe your research process.
- Do not add extra sections beyond the fields below.

Format exactly:
Recommended parking:
Address:
Access:
Cost:
Hours:
Distance from start:
Parking difficulty:
Notes:
Email copy:
Sources:
`;
}

// Starts a Deep Research job.
// This does not immediately return the report. It returns an interaction ID that you poll later.
export async function startParkingDeepResearch(input: ParkingResearchInput) {
  const apiKey = getGeminiApiKey();

  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      agent: DEEP_RESEARCH_AGENT,
      input: buildParkingResearchPrompt(input),

      // Deep Research can take minutes, so Google requires background execution.
      background: true,

      // This tells Gemini we are using the Deep Research agent configuration.
      agent_config: {
        type: "deep-research",

        // "auto" lets the API return useful progress summaries while researching.
        thinking_summaries: "auto",

        // We do not need charts/images for parking research.
        visualization: "off",

        // Later, you could set this to true if you want Gemini to propose a research plan first.
        collaborative_planning: false,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to start Gemini parking research: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as GeminiInteraction;
}

// Fetches the current status of a Deep Research job.
// You call this repeatedly until status is "completed" or "failed".
export async function getParkingDeepResearch(interactionId: string) {
  const apiKey = getGeminiApiKey();

  const response = await fetch(`${GEMINI_INTERACTIONS_URL}/${interactionId}`, {
    method: "GET",
    headers: {
      "x-goog-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch Gemini parking research: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as GeminiInteraction;
}

// Pulls the final report text from a completed Gemini interaction.
// The final answer is usually in the last step.
export function getFinalParkingResearchText(interaction: GeminiInteraction) {
  const lastStep = interaction.steps?.at(-1);
  const firstTextBlock = lastStep?.content?.find((part) => part.text);

  return firstTextBlock?.text || "";
}