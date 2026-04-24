"use client";

interface PriceExplanationCardProps {
  data: any;
  loading: boolean;
  error?: string | null;
}

export default function PriceExplanationCard({
  data,
  loading,
  error,
}: PriceExplanationCardProps) {
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
          <span className="text-gray-600">Analyzing price factors...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">💰 Why This Price?</h3>

      {/* Main Reason */}
      {data.reason && (
        <div className="mb-4 pb-4 border-b border-blue-200">
          <p className="text-gray-800">{data.reason}</p>
        </div>
      )}

      {/* Factors */}
      {data.factors && data.factors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Key Factors:</h4>
          <div className="space-y-2">
            {data.factors.map((factor: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white p-3 rounded-lg"
              >
                <span className="text-blue-500 font-bold">•</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{factor.name}</p>
                  {factor.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {factor.description}
                    </p>
                  )}
                  {factor.impact && (
                    <p className="text-xs text-gray-500 mt-1">
                      Impact: <strong>{factor.impact}</strong>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
