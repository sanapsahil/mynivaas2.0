export default function LoadingCard() {
  return (
    <div
      className="bg-white animate-shimmer"
      style={{ borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px 24px" }}
    >
      <div className="flex items-start justify-between" style={{ gap: "20px" }}>
        <div className="flex-1">
          <div className="flex items-center" style={{ gap: "8px", marginBottom: "14px" }}>
            <div style={{ width: "64px", height: "20px", background: "#f1f5f9", borderRadius: "20px" }} />
            <div style={{ width: "80px", height: "20px", background: "#f1f5f9", borderRadius: "20px" }} />
          </div>
          <div style={{ width: "75%", height: "18px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "10px" }} />
          <div style={{ width: "50%", height: "14px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "12px" }} />
          <div className="flex" style={{ gap: "12px" }}>
            <div style={{ width: "60px", height: "14px", background: "#f1f5f9", borderRadius: "6px" }} />
            <div style={{ width: "80px", height: "14px", background: "#f1f5f9", borderRadius: "6px" }} />
          </div>
        </div>
        <div className="text-right">
          <div style={{ width: "100px", height: "24px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "8px" }} />
          <div style={{ width: "64px", height: "14px", background: "#f1f5f9", borderRadius: "6px", marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}

export function LoadingGrid() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
