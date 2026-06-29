import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { z } from "zod";

// 1. Define the Shared State (Notebook)
export const StateAnnotation = Annotation.Root({
  company: Annotation(),      // The name of the company to research (e.g. "Zomato")
  news: Annotation(),         // Search results of recent news and sentiment
  financials: Annotation(),   // Search results of revenue, profit, margins, and growth
  competitors: Annotation(),  // Search results of competitor analysis and market share
  risks: Annotation(),        // Search results of scandals, controversies, and risks
  verdict: Annotation()       // The final investment decision structure from Gemini
});

// Helper to lazily initialize the Tavily Search tool inside the nodes.
// This prevents initialization errors if the module is imported before env variables are loaded.
function getSearchTool() {
  return new TavilySearchResults({ maxResults: 3 });
}

// 2. Define Agent Nodes using a clean Factory Function
function createResearchNode(field, querySuffix) {
  return async function (state) {
    const { company } = state;
    if (!company) throw new Error("Company name is missing from the state!");
    
    const searchTool = getSearchTool();
    const query = `${company} ${querySuffix}`;
    const result = await searchTool.invoke(query);
    
    return { [field]: result };
  };
}

const newsAgent = createResearchNode("news", "latest news developments sentiment analysis");
const financialsAgent = createResearchNode("financials", "financial performance revenue profit growth margins");
const competitorsAgent = createResearchNode("competitors", "competitors market share industry position analysis");
const risksAgent = createResearchNode("risks", "risks drawbacks controversies scandals problems");

// Define Decision Agent Node
async function decisionAgent(state) {
  const { company, news, financials, competitors, risks } = state;
  
  // Setup Gemini 2.5 Flash model with built-in maxRetries configuration
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2, // Low temperature for factual decision making
    maxRetries: 3, // Built-in LangChain retry mechanism
  });

  // Define structured JSON schema for the verdict
  const schema = z.object({
    decision: z.enum(["INVEST", "PASS"]).describe("The investment recommendation. Must be either 'INVEST' or 'PASS'"),
    confidence: z.number().min(0).max(100).describe("Confidence rating of this decision in percentage (0 to 100)"),
    bullPoints: z.array(z.string()).describe("Key positive reasons, opportunities, or strengths of the company"),
    bearPoints: z.array(z.string()).describe("Concerns, weaknesses, or negative factors for the company"),
    riskFactors: z.array(z.string()).describe("Macro or company-specific risks to keep in mind"),
    sources: z.array(z.string()).describe("Array of specific source URLs gathered from Tavily search content")
  });

  // Attach structured output generator to Gemini
  const structuredModel = model.withStructuredOutput(schema);

  const prompt = `You are a Senior Investment Analyst at Altuni AI Labs.
Your task is to analyze the company "${company}" based on the raw research data provided by our research agents and output a final decision: either INVEST or PASS.

---
RAW RESEARCH DATA FOR ${company.toUpperCase()}:

1. NEWS & SENTIMENT:
${news}

2. FINANCIALS:
${financials}

3. COMPETITIVE ADVANTAGE & INDUSTRY POSITION:
${competitors}

4. RISKS & CHALLENGES:
${risks}
---

INSTRUCTIONS:
- Review the financial stability, market growth potential, news sentiment, and risk profile.
- Provide a clear verdict: "INVEST" if the company shows positive prospects, solid financials, and manageable risks. Provide "PASS" if there are deep concerns, poor financials, or high risks.
- Extract any real website URLs found in the research and include them in the "sources" array.
- Return the output strictly in the requested JSON structure.`;

  const verdict = await structuredModel.invoke([
    { role: "system", content: "You are a professional investment analyst who provides structured, data-driven decisions." },
    { role: "user", content: prompt }
  ]);

  return { verdict };
}

// 3. Orchestrate the State Graph
// All research agent nodes run in parallel (fan-out from __start__, fan-in to decisionAgent)
const workflow = new StateGraph(StateAnnotation)
  .addNode("newsAgent", newsAgent)
  .addNode("financialsAgent", financialsAgent)
  .addNode("competitorsAgent", competitorsAgent)
  .addNode("risksAgent", risksAgent)
  .addNode("decisionAgent", decisionAgent)
  
  .addEdge("__start__", "newsAgent")
  .addEdge("__start__", "financialsAgent")
  .addEdge("__start__", "competitorsAgent")
  .addEdge("__start__", "risksAgent")
  
  .addEdge("newsAgent", "decisionAgent")
  .addEdge("financialsAgent", "decisionAgent")
  .addEdge("competitorsAgent", "decisionAgent")
  .addEdge("risksAgent", "decisionAgent")
  
  .addEdge("decisionAgent", "__end__");

// Compile the graph so it can be executed
export const researchAgent = workflow.compile();
