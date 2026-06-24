import { NextResponse } from "next/server";
import { researchAgent } from "@/lib/agent";

// Next.js App Router POST handler
export async function POST(req) {
  try {
    const { company } = await req.json();

    if (!company || typeof company !== "string") {
      return NextResponse.json(
        { error: "Company name must be a valid string." },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    // Create a ReadableStream using Web Streams API
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`Starting investment research for: ${company}`);
          
          // Stream LangGraph nodes as they run
          const agentStream = await researchAgent.stream({ company });

          for await (const chunk of agentStream) {
            // A chunk contains the node output, e.g. { newsAgent: { news: "..." } }
            const nodeName = Object.keys(chunk)[0];
            const nodeData = chunk[nodeName];

            // Formulate step updates for the frontend
            const payload = {
              node: nodeName,
              status: "completed",
              // Send the full structured verdict only when the Decision Agent finishes
              verdict: nodeName === "decisionAgent" ? nodeData.verdict : null
            };

            // Stream the JSON payload formatted as a Server-Sent Event (SSE)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }
        } catch (error) {
          console.error("Streaming execution error:", error);
          const errorPayload = { error: error.message || "An error occurred during agent execution." };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorPayload)}\n\n`));
        } finally {
          console.log(`Finished investment research stream for: ${company}`);
          controller.close();
        }
      }
    });

    // Return the response as a text/event-stream for real-time progress in the browser
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    console.error("API Route top-level error:", err);
    return NextResponse.json(
      { error: "Failed to parse request or process research." },
      { status: 500 }
    );
  }
}
