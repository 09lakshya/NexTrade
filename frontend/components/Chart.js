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
        backgroundColor: "rgba(10, 14, 39, 0.95)",
        borderColor: "#22c55e",
        borderWidth: 2,
        bodyColor: "#ffffff",
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
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          callback: function (value) {
            return "₹" + value.toFixed(0);
          },
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
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
        borderColor: "#22c55e",
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 8,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const ChartContent = () => (
    <div className="relative w-full h-full">
      <Line data={chartData} options={chartOptions} />
      {hoveredTimestamp && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 bg-opacity-20 border-b border-green-500 border-opacity-50 px-4 py-2 z-10">
          <p className="text-sm font-semibold text-green-400">
            {hoveredTimestamp}
          </p>
        </div>
      )}
    </div>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-7xl max-h-[90vh] bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl p-6 flex flex-col border border-green-500 border-opacity-20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">
              Chart - Expanded View
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-6 py-2 bg-green-500 bg-opacity-20 border border-green-500 text-green-400 rounded-lg hover:bg-opacity-30 font-semibold transition-all duration-200"
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
        className="mb-2 self-end px-4 py-1 text-sm bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 text-green-400 rounded hover:bg-opacity-20 transition-all duration-200"
      >
        Expand
      </button>
      <div style={{ height: "300px", width: "100%" }}>
        <ChartContent />
      </div>
    </div>
  );
}
