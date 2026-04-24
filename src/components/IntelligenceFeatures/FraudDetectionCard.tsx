"use client";

interface FraudDetectionCardProps {
  data: any;
  loading: boolean;
  error?: string | null;
}

export default function FraudDetectionCard({
  data,
  loading,
  error,
}: FraudDetectionCardProps) {
  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <p className="text-yellow-900 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
          <span className="text-gray-600">Analyzing fraud risk...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.trustScore) {
    return null;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-50 border-green-300";
      case "medium":
        return "bg-yellow-50 border-yellow-300";
      case "high":
        return "bg-red-50 border-red-300";
      default:
        return "bg-gray-50 border-gray-300";
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getRiskColor(data.riskLevel)}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">🛡️ Fraud Detection</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadgeColor(data.riskLevel)}`}>
          {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)} Risk
        </span>
      </div>

      {/* Trust Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Trust Score</span>
          <span className="text-2xl font-bold">{data.trustScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              data.trustScore >= 80
                ? "bg-green-500"
                : data.trustScore >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${data.trustScore}%` }}
          />
        </div>
      </div>

      {/* Flags */}
      {data.flags && data.flags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Issues Found:</h4>
          <ul className="space-y-1">
            {data.flags.map((flag: string, i: number) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!data.flags || data.flags.length === 0) && (
        <div className="text-sm text-gray-700">✓ No fraud indicators detected</div>
      )}
    </div>
  );
}
