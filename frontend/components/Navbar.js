import Link from "next/link";
import { useRouter } from "next/router";
import SearchBar from "./SearchBar";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/advisor", label: "AI Advisor" },
  { href: "/calculator", label: "Calculator" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-50 glass border-b border-accent border-opacity-20 px-6 py-4 flex flex-wrap gap-4 justify-between items-center shadow-premium-lg">
      <Link
        href="/"
        className="text-2xl font-bold whitespace-nowrap group flex items-center gap-2"
      >
        <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
          NexTrade
        </span>
      </Link>

      <div className="flex items-center gap-8">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-semibold transition-all duration-300 relative pb-2 ${
              router.pathname === href
                ? "text-accent"
                : "text-gray-300 hover:text-accent"
            }`}
          >
            {label}
            {router.pathname === href && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-accent rounded-full"></span>
            )}
          </Link>
        ))}
      </div>

      <SearchBar />
    </div>
  );
}
