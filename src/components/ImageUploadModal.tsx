"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const listingTypes = [
  { value: "buy", label: "Buy", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { value: "rent", label: "Rent", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { value: "pg", label: "PG", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

export default function ImageUploadModal({ isOpen, onClose }: ImageUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listingType, setListingType] = useState("rent");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP, etc.)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Submit search
  const handleSearch = async () => {
    if (!selectedImage) {
      setError("Please select an image");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      console.log(`Searching for similar ${listingType} properties...`);

      const response = await fetch(`/api/search-similar?topK=30&threshold=0.45&listingType=${listingType}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Search returned no results");
      }

      // Store results in sessionStorage for results page
      sessionStorage.setItem(
        "imageSearchResults",
        JSON.stringify({
          results: data.results,
          stats: data.stats,
          listingType: listingType,
          timestamp: Date.now(),
        })
      );

      // Redirect to results page
      router.push("/results/image-search");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search similar properties";
      setError(errorMessage);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setPreview(null);
    setError(null);
    setDragActive(false);
    setListingType("rent");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-white">Find Similar Properties</h2>
              <p className="text-blue-100 text-sm mt-1">
                Upload a room photo you like, we'll find properties with similar aesthetics
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-blue-800 rounded-lg p-2 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Listing Type Tabs */}
            <div className="flex justify-center gap-4 flex-wrap mb-6">
              {listingTypes.map((lt) => (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => setListingType(lt.value)}
                  className={`flex items-center gap-2 rounded-2xl text-base font-bold transition-all cursor-pointer ${
                    listingType === lt.value
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-2xl shadow-blue-600/30"
                      : "bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-100 hover:border-blue-300"
                  }`}
                  style={{
                    padding: "12px 28px",
                    transform: listingType === lt.value ? "translateY(-2px)" : "none",
                    boxShadow: listingType === lt.value ? "0 8px 20px rgba(37,99,235,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={lt.icon} />
                  </svg>
                  {lt.label}
                </button>
              ))}
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {!preview ? (
                <>
                  <div className="text-4xl mb-4">🖼️</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Upload a Room Photo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your image here, or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Choose File
                  </button>
                  <p className="text-xs text-gray-500 mt-4">
                    Supports JPG, PNG, WebP • Max 10MB
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 font-medium">
                      {selectedImage?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedImage?.size || 0) / 1024 < 1024
                        ? `${Math.round((selectedImage?.size || 0) / 1024)} KB`
                        : `${((selectedImage?.size || 0) / (1024 * 1024)).toFixed(2)} MB`}
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Choose Different Image
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">❌ {error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Upload a living room, bedroom, kitchen, or any
                interior space photo. Our AI will find properties with similar aesthetics,
                layouts, and style.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                disabled={!selectedImage || isLoading}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition text-white ${
                  !selectedImage || isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⟳</span>
                    Searching...
                  </span>
                ) : (
                  "Find Similar Properties"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
