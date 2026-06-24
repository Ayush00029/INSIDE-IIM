"use client";

import React, { useState, useRef } from "react";
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  Info,
  ChevronRight,
  RefreshCw,
  Newspaper,
  DollarSign,
  Users,
  AlertOctagon,
  FileText,
  Globe
} from "lucide-react";

export default function Home() {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState(null);
  
  // Steps configuration for our multi-agent pipeline
  const [steps, setSteps] = useState([
    { id: "newsAgent", label: "News Agent", desc: "Searching latest company news & sentiment...", status: "idle", icon: Newspaper },
    { id: "financialsAgent", label: "Financials Agent", desc: "Analyzing revenue, profit, margins & growth...", status: "idle", icon: DollarSign },
    { id: "competitorsAgent", label: "Competitors Agent", desc: "Evaluating industry position & market share...", status: "idle", icon: Users },
    { id: "risksAgent", label: "Risk Agent", desc: "Scanning legal risks, scandals & challenges...", status: "idle", icon: AlertOctagon },
    { id: "decisionAgent", label: "Decision Agent", desc: "Synthesizing research & generating verdict...", status: "idle", icon: Sparkles }
  ]);

  const resultsEndRef = useRef(null);

  const updateStepStatus = (nodeId, status) => {
    setSteps(prev => prev.map(step => {
      if (step.id === nodeId) {
        return { ...step, status };
      }
      return step;
    }));
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: "idle" })));
  };

  const runResearch = async (e) => {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setError("");
    setVerdict(null);
    resetSteps();

    // Start with the first step running
    updateStepStatus("newsAgent", "running");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to start research. Check if API keys are set.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // List of nodes in execution order to handle step transitions
      const nodeOrder = ["newsAgent", "financialsAgent", "competitorsAgent", "risksAgent", "decisionAgent"];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;

            const data = JSON.parse(dataStr);

            if (data.error) {
              throw new Error(data.error);
            }

            const completedNode = data.node;
            
            // Mark the completed node as completed
            updateStepStatus(completedNode, "completed");

            // Mark the next node in sequence as running
            const currentIndex = nodeOrder.indexOf(completedNode);
            if (currentIndex !== -1 && currentIndex < nodeOrder.length - 1) {
              const nextNode = nodeOrder[currentIndex + 1];
              updateStepStatus(nextNode, "running");
            }

            // Set final verdict once decision agent finishes
            if (completedNode === "decisionAgent" && data.verdict) {
              setVerdict(data.verdict);
              
              // Smooth scroll to results
              setTimeout(() => {
                resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          }
        }
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      // Set any running steps to idle/error
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "idle" } : s));
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyError = (errStr) => {
    if (!errStr) return "";
    if (errStr.includes("429") || errStr.includes("Quota exceeded") || errStr.includes("Too Many Requests")) {
      return (
        <div className="space-y-2 mt-1 text-xs">
          <p className="font-semibold text-rose-300">Gemini API Rate Limit Exceeded (429)</p>
          <p className="text-gray-400 leading-relaxed">
            The free-tier API quota for your Gemini key has been temporarily reached. 
            Google AI Studio limits requests per minute for new/free keys.
          </p>
          <p className="text-emerald-400 font-medium">
            💡 Auto-retry handlers have been added to the backend! Please wait 10-15 seconds and try clicking "Research" again.
          </p>
        </div>
      );
    }
    if (errStr.includes("API key not valid") || errStr.includes("key is invalid")) {
      return (
        <div className="space-y-1 mt-1 text-xs">
          <p className="font-semibold text-rose-300">Invalid Gemini API Key</p>
          <p className="text-gray-400">Please check your local `.env.local` file and verify your GOOGLE_API_KEY is correct.</p>
        </div>
      );
    }
    return <p className="text-xs text-rose-300 mt-1 break-words">{errStr}</p>;
  };

  const handlePredefinedClick = (compName) => {
    setCompany(compName);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-4 hover:border-emerald-500/30 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">InsideIIM / Altuni AI Labs</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
            AI Investment Research Agent
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400">
            Harness the power of multi-agent orchestration. Enter any company to trigger deep news, financial, competitor, and risk analysis for an instant buy/sell recommendation.
          </p>
        </header>

        {/* Search Panel */}
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 animate-fade-in">
          <form onSubmit={runResearch} className="space-y-4">
            <label htmlFor="companyInput" className="block text-sm font-medium text-gray-300">
              Company Name / Ticker
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  id="companyInput"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Zomato, Reliance, Infosys, Apple"
                  disabled={loading}
                  className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
              </div>
              <button
                type="submit"
                disabled={loading || !company.trim()}
                className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Research
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Examples */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Popular searches:</span>
            {["Zomato", "Infosys", "Reliance", "Apple"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handlePredefinedClick(name)}
                disabled={loading}
                className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all disabled:opacity-50"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Stepper Loader */}
        {loading && (
          <div className="bg-white/[0.01] border border-white/[0.04] backdrop-blur-md rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-emerald-400 mb-6 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              Multi-Agent Pipeline Live Progress
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isIdle = step.status === "idle";
                const isRunning = step.status === "running";
                const isCompleted = step.status === "completed";

                return (
                  <div key={step.id} className="flex md:flex-col items-start md:items-center text-left md:text-center relative">
                    
                    {/* Visual Node Circle */}
                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-all duration-500 mb-3 z-10 
                      ${isCompleted ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : ""}
                      ${isRunning ? "bg-emerald-500/5 border-emerald-400 text-emerald-400 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.05]" : ""}
                      ${isIdle ? "bg-white/[0.02] border-white/[0.08] text-gray-500" : ""}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : isRunning ? (
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="ml-4 md:ml-0">
                      <h4 className={`text-sm font-bold tracking-tight ${isRunning ? "text-emerald-400" : isCompleted ? "text-gray-200" : "text-gray-500"}`}>
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 md:max-w-[150px] mx-auto hidden sm:block">
                        {step.desc}
                      </p>
                    </div>

                    {/* Connecting Line between steps (Desktop only) */}
                    {idx < steps.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-[60%] w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -z-10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3 animate-fade-in">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-400">Research Interrupted</h4>
              {getFriendlyError(error)}
            </div>
          </div>
        )}

        {/* Verdict Cards Container */}
        {verdict && (
          <section id="results" className="space-y-8 animate-fade-in">
            
            {/* Main Verdict Glowing Banner */}
            <div className={`rounded-3xl border p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl transition-all duration-700
              ${verdict.decision === "INVEST" 
                ? "bg-emerald-950/10 border-emerald-500/40 shadow-emerald-950/20" 
                : "bg-rose-950/10 border-rose-500/40 shadow-rose-950/20"}
            `}>
              
              {/* Subtle background glow based on decision */}
              <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-25 pointer-events-none -mr-12 -mt-12
                ${verdict.decision === "INVEST" ? "bg-emerald-400" : "bg-rose-400"}
              `} />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Recommendation for {company.toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <h2 className={`text-4xl font-extrabold tracking-wider ${verdict.decision === "INVEST" ? "text-emerald-400" : "text-rose-400"}`}>
                      {verdict.decision}
                    </h2>
                    
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                      ${verdict.decision === "INVEST" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"}
                    `}>
                      {verdict.decision === "INVEST" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {verdict.decision === "INVEST" ? "Bullish Verdict" : "Bearish Verdict"}
                    </span>
                  </div>
                </div>

                {/* Confidence Meter */}
                <div className="flex flex-col items-start md:items-end space-y-2">
                  <span className="text-xs text-gray-400 font-medium">Analyst Confidence Score</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-extrabold ${verdict.decision === "INVEST" ? "text-emerald-400" : "text-rose-400"}`}>
                      {verdict.confidence}%
                    </span>
                    <div className="w-32 bg-white/[0.05] rounded-full h-3.5 border border-white/[0.08] overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 
                          ${verdict.decision === "INVEST" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-orange-500"}`} 
                        style={{ width: `${verdict.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bull and Bear Points Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Bull Points Card */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-xl relative overflow-hidden hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-gray-100">Bull Case (Growth Drivers)</h3>
                </div>
                <ul className="space-y-4">
                  {verdict.bullPoints?.map((point, index) => (
                    <li key={index} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bear Points Card */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-xl relative overflow-hidden hover:border-rose-500/20 transition-all duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-4">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                  <h3 className="text-lg font-bold text-gray-100">Bear Case (Key Concerns)</h3>
                </div>
                <ul className="space-y-4">
                  {verdict.bearPoints?.map((point, index) => (
                    <li key={index} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-2" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Risk Factors Card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-xl hover:border-orange-500/20 transition-all duration-300">
              <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-4">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-gray-100">Core Risk Factors</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verdict.riskFactors?.map((risk, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] text-sm text-gray-300 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources / Citations Card */}
            {verdict.sources && verdict.sources.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-4">
                  <FileText className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-bold text-gray-100">Research Sources & References</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {verdict.sources.map((url, idx) => {
                    const isLink = url.startsWith("http");
                    let host = url;
                    try {
                      if (isLink) {
                        host = new URL(url).hostname;
                      }
                    } catch (e) {}

                    return isLink ? (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 text-xs text-gray-400 font-medium transition-all"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {host}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-gray-400 font-medium"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {url}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={resultsEndRef} />
          </section>
        )}

      </div>
    </div>
  );
}
