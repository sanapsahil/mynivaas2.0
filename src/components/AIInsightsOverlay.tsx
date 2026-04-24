"use client";

import { useState } from "react";
import { Property } from "@/lib/serpapi";
import PropertyDetailPanel from "@/components/PropertyDetailPanel";

interface AIInsightsOverlayProps {
  isOpen: boolean;
  property: Property | null;
  onClose: () => void;
}

export default function AIInsightsOverlay({
  isOpen,
  property,
  onClose,
}: AIInsightsOverlayProps) {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl max-h-[90vh] overflow-y-auto w-full mx-4"
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        {/* Close Button */}
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-4">
          <h2 className="text-2xl font-bold">Property Details & AI Insights</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <PropertyDetailPanel property={property} isVisible={true} />
        </div>

        <style jsx>{`
          @keyframes slideUp {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
