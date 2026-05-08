import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useState, useEffect } from "react";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
);

// Resolve a CSS variable to its computed value (Chart.js can't use var() directly)
function getCSSVar(varName, fallback = "#888") {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return val || fallback;
}

export default function RealChart({ data }) {
  // 🔥 FORCE VALID DATA
  const cleaned = (data || []).filter(
    (d) => d && d.Date && d.Close !== null && d.Close !== undefined,
  );

  // Resolve CSS vars to real colors for Chart.js (re-resolve on theme change)
  const [colors, setColors] = useState({
    green: "#00c896",
    red: "#ff4d6a",
    greenDim: "rgba(0,200,150,0.08)",
    redDim: "rgba(255,77,106,0.08)",
    bgCard: "#111827",
    bgPrimary: "#080c1a",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    borderSubtle: "rgba(255,255,255,0.06)",
  });

  useEffect(() => {
    const resolve = () => {
      setColors({
        green: getCSSVar("--green", "#00c896"),
        red: getCSSVar("--red", "#ff4d6a"),
        greenDim: getCSSVar("--green-dim", "rgba(0,200,150,0.08)"),
        redDim: getCSSVar("--red-dim", "rgba(255,77,106,0.08)"),
        bgCard: getCSSVar("--bg-card", "#111827"),
        bgPrimary: getCSSVar("--bg-primary", "#080c1a"),
        textPrimary: getCSSVar("--text-primary", "#f1f5f9"),
        textSecondary: getCSSVar("--text-secondary", "#94a3b8"),
        borderSubtle: getCSSVar("--border-subtle", "rgba(255,255,255,0.06)"),
      });
    };

    resolve();

    // Re-resolve when theme changes (watches data-theme attribute)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "data-theme") {
          resolve();
          break;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  if (cleaned.length === 0) {
    return <div className="text-gray-400">No chart data</div>;
  }

  // Determine if bullish or bearish
  const firstPrice = Number(cleaned[0].Close);
  const lastPrice = Number(cleaned[cleaned.length - 1].Close);
  const isBullish = lastPrice >= firstPrice;

  // Set colors based on trend — using resolved values
  const lineColor = isBullish ? colors.green : colors.red;
  const bgColor = isBullish ? colors.greenDim : colors.redDim;

  let isIntraday = false;
  if (cleaned.length > 2) {
    const t1 = new Date(cleaned[0].Date).getTime();
    const t2 = new Date(cleaned[cleaned.length - 1].Date).getTime();
    if (t2 - t1 <= 7 * 24 * 60 * 60 * 1000) {
      isIntraday = true;
    }
  }

  const formatLabel = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      
      if (isIntraday) {
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${day}/${month}  ${time}`;
      } else {
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch {
      return dateString;
    }
  };

  const labels = cleaned.map((d) => formatLabel(d.Date));
  const prices = cleaned.map((d) => Number(d.Close));

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: colors.bgCard,
        borderColor: lineColor,
        borderWidth: 2,
        titleColor: lineColor,
        bodyColor: colors.textPrimary,
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function (context) {
            return `Price: ₹${context.parsed.y.toFixed(2)}`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: colors.borderSubtle,
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: colors.borderSubtle,
        },
        ticks: {
          color: colors.textSecondary,
          font: {
            size: 11,
          },
          callback: function (value) {
            return "₹" + value.toFixed(0);
          },
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Price",
        data: prices,
        borderColor: lineColor,
        backgroundColor: bgColor,
        fill: true,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: lineColor,
        pointBorderColor: colors.bgPrimary,
        pointBorderWidth: 2,
      },
    ],
  };

  const ChartContent = () => (
    <div className="relative w-full h-full">
      <Line data={chartData} options={chartOptions} />
    </div>
  );

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <ChartContent />
    </div>
  );
}
