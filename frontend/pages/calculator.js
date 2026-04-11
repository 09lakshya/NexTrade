import { useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

export default function Calculator() {
  const [calcPrincipal, setCalcPrincipal] = useState("");
  const [calcRate, setCalcRate] = useState("12");
  const [calcYears, setCalcYears] = useState("3");
  const [calcResult, setCalcResult] = useState(null);
  const [calcType, setCalcType] = useState("lumpsum");

  const INFLATION_RATE = 6; // 6% inflation rate

  const handleCalculate = async () => {
    if (!calcPrincipal || parseFloat(calcPrincipal) <= 0) {
      alert("Please enter a valid investment amount");
      return;
    }
    try {
      const principal = parseFloat(calcPrincipal);
      const years = parseInt(calcYears);
      const rate = parseFloat(calcRate);

      const res = await API.post("/advisor/calculate", {
        principal: principal,
        annual_rate: rate,
        years: years,
        inflation_rate: INFLATION_RATE,
      });

      // Calculate CAGR
      const fv = res.data.future_value;
      const cagr = (Math.pow(fv / principal, 1 / years) - 1) * 100;

      // Calculate Real CAGR (inflation-adjusted)
      const realFv = fv / Math.pow(1 + INFLATION_RATE / 100, years);
      const realCagr = (Math.pow(realFv / principal, 1 / years) - 1) * 100;

      setCalcResult({
        ...res.data,
        cagr: cagr.toFixed(2),
        real_cagr: realCagr.toFixed(2),
      });
    } catch (err) {
      alert("Calculation error. Please try again.");
    }
  };

  const calculateSIP = () => {
    const P = parseFloat(calcPrincipal); // Monthly investment
    const r = parseFloat(calcRate) / 100 / 12; // Monthly rate
    const n = parseInt(calcYears) * 12; // Number of months
    const years = parseInt(calcYears);

    if (P <= 0) {
      alert("Please enter a valid monthly investment amount");
      return;
    }

    // SIP Formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    const futureValue = P * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const totalInvested = P * n;
    const profit = futureValue - totalInvested;
    const returnPercentage = (profit / totalInvested) * 100;

    // CAGR calculation for SIP
    const cagr = (Math.pow(futureValue / totalInvested, 1 / years) - 1) * 100;

    // Inflation-adjusted
    const inflationFactor = Math.pow(1 + INFLATION_RATE / 100, years);
    const realValue = futureValue / inflationFactor;
    const realProfit = realValue - totalInvested;
    const realReturnPercentage = (realProfit / totalInvested) * 100;

    // Real CAGR
    const realCagr = (Math.pow(realValue / totalInvested, 1 / years) - 1) * 100;

    setCalcResult({
      future_value: Math.round(futureValue),
      profit: Math.round(profit),
      return_percentage: returnPercentage.toFixed(2),
      cagr: cagr.toFixed(2),
      real_return_percentage: realReturnPercentage.toFixed(2),
      real_cagr: realCagr.toFixed(2),
      total_invested: Math.round(totalInvested),
      inflation_adjusted_value: Math.round(realValue),
      monthly_investment: P,
      is_sip: true,
    });
  };

  const handleCalculateClick = () => {
    if (calcType === "lumpsum") {
      handleCalculate();
    } else {
      calculateSIP();
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
              Investment Calculator
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Calculate your investment returns with compound interest and
            inflation adjustments.
          </p>
        </div>

        {/* Calculator Type Toggle */}
        <div className="mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCalcType("lumpsum");
                setCalcResult(null);
              }}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                calcType === "lumpsum"
                  ? "glass border border-accent border-opacity-100 bg-accent bg-opacity-10 text-accent"
                  : "glass border border-accent border-opacity-20 text-gray-400 hover:border-opacity-50"
              }`}
            >
              Lump Sum Investment
            </button>
            <button
              onClick={() => {
                setCalcType("sip");
                setCalcResult(null);
              }}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                calcType === "sip"
                  ? "glass border border-accent border-opacity-100 bg-accent bg-opacity-10 text-accent"
                  : "glass border border-accent border-opacity-20 text-gray-400 hover:border-opacity-50"
              }`}
            >
              Monthly SIP
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="glass border border-accent border-opacity-20 rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="text-sm text-gray-400 uppercase tracking-wider font-semibold block mb-3">
                {calcType === "lumpsum"
                  ? "Investment Amount (₹)"
                  : "Monthly Investment (₹)"}
              </label>
              <input
                type="number"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(e.target.value)}
                placeholder={calcType === "lumpsum" ? "500000" : "10000"}
                className="w-full bg-white bg-opacity-5 border border-accent border-opacity-20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-opacity-100 text-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                {calcType === "lumpsum"
                  ? "How much will you invest at once?"
                  : "How much will you invest every month?"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-400 uppercase tracking-wider font-semibold block mb-3">
                Expected Annual Return (%)
              </label>
              <input
                type="number"
                value={calcRate}
                onChange={(e) => setCalcRate(e.target.value)}
                placeholder="12"
                className="w-full bg-white bg-opacity-5 border border-accent border-opacity-20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-opacity-100 text-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                Blue chips: 10% | Mid-caps: 14% | Small-caps: 20%
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-400 uppercase tracking-wider font-semibold block mb-3">
                Time Period (Years)
              </label>
              <input
                type="number"
                value={calcYears}
                onChange={(e) => setCalcYears(e.target.value)}
                placeholder="3"
                className="w-full bg-white bg-opacity-5 border border-accent border-opacity-20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-opacity-100 text-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                Short: 1yr | Medium: 3yrs | Long: 5+ yrs
              </p>
            </div>
          </div>

          <button
            onClick={handleCalculateClick}
            className="w-full btn-premium text-lg font-bold py-3"
          >
            Calculate Returns →
          </button>
        </div>

        {/* Results Section */}
        {calcResult && (
          <div>
            {/* Nominal Returns */}
            <div className="mb-8 p-6 glass border border-green-primary border-opacity-20 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">
                <span className="bg-gradient-to-r from-green-primary to-green-400 bg-clip-text text-transparent">
                  Nominal Returns ({calcResult.return_percentage}%)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="glass border border-green-primary border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    {calcType === "lumpsum"
                      ? "Amount Invested"
                      : "Total Invested"}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    ₹
                    {(
                      calcResult.total_invested ||
                      calcResult.future_value - calcResult.profit
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="glass border border-green-primary border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Returns Earned
                  </p>
                  <p className="text-2xl font-bold text-green-primary">
                    ₹{calcResult.profit.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="glass border border-green-primary border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-green-primary">
                    ₹{calcResult.future_value.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="glass border border-green-primary border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Absolute Return %
                  </p>
                  <p className="text-2xl font-bold text-green-primary">
                    {calcResult.return_percentage}%
                  </p>
                </div>

                <div className="glass border border-blue-400 border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    CAGR %
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {calcResult.cagr}%
                  </p>
                </div>
              </div>
            </div>

            {/* Real Returns (Inflation-Adjusted) */}
            <div className="p-6 glass border border-purple-400 border-opacity-20 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                  Real Returns - Inflation Adjusted (
                  {calcResult.real_return_percentage}%)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="glass border border-purple-400 border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    {calcType === "lumpsum"
                      ? "Amount Invested"
                      : "Total Invested"}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    ₹
                    {(
                      calcResult.total_invested ||
                      calcResult.future_value - calcResult.profit
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div
                  className={`glass border border-opacity-20 rounded-lg p-4 ${parseFloat(calcResult.real_return_percentage) > 0 ? "border-purple-400" : "border-red-premium"}`}
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Real Returns
                  </p>
                  <p
                    className={`text-2xl font-bold ${parseFloat(calcResult.real_return_percentage) > 0 ? "text-purple-400" : "text-red-premium"}`}
                  >
                    ₹
                    {Math.round(
                      (calcResult.inflation_adjusted_value ||
                        calcResult.future_value * 0.85) -
                        (calcResult.total_invested ||
                          calcResult.future_value - calcResult.profit),
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="glass border border-purple-400 border-opacity-20 rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Real Value
                  </p>
                  <p className="text-2xl font-bold text-purple-400">
                    ₹
                    {(
                      calcResult.inflation_adjusted_value ||
                      calcResult.future_value * 0.85
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div
                  className={`glass border border-opacity-20 rounded-lg p-4 ${parseFloat(calcResult.real_return_percentage) > 0 ? "border-purple-400" : "border-red-premium"}`}
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Real Return %
                  </p>
                  <p
                    className={`text-2xl font-bold ${parseFloat(calcResult.real_return_percentage) > 0 ? "text-purple-400" : "text-red-premium"}`}
                  >
                    {calcResult.real_return_percentage}%
                  </p>
                </div>

                <div
                  className={`glass border border-opacity-20 rounded-lg p-4 ${parseFloat(calcResult.real_cagr) > 0 ? "border-purple-400" : "border-red-premium"}`}
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                    Real CAGR
                  </p>
                  <p
                    className={`text-2xl font-bold ${parseFloat(calcResult.real_cagr) > 0 ? "text-purple-400" : "text-red-premium"}`}
                  >
                    {calcResult.real_cagr}%
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 glass border border-yellow-500 border-opacity-20 rounded-lg">
                <p className="text-sm text-yellow-300">
                  <strong>What is CAGR (Compound Annual Growth Rate)?</strong>{" "}
                  It shows the average annual return if your investment grows at
                  a steady rate each year. CAGR smooths out volatility to show
                  true growth performance. Real CAGR accounts for inflation.
                </p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-8 p-6 glass border border-blue-400 border-opacity-20 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">
                💬 Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  ✅ <strong>Lump Sum:</strong> Best if you have a large capital
                  and want to deploy it immediately.
                </li>
                <li>
                  ✅ <strong>SIP:</strong> Ideal for building wealth gradually
                  and reducing market timing risk.
                </li>
                <li>
                  ✅ <strong>Inflation Matters:</strong> 10% returns sounds
                  great, but after 6% inflation, your real gains are only 4%.
                </li>
                <li>
                  ✅ <strong>Time is Money:</strong> Even small amounts compound
                  heavily over 10+ years.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
