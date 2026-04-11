import { useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

const GOALS = [
  {
    id: "wealth",
    label: "Wealth Creation",
    desc: "Grow my money aggressively over time",
  },
  {
    id: "income",
    label: "Steady Income",
    desc: "Regular returns with lower risk",
  },
  {
    id: "retirement",
    label: "🏖️ Retirement",
    desc: "Safe, long-term wealth building",
  },
  {
    id: "education",
    label: "🎓 Education Fund",
    desc: "Save for a child's future",
  },
  { id: "safety", label: "🛡️ Capital Safety", desc: "Protect my money first" },
];
const DURATIONS = [
  { id: "short", label: "Short Term", sub: "Under 1 year" },
  { id: "medium", label: "Medium Term", sub: "1 – 3 years" },
  { id: "long", label: "Long Term", sub: "3+ years" },
];
const RISKS = [
  { id: "low", label: "Low Risk", sub: "Safety over returns" },
  { id: "medium", label: "Medium Risk", sub: "Balance of both" },
  { id: "high", label: "High Risk", sub: "Higher potential gains" },
];
const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];

export default function Advisor() {
  const [goal, setGoal] = useState(null);
  const [duration, setDuration] = useState(null);
  const [risk, setRisk] = useState(null);
  const [investmentType, setInvestmentType] = useState("one-time");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!goal || !duration || !risk || !budget) {
      setError("Please complete all four sections before continuing.");
      return;
    }
    if (parseFloat(budget) <= 0) {
      setError("Please enter a valid investment amount.");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const res = await API.post("/advisor/recommend", {
        goal,
        duration,
        risk,
        budget: parseFloat(budget),
        investmentType: investmentType,
      });
      setResults(res.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-premium text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-accent via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Financial Advisor
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Answer four simple questions and we'll suggest stocks that match
            your goals — in plain English, no jargon.
          </p>
        </div>

        {/* 1 — GOAL */}
        <Section title="1. What's your investment goal?">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {GOALS.map((g) => (
              <OptionCard
                key={g.id}
                selected={goal === g.id}
                onClick={() => setGoal(g.id)}
                label={g.label}
                sub={g.desc}
              />
            ))}
          </div>
        </Section>

        {/* 2 — DURATION */}
        <Section title="2. How long do you plan to stay invested?">
          <div className="flex flex-wrap gap-3">
            {DURATIONS.map((d) => (
              <OptionCard
                key={d.id}
                selected={duration === d.id}
                onClick={() => setDuration(d.id)}
                label={d.label}
                sub={d.sub}
                compact
              />
            ))}
          </div>
        </Section>

        {/* 3 — RISK */}
        <Section title="3. How much risk are you comfortable with?">
          <div className="flex flex-wrap gap-3">
            {RISKS.map((r) => (
              <OptionCard
                key={r.id}
                selected={risk === r.id}
                onClick={() => setRisk(r.id)}
                label={r.label}
                sub={r.sub}
                compact
              />
            ))}
          </div>
        </Section>

        {/* 4 — BUDGET */}
        <Section title="4. How much do you want to invest? (₹)">
          {/* Investment Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setInvestmentType("one-time")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                investmentType === "one-time"
                  ? "glass border border-accent border-opacity-100 bg-accent bg-opacity-10 text-accent"
                  : "glass border border-accent border-opacity-20 text-gray-400 hover:border-opacity-50"
              }`}
            >
              One-Time Lump Sum
            </button>
            <button
              onClick={() => setInvestmentType("monthly")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
                investmentType === "monthly"
                  ? "glass border border-accent border-opacity-100 bg-accent bg-opacity-10 text-accent"
                  : "glass border border-accent border-opacity-20 text-gray-400 hover:border-opacity-50"
              }`}
            >
              Monthly SIP
            </button>
          </div>

          <div className="glass border border-accent border-opacity-20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl text-accent">₹</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={
                  investmentType === "one-time" ? "e.g. 500000" : "e.g. 10000"
                }
                className="bg-transparent text-white text-2xl font-semibold outline-none flex-1 placeholder-gray-500"
              />
              <span className="text-sm text-gray-400">
                {investmentType === "monthly" ? "/ month" : ""}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {investmentType === "one-time"
                ? "How much would you like to invest all at once?"
                : "How much would you like to invest each month?"}
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() =>
                    setBudget(
                      String(investmentType === "monthly" ? amt / 10 : amt),
                    )
                  }
                  className="text-xs font-medium glass border border-accent border-opacity-20 hover:border-opacity-50 px-4 py-2 rounded-full text-accent transition-all duration-200"
                >
                  ₹
                  {(investmentType === "monthly"
                    ? amt / 10
                    : amt
                  ).toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {error && (
          <p className="text-red-premium mb-6 text-sm font-semibold backdrop-blur-sm bg-red-premium bg-opacity-10 border border-red-premium border-opacity-20 rounded-xl p-4">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold py-4 mb-12"
        >
          {loading ? "Analysing India's markets for you…" : "Analyse for me →"}
        </button>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-10 h-10 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-300 font-medium">
              Checking RSI, sentiment, and momentum for your picks…
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This takes about 5–10 seconds.
            </p>
          </div>
        )}

        {/* RESULTS */}
        {results && results.length > 0 && (
          <div>
            {/* Portfolio Summary */}
            <PortfolioSummary stocks={results} budget={parseFloat(budget)} />

            <h2 className="text-2xl font-bold mb-6">
              <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                Your Personalised Picks
              </span>
            </h2>
            <div className="space-y-4 mb-8">
              {results.map((stock, i) => (
                <RecoCard
                  key={i}
                  stock={stock}
                  rank={i + 1}
                  totalBudget={parseFloat(budget)}
                />
              ))}
            </div>
            <div className="glass border border-red-premium border-opacity-30 rounded-2xl p-6 text-sm text-red-premium">
              ⚠️ <strong>Disclaimer:</strong> These picks are AI-generated for
              educational purposes only and are{" "}
              <strong>not financial advice</strong>. Always consult a
              SEBI-registered investment advisor before investing.
            </div>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="glass border border-accent border-opacity-20 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-lg">
              No suitable stocks found for your criteria. Try adjusting your
              preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3 text-gray-200">{title}</h2>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, label, sub, compact = false }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer group glass border transition-all duration-300 select-none rounded-2xl p-4
        ${compact ? "min-w-[140px]" : "min-h-[80px]"}
        ${
          selected
            ? "border-accent border-opacity-100 bg-accent bg-opacity-10 shadow-glow"
            : "border-accent border-opacity-20 hover:border-opacity-50 hover:shadow-premium"
        }`}
    >
      <p
        className={`font-semibold text-sm ${selected ? "text-accent" : "text-gray-300 group-hover:text-accent"}`}
      >
        {label}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1 leading-tight">{sub}</p>}
    </div>
  );
}

function PortfolioSummary({ stocks, budget }) {
  if (!stocks || stocks.length === 0) return null;

  // Calculate metrics
  const avgConfidence =
    stocks.reduce((sum, s) => sum + (s.confidence || 65), 0) / stocks.length;
  const riskCounts = { low: 0, medium: 0, high: 0 };
  stocks.forEach((s) => riskCounts[s.risk_level]++);

  const riskLabel =
    riskCounts.high > 2
      ? "High Risk"
      : riskCounts.high > 0
        ? "Moderate-High"
        : riskCounts.medium > 0
          ? "Balanced"
          : "Conservative";

  // Calculate expected returns based on risk levels
  const EXPECTED_ANNUAL_RETURNS = {
    low: 10, // 10% for low-risk stocks (blue chips)
    medium: 14, // 14% for medium-risk stocks
    high: 20, // 20% for high-risk stocks (growth)
  };

  const INVESTMENT_HORIZON = 3; // 3 years as default
  const INFLATION_RATE = 6; // 6% inflation rate

  // Calculate expected returns for each stock (3-year horizon)
  let totalExpectedReturns = 0;
  let totalNominalReturns = 0;

  stocks.forEach((stock) => {
    const allocation = stock.suggested_allocation || budget / stocks.length;
    const expectedAnnualReturn =
      EXPECTED_ANNUAL_RETURNS[stock.risk_level] / 100;

    // Compound formula: A = P(1 + r)^n
    const nominalValue =
      allocation * Math.pow(1 + expectedAnnualReturn, INVESTMENT_HORIZON);
    const nominalProfit = nominalValue - allocation;

    totalNominalReturns += nominalProfit;
    totalExpectedReturns += nominalValue;
  });

  const totalProfit = totalNominalReturns;
  const returnPercentage = ((totalProfit / budget) * 100).toFixed(2);

  // Inflation-adjusted returns
  const inflationFactor = Math.pow(
    1 + INFLATION_RATE / 100,
    INVESTMENT_HORIZON,
  );
  const realValue = totalExpectedReturns / inflationFactor;
  const realProfit = realValue - budget;
  const realReturnPercentage = ((realProfit / budget) * 100).toFixed(2);

  return (
    <div className="glass border border-accent border-opacity-20 p-6 rounded-2xl mb-8 hover:shadow-premium-lg transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6">
        <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
          Portfolio Summary
        </span>
      </h2>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Total Investment
          </p>
          <p className="text-2xl font-bold text-white">
            ₹{budget.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="glass border border-accent border-opacity-20 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Stocks Selected
          </p>
          <p className="text-2xl font-bold text-accent">{stocks.length}</p>
        </div>

        <div className="glass border border-green-premium border-opacity-20 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Avg Confidence
          </p>
          <p className="text-2xl font-bold text-green-premium">
            {avgConfidence.toFixed(0)}%
          </p>
        </div>

        <div className="glass border border-blue-400 border-opacity-20 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Portfolio Risk
          </p>
          <p className="text-2xl font-bold text-blue-400">{riskLabel}</p>
        </div>
      </div>

      {/* Expected Returns Section (Nominal) */}
      <div className="mb-6 p-4 glass border border-green-primary border-opacity-20 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          💹 Expected Returns (Nominal - {INVESTMENT_HORIZON} Year Investment)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass border border-green-primary border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Amount Invested</p>
            <p className="text-lg font-bold text-white">
              ₹{budget.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="glass border border-green-primary border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Expected Returns</p>
            <p className="text-lg font-bold text-green-primary">
              ₹
              {totalProfit.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="glass border border-green-primary border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Total Value</p>
            <p className="text-lg font-bold text-green-primary">
              ₹
              {totalExpectedReturns.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="glass border border-green-primary border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Return %</p>
            <p className="text-lg font-bold text-green-primary">
              {returnPercentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Inflation-Adjusted Returns Section */}
      <div className="mb-6 p-4 glass border border-purple-400 border-opacity-20 rounded-xl">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
          Real Returns (Inflation-Adjusted @ {INFLATION_RATE}% Annual Inflation)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass border border-purple-400 border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Amount Invested</p>
            <p className="text-lg font-bold text-white">
              ₹{budget.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="glass border border-purple-400 border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Real Returns</p>
            <p
              className={`text-lg font-bold ${realProfit > 0 ? "text-purple-400" : "text-red-premium"}`}
            >
              ₹
              {realProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="glass border border-purple-400 border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Real Value</p>
            <p className="text-lg font-bold text-purple-400">
              ₹{realValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="glass border border-purple-400 border-opacity-20 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Real Return %</p>
            <p
              className={`text-lg font-bold ${realReturnPercentage > 0 ? "text-purple-400" : "text-red-premium"}`}
            >
              {realReturnPercentage}%
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Real returns account for inflation, showing actual purchasing power
          growth.
        </p>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass border border-green-primary border-opacity-20 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Low Risk</p>
          <p className="text-lg font-bold text-green-primary">
            {riskCounts.low}
          </p>
        </div>
        <div className="glass border border-yellow-500 border-opacity-20 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Medium Risk</p>
          <p className="text-lg font-bold text-yellow-300">
            {riskCounts.medium}
          </p>
        </div>
        <div className="glass border border-red-premium border-opacity-20 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">High Risk</p>
          <p className="text-lg font-bold text-red-premium">
            {riskCounts.high}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecoCard({ stock, rank, totalBudget }) {
  const bull = stock.trend === "BULLISH";
  const rsiColor =
    stock.rsi < 35
      ? "text-blue-400"
      : stock.rsi <= 65
        ? "text-green-premium"
        : "text-red-premium";
  const riskClass =
    {
      low: "bg-blue-premium bg-opacity-20 text-blue-400",
      medium: "bg-yellow-500 bg-opacity-20 text-yellow-300",
      high: "bg-red-premium bg-opacity-20 text-red-premium",
    }[stock.risk_level] || "";

  const allocationPercent = (
    (stock.suggested_allocation / totalBudget) *
    100
  ).toFixed(1);
  const confidenceColor =
    stock.confidence >= 75
      ? "text-green-premium"
      : stock.confidence >= 60
        ? "text-yellow-300"
        : "text-orange-400";

  return (
    <div className="glass border border-accent border-opacity-20 rounded-2xl p-6 hover:shadow-premium-lg transition-all duration-300">
      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full bg-accent bg-opacity-20 text-accent font-semibold">
              #{rank}
            </span>
            <h3 className="font-bold text-lg bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
              {stock.name}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${riskClass} font-semibold`}
            >
              {stock.risk_level} risk
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {stock.symbol} · {stock.sector}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-white">
            ₹{stock.current_price}
          </p>
          <p
            className={`text-sm font-semibold ${bull ? "text-green-premium" : "text-red-premium"}`}
          >
            {bull ? "▲ BULLISH" : "▼ BEARISH"}
          </p>
        </div>
      </div>

      {/* One-liner description */}
      <p className="text-sm text-gray-400 mb-4">{stock.description}</p>

      {/* RSI bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span className="font-semibold">RSI (Relative Strength Index)</span>
          <span className={`font-bold ${rsiColor}`}>{stock.rsi}</span>
        </div>
        <div className="w-full bg-white bg-opacity-5 rounded-full h-2 overflow-hidden border border-accent border-opacity-10">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${bull ? "bg-gradient-to-r from-green-premium to-green-400" : "bg-gradient-to-r from-orange-500 to-red-premium"}`}
            style={{ width: `${Math.min(stock.rsi, 100)}%` }}
          />
        </div>
      </div>

      {/* Sentiment + Confidence */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {stock.sentiment_score !== undefined && (
          <div className="text-xs">
            <p className="text-gray-400 font-semibold mb-1">News Sentiment</p>
            <p
              className={`font-bold ${stock.sentiment_score > 60 ? "text-green-premium" : stock.sentiment_score < 40 ? "text-red-premium" : "text-blue-400"}`}
            >
              {stock.sentiment_score}/100
            </p>
          </div>
        )}
        <div className="text-xs">
          <p className="text-gray-400 font-semibold mb-1">Confidence</p>
          <p className={`font-bold ${confidenceColor}`}>{stock.confidence}%</p>
        </div>
      </div>

      {/* AI reason */}
      <p className="text-sm text-gray-300 mb-5 glass border border-accent border-opacity-10 p-4 rounded-xl leading-relaxed">
        {stock.reason}
      </p>

      {/* Allocation chips */}
      <div className="flex gap-3 text-sm flex-wrap">
        <div className="glass border border-accent border-opacity-20 px-4 py-3 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Allocation
          </p>
          <p className="font-bold text-green-premium mt-1">
            ₹{stock.suggested_allocation.toLocaleString("en-IN")} (
            {allocationPercent}%)
          </p>
        </div>
        <div className="glass border border-accent border-opacity-20 px-4 py-3 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
            Approx. Shares
          </p>
          <p className="font-bold text-accent mt-1">
            {stock.shares_you_can_buy}
          </p>
        </div>
      </div>
    </div>
  );
}
