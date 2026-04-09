"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageUploadModal({ isOpen, onClose }: ImageUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      console.log("Searching for similar properties...");

      const response = await fetch("/api/search-similar?topK=30&threshold=0.45", {
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
