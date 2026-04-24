"use client";

import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/lib/serpapi";

interface PropertyCardWithAIProps {
  property: Property;
  index: number;
  onAIClick?: (property: Property) => void;
}

export default function PropertyCardWithAI({
  property,
  index,
  onAIClick,
}: PropertyCardWithAIProps) {
  return (
    <div className="group relative">
      <PropertyCard property={property} index={index} />
      
      {/* AI Insights Button */}
      {onAIClick && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAIClick(property);
          }}
          className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors opacity-0 group-hover:opacity-100"
        >
          🤖 AI Insights
        </button>
      )}
    </div>
  );
}
