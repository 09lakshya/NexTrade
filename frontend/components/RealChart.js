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
import { useState } from "react";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
);

export default function RealChart({ data }) {
  // 🔥 FORCE VALID DATA
  const cleaned = (data || []).filter(
    (d) => d && d.Date && d.Close !== null && d.Close !== undefined,
  );

  if (cleaned.length === 0) {
    return <div className="text-gray-400">No chart data</div>;
  }

  // Determine if bullish or bearish
  const firstPrice = Number(cleaned[0].Close);
  const lastPrice = Number(cleaned[cleaned.length - 1].Close);
  const isBullish = lastPrice >= firstPrice;

  // Set colors based on trend
  const lineColor = isBullish ? "#00ff88" : "#ff3366";
  const bgColor = isBullish
    ? "rgba(0, 255, 136, 0.15)"
    : "rgba(255, 51, 102, 0.15)";

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
        backgroundColor: "rgba(10, 14, 39, 0.95)",
        borderColor: lineColor,
        borderWidth: 2,
        titleColor: lineColor,
        bodyColor: "#ffffff",
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
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
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
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: lineColor,
        pointBorderColor: "#ffffff",
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
