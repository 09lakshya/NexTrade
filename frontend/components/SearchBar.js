import { useState } from "react";
import { useRouter } from "next/router";
import API from "../services/api";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const router = useRouter();

  const handleSearch = async (value) => {
    setQuery(value);

    if (!value) {
      setResults([]);
      return;
    }

    try {
      const res = await API.get(`/search?q=${value}`);
      console.log("Search results:", res.data); // DEBUG
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* INPUT */}
      <div className="bg-gray-900 bg-opacity-80 border-2 border-cyan-400 border-opacity-60 rounded-lg px-4 py-2 flex items-center gap-2 backdrop-blur-md hover:border-opacity-100 hover:bg-opacity-90 transition-all shadow-lg">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search stocks..."
          className="flex-1 bg-transparent text-white outline-none placeholder-gray-300 text-base font-medium"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer text-lg"
          >
            ✕
          </button>
        )}
      </div>

      {/* DROPDOWN */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-3 bg-gray-950 border border-cyan-400 z-[9999] rounded-2xl overflow-hidden shadow-2xl">
          {results.map((stock) => (
            <div
              key={stock}
              onClick={() => {
                setQuery("");
                setResults([]);
                router.push(`/stock/${stock}`);
              }}
              className="px-4 py-3 hover:bg-white hover:bg-opacity-5 cursor-pointer transition-all duration-200 border-b border-accent border-opacity-10 last:border-b-0 group"
            >
              <span className="text-accent font-semibold group-hover:text-blue-300">
                {stock}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
