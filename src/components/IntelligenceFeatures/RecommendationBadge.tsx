"use client";

interface RecommendationBadgeProps {
  data: any;
  loading: boolean;
  error?: string | null;
}

export default function RecommendationBadge({
  data,
  loading,
  error,
}: RecommendationBadgeProps) {
  if (error) {
    return null; // Non-critical feature, fail silently
  }

  if (loading) {
    return null; // Non-critical feature, hide during loading
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  // Show top recommendation
  const topRec = data.recommendations[0];
  if (!topRec || !topRec.matchScore) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">⭐ Recommendation</h3>

      {data.recommendations.slice(0, 3).map((rec: any, i: number) => (
        <div
          key={i}
          className="flex items-start gap-3 mb-2 last:mb-0 bg-white p-3 rounded-lg border border-orange-100"
        >
          <div className={`px-2 py-1 rounded-full text-sm font-bold ${getScoreColor(rec.matchScore || 0)}`}>
            {rec.matchScore || 0}%
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{rec.title}</p>
            {rec.reason && (
              <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
            )}
          </div>
        </div>
      ))}

      {data.recommendations.length > 3 && (
        <p className="text-xs text-gray-500 mt-3">
          +{data.recommendations.length - 3} more recommendations
        </p>
      )}
    </div>
  );
}
