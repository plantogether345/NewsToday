import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const RAG_INDEX = "rag-knowledge-base";
const SOLAR_NAMESPACE = "solar-agent-docs";

function getPinecone() {
  return new Pinecone({ apiKey: PINECONE_API_KEY });
}

function parseCSV(text: string): { headers: string[]; rows: string[][]; data: Record<string, string>[] } {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [], data: [] };

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const rows: string[][] = [];
  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    rows.push(cells);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || "";
    });
    data.push(row);
  }

  return { headers, rows, data };
}

function generateCSVSummary(headers: string[], rows: string[][], data: Record<string, string>[]): string {
  const numericColumns: Record<string, number[]> = {};

  headers.forEach((h) => {
    const values = data
      .map((row) => parseFloat(row[h]?.replace(",", ".")))
      .filter((v) => !isNaN(v));
    if (values.length > data.length * 0.5) {
      numericColumns[h] = values;
    }
  });

  let summary = `CSV Data Summary:\n`;
  summary += `- Rows: ${rows.length}\n`;
  summary += `- Columns: ${headers.join(", ")}\n\n`;

  summary += `Numeric Column Statistics:\n`;
  Object.entries(numericColumns).forEach(([col, values]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
    summary += `- ${col}: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}, std=${std.toFixed(2)}\n`;
  });

  // Detect time series columns
  const timeColumns = headers.filter((h) => {
    const lower = h.toLowerCase();
    return lower.includes("date") || lower.includes("time") || lower.includes("ds") || lower.includes("timestamp") || lower.includes("jour") || lower.includes("mois");
  });
  if (timeColumns.length > 0) {
    summary += `\nDetected time columns: ${timeColumns.join(", ")}\n`;
  }

  // Detect solar-related columns
  const solarColumns = headers.filter((h) => {
    const lower = h.toLowerCase();
    return lower.includes("irrad") || lower.includes("prod") || lower.includes("power") || lower.includes("puiss")
      || lower.includes("temp") || lower.includes("pm10") || lower.includes("dust") || lower.includes("humid")
      || lower.includes("soiling") || lower.includes("encras") || lower.includes("y1") || lower.includes("y2")
      || lower.includes("kwh") || lower.includes("kw") || lower.includes("uv") || lower.includes("wind")
      || lower.includes("rain") || lower.includes("pluie") || lower.includes("vent");
  });
  if (solarColumns.length > 0) {
    summary += `Detected solar-related columns: ${solarColumns.join(", ")}\n`;
  }

  // First 5 rows preview
  summary += `\nFirst 5 rows:\n`;
  const previewRows = rows.slice(0, 5);
  summary += headers.join(" | ") + "\n";
  previewRows.forEach((row) => {
    summary += row.join(" | ") + "\n";
  });

  return summary;
}

function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

function extractTimeSeriesData(headers: string[], data: Record<string, string>[]): { ds: string; y: number }[] | null {
  // Try to find timestamp and value columns
  const timeCol = headers.find((h) => {
    const l = h.toLowerCase();
    return l.includes("date") || l.includes("ds") || l.includes("timestamp") || l.includes("time") || l === "jour" || l === "mois";
  });

  const valueCol = headers.find((h) => {
    const l = h.toLowerCase();
    return l.includes("production") || l.includes("y1") || l.includes("power") || l.includes("kwh")
      || l.includes("puissance") || l.includes("energy") || l === "y" || l.includes("output");
  });

  if (!timeCol || !valueCol) return null;

  const timeSeries = data
    .map((row) => ({
      ds: row[timeCol],
      y: parseFloat(row[valueCol]?.replace(",", ".")),
    }))
    .filter((d) => d.ds && !isNaN(d.y));

  return timeSeries.length > 10 ? timeSeries : null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string || "default";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { headers, rows, data } = parseCSV(text);

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json({ error: "Invalid CSV file" }, { status: 400 });
    }

    const summary = generateCSVSummary(headers, rows, data);
    const timeSeriesData = extractTimeSeriesData(headers, data);

    // Store CSV chunks in Pinecone for memory
    try {
      const pc = getPinecone();
      const index = pc.index(RAG_INDEX);
      const chunks = chunkText(summary + "\n\n" + text.substring(0, 5000), 500, 100);

      const vectors = await Promise.all(
        chunks.map(async (chunk, i) => {
          const embedding = await generateEmbedding(chunk);
          return {
            id: `csv_${sessionId}_${Date.now()}_${i}`,
            values: embedding,
            metadata: {
              content: chunk,
              type: "csv_data",
              sessionId,
              fileName: file.name,
              timestamp: new Date().toISOString(),
            },
          };
        })
      );

      // Upsert in batches
      for (let i = 0; i < vectors.length; i += 10) {
        const batch = vectors.slice(i, i + 10);
        await index.namespace(SOLAR_NAMESPACE).upsert(batch);
      }
    } catch (pineconeError) {
      console.error("Pinecone storage error:", pineconeError);
    }

    return NextResponse.json({
      success: true,
      summary,
      headers,
      rowCount: rows.length,
      timeSeriesData,
      firstRows: data.slice(0, 10),
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "File processing failed" },
      { status: 500 }
    );
  }
}
