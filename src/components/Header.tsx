"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between" style={{ height: "64px" }}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-dark transition-colors">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-text">
              Estate<span className="text-primary">Compare</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
            >
              How it Works
            </a>
            
            {/* AI Features Dropdown/Menu */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="relative group">
                <button className="text-sm font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                  🤖 AI Tools
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-10">
                  <Link
                    href="/ai/fraud-detection"
                    className="block px-4 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    🛡️ Fraud Detection
                  </Link>
                  <Link
                    href="/ai/price-explanation"
                    className="block px-4 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    💰 Why This Price
                  </Link>
                  <Link
                    href="/ai/neighborhood"
                    className="block px-4 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    🏘️ Neighborhood Report
                  </Link>
                  <Link
                    href="/ai/market-insights"
                    className="block px-4 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    📊 Market Insights
                  </Link>
                  <Link
                    href="/ai/recommendations"
                    className="block px-4 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-primary transition-colors"
                  >
                    ⭐ Recommendations
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
