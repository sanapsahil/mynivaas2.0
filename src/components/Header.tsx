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

          <nav className="hidden md:flex items-center gap-8">
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
          </nav>
        </div>
      </div>
    </header>
  );
}
