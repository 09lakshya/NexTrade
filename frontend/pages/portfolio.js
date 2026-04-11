import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

export default function Portfolio() {
  const [userId, setUserId] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Add-stock form state
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selSymbol, setSelSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [formErr, setFormErr] = useState("");

  // ── User ID (persisted in localStorage) ──────────────────────────────────
  useEffect(() => {
    let id = localStorage.getItem("ntrade_uid");
    if (!id) {
      id = "u_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      localStorage.setItem("ntrade_uid", id);
    }
    setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchPortfolio();
  }, [userId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/portfolio/${userId}`);
      setHoldings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async (q) => {
    setSearchQ(q);
    setSelSymbol("");
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await API.get(`/search?q=${q}`);
      setSearchResults((res.data || []).slice(0, 6));
    } catch {
      setSearchResults([]);
    }
  };

  const selectStock = (sym) => {
    setSelSymbol(sym);
    setSearchQ(sym);
    setSearchResults([]);
  };

  // ── Add holding ───────────────────────────────────────────────────────────
  const addHolding = async () => {
    if (!selSymbol || !quantity || !buyPrice) {
      setFormErr("Please fill in all three fields.");
      return;
    }
    if (parseFloat(quantity) <= 0 || parseFloat(buyPrice) <= 0) {
      setFormErr("Quantity and price must be greater than zero.");
      return;
    }
    setFormErr("");
    setAdding(true);
    try {
      await API.post("/portfolio/add", {
        user_id: userId,
        symbol: selSymbol,
        company_name: selSymbol,
        quantity: parseFloat(quantity),
        buy_price: parseFloat(buyPrice),
      });
      setShowForm(false);
      setSearchQ("");
      setSelSymbol("");
      setQuantity("");
      setBuyPrice("");
      await fetchPortfolio();
    } catch {
      setFormErr("Could not add holding. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  // ── Remove holding ────────────────────────────────────────────────────────
  const removeHolding = async (id) => {
    try {
      await API.delete(`/portfolio/${id}?user_id=${userId}`);
      await fetchPortfolio();
    } catch {
      alert("Failed to remove. Please try again.");
    }
  };

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
  const totalCurrent = holdings.reduce(
    (s, h) => s + (h.current_price > 0 ? h.current_value : h.invested),
    0,
  );
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const fmt = (n) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-gradient-premium text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-2">
              <span className="bg-gradient-to-r from-accent via-blue-400 to-purple-400 bg-clip-text text-transparent">
                My Portfolio
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Manage and track your investments
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormErr("");
            }}
            className="btn-premium"
          >
            {showForm ? "Cancel" : "+ Add Stock"}
          </button>
        </div>

        {/* ADD FORM */}
        {showForm && (
          <div className="glass border border-accent border-opacity-20 rounded-3xl p-8 mb-12">
            <h2 className="text-xl font-bold mb-6 text-white">
              Add a Stock to Your Portfolio
            </h2>
            <div className="flex flex-col gap-4 lg:gap-4 lg:flex-row lg:items-end">
              {/* Symbol search */}
              <div className="relative flex-1 min-w-[180px]">
                <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider font-semibold">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="e.g. RELIANCE"
                  className="w-full glass border border-accent border-opacity-20 p-3 rounded-xl text-white outline-none placeholder-gray-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full glass border border-accent border-opacity-20 z-50 rounded-xl mt-2 max-h-48 overflow-y-auto">
                    {searchResults.map((sym) => (
                      <div
                        key={sym}
                        onClick={() => selectStock(sym)}
                        className="p-3 hover:bg-accent hover:bg-opacity-10 cursor-pointer text-sm border-b border-accent border-opacity-10 last:border-b-0 transition-all duration-200"
                      >
                        <span className="text-accent font-semibold">{sym}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="w-full lg:w-32">
                <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider font-semibold">
                  Quantity (shares)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full glass border border-accent border-opacity-20 p-3 rounded-xl text-white outline-none placeholder-gray-500"
                />
              </div>

              {/* Buy price */}
              <div className="w-full lg:w-40">
                <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider font-semibold">
                  Buy Price (₹)
                </label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full glass border border-accent border-opacity-20 p-3 rounded-xl text-white outline-none placeholder-gray-500"
                />
              </div>

              <button
                onClick={addHolding}
                disabled={adding}
                className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
              >
                {adding ? "Adding…" : "Add Stock"}
              </button>
            </div>
            {formErr && (
              <p className="text-red-premium text-sm mt-4 font-semibold">
                {formErr}
              </p>
            )}
          </div>
        )}

        {/* SUMMARY CARDS */}
        {holdings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <SummaryCard
              label="Total Invested"
              value={`₹${fmt(totalInvested)}`}
            />
            <SummaryCard
              label="Current Value"
              value={`₹${fmt(totalCurrent)}`}
            />
            <SummaryCard
              label="Total P&L"
              value={`${totalPnL >= 0 ? "+" : ""}₹${fmt(Math.abs(totalPnL))}`}
              color={totalPnL >= 0 ? "text-green-premium" : "text-red-premium"}
            />
            <SummaryCard
              label="Overall Return"
              value={`${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`}
              color={
                totalPnLPct >= 0 ? "text-green-premium" : "text-red-premium"
              }
            />
          </div>
        )}

        {/* HOLDINGS TABLE */}
        {loading ? (
          <div className="glass border border-accent border-opacity-20 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg">Loading your portfolio…</p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="glass border border-accent border-opacity-20 rounded-2xl text-center py-24">
            <p className="text-6xl mb-4">📂</p>
            <p className="text-xl font-semibold text-white mb-2">
              Your portfolio is empty.
            </p>
            <p className="text-gray-400">
              Click{" "}
              <span className="text-accent font-semibold">+ Add Stock</span> to
              start tracking your investments.
            </p>
          </div>
        ) : (
          <div className="glass border border-accent border-opacity-20 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white bg-opacity-5 border-b border-accent border-opacity-20">
                  <tr>
                    {[
                      "Stock",
                      "Qty",
                      "Buy ₹",
                      "Current ₹",
                      "Invested",
                      "Value",
                      "P&L",
                      "P&L %",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === "Stock" ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const profit = h.pnl >= 0;
                    const hasPrice = h.current_price > 0;
                    const pnlClass = profit
                      ? "text-green-premium"
                      : "text-red-premium";

                    return (
                      <tr
                        key={h.id}
                        className="border-t border-accent border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-accent">
                            {h.symbol}
                          </p>
                          <p className="text-xs text-gray-500">
                            Added {h.added_on}
                          </p>
                        </td>
                        <td className="text-right px-6 py-4 font-medium">
                          {h.quantity}
                        </td>
                        <td className="text-right px-6 py-4 font-medium">
                          ₹{h.buy_price}
                        </td>
                        <td className="text-right px-6 py-4 font-medium">
                          {hasPrice ? (
                            `₹${h.current_price}`
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="text-right px-6 py-4 font-medium">
                          ₹{fmt(h.invested)}
                        </td>
                        <td className="text-right px-6 py-4 font-medium">
                          {hasPrice ? `₹${fmt(h.current_value)}` : "—"}
                        </td>
                        <td
                          className={`text-right px-6 py-4 font-semibold ${hasPrice ? pnlClass : "text-gray-500"}`}
                        >
                          {hasPrice
                            ? `${profit ? "+" : "−"}₹${fmt(Math.abs(h.pnl))}`
                            : "—"}
                        </td>
                        <td
                          className={`text-right px-6 py-4 font-semibold ${hasPrice ? pnlClass : "text-gray-500"}`}
                        >
                          {hasPrice
                            ? `${profit ? "+" : ""}${h.pnl_percent.toFixed(2)}%`
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeHolding(h.id)}
                            className="text-gray-500 hover:text-red-premium transition text-lg leading-none font-bold"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-white" }) {
  return (
    <div className="glass border border-accent border-opacity-20 rounded-2xl p-6 hover:shadow-premium-lg transition-all duration-300">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
