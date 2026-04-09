import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { Pinecone } from "@pinecone-database/pinecone";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const RAG_INDEX = "rag-knowledge-base";
const SOLAR_NAMESPACE = "solar-agent-docs";

function getPinecone() {
  return new Pinecone({ apiKey: PINECONE_API_KEY });
}

async function queryPineconeMemory(embedding: number[], topK = 5) {
  try {
    const pc = getPinecone();
    const index = pc.index(RAG_INDEX);
    const results = await index.namespace(SOLAR_NAMESPACE).query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });
    return results.matches || [];
  } catch (error) {
    console.error("Pinecone query error:", error);
    return [];
  }
}

async function storeToPinecone(id: string, embedding: number[], metadata: Record<string, string>) {
  try {
    const pc = getPinecone();
    const index = pc.index(RAG_INDEX);
    await index.namespace(SOLAR_NAMESPACE).upsert([
      { id, values: embedding, metadata },
    ]);
  } catch (error) {
    console.error("Pinecone upsert error:", error);
  }
}

function detectForecastIntent(message: string): boolean {
  const forecastKeywords = [
    "forecast", "predict", "prediction", "prevision", "prévision",
    "forecasting", "time series", "timegpt", "prédire", "anticiper",
    "project", "projection", "estimate future", "what will",
    "how much energy", "production future", "expected output",
    "encrassement", "soiling", "perte production", "cleaning schedule",
    "nettoyage", "kalman", "performance loss"
  ];
  const lower = message.toLowerCase();
  return forecastKeywords.some((kw) => lower.includes(kw));
}

function detectCsvAnalysis(message: string): boolean {
  const csvKeywords = [
    "analyze", "analyse", "csv", "data", "uploaded", "file",
    "show me", "what does", "summary", "describe", "columns",
    "rows", "statistics", "mean", "average", "max", "min"
  ];
  const lower = message.toLowerCase();
  return csvKeywords.some((kw) => lower.includes(kw));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, csvData, csvSummary, sessionId } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    // Generate embedding for memory retrieval (non-blocking)
    let memoryContext = "";
    const embedding = await generateEmbedding(userMessage);

    try {
      const memoryResults = await queryPineconeMemory(embedding, 5);
      memoryContext = memoryResults
        .filter((m: { metadata?: Record<string, unknown> }) => m.metadata)
        .map((m: { metadata?: Record<string, unknown> }) => `[Memory] ${(m.metadata?.content as string) || ""}`)
        .join("\n");
    } catch (memErr) {
      console.error("Memory retrieval failed (non-fatal):", memErr);
    }

    // Store user message in Pinecone for future memory (fire-and-forget)
    const msgId = `solar_${sessionId || "default"}_${Date.now()}`;
    storeToPinecone(msgId, embedding, {
      content: userMessage,
      role: "user",
      sessionId: sessionId || "default",
      timestamp: new Date().toISOString(),
      type: "conversation",
    }).catch((err) => console.error("Store message failed (non-fatal):", err));

    // Detect intent
    const isForecastRequest = detectForecastIntent(userMessage);
    const isCsvAnalysis = detectCsvAnalysis(userMessage);

    // Build system prompt
    const systemPrompt = `You are a professional AI specialist in solar energy photovoltaic (PV) systems. You have deep expertise in:
- Solar panel performance analysis and degradation
- Soiling/encrassement modeling (Kalman filter based)
- Production loss estimation and financial impact analysis
- Cleaning schedule optimization
- Environmental factor analysis (PM10, dust, humidity, wind, rain)
- Time series forecasting for energy production
- Tunisia's solar energy market across all regions (Sfax, Tunis, Sousse, Gabes, Tozeur, Tataouine, Bizerte, Kairouan)

You are conversational, knowledgeable, and provide actionable insights. When the user uploads CSV data, you analyze it thoroughly and provide relevant observations about their solar installation.

${csvSummary ? `\n## Current CSV Data Context:\n${csvSummary}\n` : ""}
${csvData ? `\n## CSV Data (first rows):\n${csvData}\n` : ""}
${memoryContext ? `\n## Relevant Memory from Past Conversations:\n${memoryContext}\n` : ""}

IMPORTANT RULES:
- Never mention any internal tools, APIs, or SDKs you use
- Always respond in the context of solar energy PV systems
- When the user asks for forecasting, respond with a JSON block that signals the frontend to show the forecast form
- When analyzing CSV data, provide detailed observations about the solar installation data
- Use both French and English terms naturally as the domain uses both

${isForecastRequest ? `\nThe user is requesting a forecast. You MUST include in your response a JSON block wrapped in \`\`\`forecast-trigger\n{"showForm": true, "reason": "brief explanation of what will be forecasted"}\n\`\`\` to trigger the forecast form in the UI. Also provide a brief explanation of what the forecast will analyze.\n` : ""}

${isCsvAnalysis && csvSummary ? `\nThe user wants to analyze their uploaded CSV data. Provide detailed insights based on the data context provided above.\n` : ""}`;

    // Call Cerebras LLM
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cerebras API error:", response.status, errorText);
      // Fallback response if Cerebras fails
      return NextResponse.json({
        message: "I'm currently experiencing connectivity issues with my AI backend. Please try again in a moment. If the issue persists, it may be a temporary API limitation.",
        isForecastRequest: false,
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I apologize, I could not generate a response.";

    // Store assistant response in Pinecone memory (fire-and-forget)
    generateEmbedding(assistantMessage).then((assistantEmbedding) =>
      storeToPinecone(`solar_${sessionId || "default"}_resp_${Date.now()}`, assistantEmbedding, {
        content: assistantMessage.substring(0, 1000),
        role: "assistant",
        sessionId: sessionId || "default",
        timestamp: new Date().toISOString(),
        type: "conversation",
      })
    ).catch((err) => console.error("Store response failed (non-fatal):", err));

    return NextResponse.json({
      message: assistantMessage,
      isForecastRequest,
    });
  } catch (error) {
    console.error("Solar agent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
