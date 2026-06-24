# AI Investment Research Agent

An advanced, multi-agent AI Investment Research Agent built as a project for **InsideIIM / Altuni AI Labs**. 

This agent uses a state-of-the-art multi-agent pipeline orchestrated with **LangGraph.js** and powered by **Google Gemini** and **Tavily Web Search**. It allows users to type in any company name, research it across multiple categories (news, financials, competitors, risks) in real-time, and get a structured investment verdict (**INVEST** or **PASS**) with confidence scoring, bull/bear cases, and citations.

---

## 🚀 Live Demo & Deployment
- **Deployment URL**: [https://inside-iim-invest.vercel.app](https://inside-iim-invest.vercel.app) *(Update with your Vercel deployment link)*

---

## 🛠️ Tech Stack
*   **Frontend**: Next.js 14 (App Router, JavaScript/JSX)
*   **Styling**: Tailwind CSS (Premium glassmorphic dark theme)
*   **Agentic Orchestration**: LangGraph.js (`StateGraph` & `Annotation` API)
*   **LLM Model**: Google Gemini 2.5 Flash (`ChatGoogleGenerativeAI` via `@langchain/google-genai`)
*   **Web Search Engine**: Tavily Search API (`TavilySearchResults` via `@langchain/community`)
*   **Data Validation**: Zod (Ensures structured JSON output from the LLM)

---

## 📋 Agent Architecture
The agent uses a linear multi-agent pipeline where each agent acts as a specialized worker, reading from and writing to a shared **State Notebook**.

```mermaid
graph TD
    Start([User Input: Company Name]) --> NewsAgent[1. News Agent: Search Latest News]
    NewsAgent --> FinAgent[2. Financials Agent: Analyze Profit/Growth]
    FinAgent --> CompAgent[3. Competitors Agent: Evaluate Market Share]
    CompAgent --> RiskAgent[4. Risk Agent: Scan Scandals/Controversies]
    RiskAgent --> DecisionAgent[5. Decision Agent: Synthesize Verdict]
    DecisionAgent --> Output([Final Verdict Card: INVEST / PASS])

    subgraph State Notebook (Shared Memory)
        company[Company Name]
        news[News Content]
        financials[Financial Content]
        competitors[Competitor Content]
        risks[Risk Content]
        verdict[Structured Verdict JSON]
    end

    NewsAgent -. Writes .-> news
    FinAgent -. Writes .-> financials
    CompAgent -. Writes .-> competitors
    RiskAgent -. Writes .-> risks
    DecisionAgent -. Reads All & Writes .-> verdict
```

### 1. Shared State Schema:
```json
{
  "company": "string",
  "news": "string",
  "financials": "string",
  "competitors": "string",
  "risks": "string",
  "verdict": {
    "decision": "INVEST" | "PASS",
    "confidence": 0-100,
    "bullPoints": ["string"],
    "bearPoints": ["string"],
    "riskFactors": ["string"],
    "sources": ["string"]
  }
}
```

---

## ⚙️ Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Ayush00029/INSIDE-IIM.git
cd INSIDE-IIM
```

### 2. Install Dependencies
Make sure you use the `--legacy-peer-deps` flag to bypass LangChain version resolution conflicts:
```bash
npm install --legacy-peer-deps
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
# Google AI Studio Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Tavily Search API Key
TAVILY_API_KEY=your_tavily_api_key_here
```
> [!WARNING]
> **CRITICAL**: Never commit `.env.local` to GitHub. The project's `.gitignore` is already pre-configured to protect it.

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 📊 Example Investment Verdicts

Example runs conducted by the agents have been saved in the `/examples` folder:

### 1. Zomato (Verdict: INVEST, Confidence: 80%)
- **Bull Points**:
  - Achieved its first full-year profit in FY24.
  - Substantial 64% YoY revenue growth in Q3 FY25.
  - Market leader in food delivery and expanding fast in Quick Commerce via Blinkit.
- **Bear Points**:
  - Net profit in Q4 FY25 fell 78% YoY due to expansion and marketing costs.
  - High customer switching costs and peak-hour delivery wait complaints.
- **Verdict Details**: See full analysis in [zomato.json](file:///examples/zomato.json)

### 2. Infosys (Verdict: INVEST, Confidence: 75%)
- **Bull Points**:
  - Strong global brand in digital transformation.
  - Expanding Cloud (Cobalt) and Generative AI (Topaz) order pipeline.
- **Bear Points**:
  - High IT sector talent attrition and client budget cuts due to macroeconomic uncertainty.
- **Verdict Details**: See full analysis in [infosys.json](file:///examples/infosys.json)

### 3. Reliance Industries (Verdict: INVEST, Confidence: 85%)
- **Bull Points**:
  - Dominant market position in Telecom (Jio) and Retail (Reliance Retail).
  - Heavy investment in green energy (solar and hydrogen).
- **Bear Points**:
  - Cyclical refinery margin pressure in Oil-to-Chemicals (O2C).
- **Verdict Details**: See full analysis in [reliance.json](file:///examples/reliance.json)

---

## 📂 Project Structure
```
inside-iim/
├── app/
│   ├── layout.js        # Global layout & SEO Metadata
│   ├── page.jsx         # Premium React Frontend UI (streaming receiver)
│   └── api/
│       └── research/
│           └── route.js # Next.js SSE Streaming API Route
├── lib/
│   └── agent.js         # LangGraph.js Agent Pipeline
├── examples/            # Example runs for Zomato, Infosys, Reliance
│   ├── zomato.json
│   ├── infosys.json
│   └── reliance.json
├── .gitignore           # Ignores local keys, build artifacts, etc.
├── .env.local           # Local API keys (excluded from commits)
└── README.md            # Project documentation (this file)
```

---

## 📜 Development Highlights
1. **Streaming API**: We use Server-Sent Events (SSE) to send real-time node completion states to the UI, ensuring the user gets instant visual progress.
2. **Lazy Initialization**: Tavily Search is initialized dynamically inside graph nodes, preventing compilation crashes during startup when environment variables are being resolved.
3. **Structured Outputs**: Leveraging Zod schema definitions allows Gemini to return strictly shaped responses, eliminating raw text parsers.
