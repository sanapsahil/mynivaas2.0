export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8" style={{ padding: "32px 24px" }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
            <span className="font-semibold text-text">
              Estate<span className="text-primary">Compare</span>
            </span>
          </div>

          <p className="text-sm text-text-muted text-center">
            Compare real estate prices across platforms. We redirect you to original listings.
          </p>

          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} EstateCompare
          </p>
        </div>
      </div>
    </footer>
  );
}
