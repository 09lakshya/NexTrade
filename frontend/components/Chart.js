import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useState } from "react";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
);

export default function Chart({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredTimestamp, setHoveredTimestamp] = useState(null);

  const formatFullDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const labels = data.map((d) => new Date(d.Date).toLocaleDateString());
  const fullLabels = data.map((d) => formatFullDate(d.Date));
  const prices = data.map((d) => d.Close);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    onHover: (event, activeElements) => {
      if (activeElements.length > 0) {
        const dataIndex = activeElements[0].index;
        setHoveredTimestamp(fullLabels[dataIndex]);
      } else {
        setHoveredTimestamp(null);
      }
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: "index",
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--green)",
        borderWidth: 2,
        bodyColor: "var(--text-primary)",
        padding: 12,
        borderRadius: 8,
        callback: {
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
      y: {
        grid: {
          color: "var(--border-subtle)",
        },
        ticks: {
          color: "var(--text-secondary)",
          callback: function (value) {
            return "₹" + value.toFixed(0);
          },
        },
      },
      x: {
        grid: {
          color: "var(--border-subtle)",
        },
        ticks: {
          color: "var(--text-secondary)",
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Stock Price",
        data: prices,
        borderColor: "var(--green)",
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: "var(--green)",
        pointBorderColor: "var(--bg-primary)",
        pointBorderWidth: 2,
      },
    ],
  };

  const ChartContent = () => (
    <div className="relative w-full h-full">
      <Line data={chartData} options={chartOptions} />
      {hoveredTimestamp && (
        <div className="absolute top-0 left-0 right-0 px-4 py-2 z-10" style={{ background: "var(--green-dim)", borderBottom: "1px solid var(--green)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
            {hoveredTimestamp}
          </p>
        </div>
      )}
    </div>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl max-h-[90vh] rounded-2xl p-6 flex flex-col border" style={{ background: "var(--bg-primary)", borderColor: "var(--border-medium)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Chart - Expanded View
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-6 py-2 rounded-lg font-semibold transition-all duration-200"
              style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid var(--green)" }}
            >
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ChartContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <button
        onClick={() => setIsExpanded(true)}
        className="mb-2 self-end px-4 py-1 text-sm rounded transition-all duration-200"
        style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid var(--green)" }}
      >
        Expand
      </button>
      <div style={{ height: "300px", width: "100%" }}>
        <ChartContent />
      </div>
    </div>
  );
}
