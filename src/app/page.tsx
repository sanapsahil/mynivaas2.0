"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import ImageUploadModal from "@/components/ImageUploadModal";

export default function Home() {
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden"
          style={{
            paddingTop: "80px",
            paddingBottom: "100px",
            background: "linear-gradient(135deg, rgba(15,118,110,0.04) 0%, #ffffff 50%, rgba(245,158,11,0.04) 100%)",
          }}
        >
          {/* Background Decoration */}
          <div
            className="absolute rounded-full"
            style={{
              width: "300px",
              height: "300px",
              top: "40px",
              left: "-50px",
              background: "rgba(15,118,110,0.04)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "400px",
              height: "400px",
              bottom: "-50px",
              right: "-50px",
              background: "rgba(245,158,11,0.04)",
              filter: "blur(60px)",
            }}
          />

          <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
            <div className="text-center w-full" style={{ marginBottom: "56px" }}>
              <div
                className="inline-flex items-center justify-center gap-2 text-primary text-sm font-medium rounded-full animate-fade-in-up"
                style={{
                  padding: "8px 16px",
                  marginBottom: "32px",
                  background: "rgba(15,118,110,0.1)",
                  border: "1px solid rgba(15,118,110,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Smart property comparison powered by AI
              </div>

              <h1
                className="font-extrabold text-text leading-tight text-center w-full"
                style={{ 
                  fontSize: "clamp(40px, 6vw, 68px)", 
                  marginBottom: "28px",
                  letterSpacing: "-0.02em",
                  animation: "fadeInUp 0.6s ease-out 0.1s both",
                }}
              >
                Find Your Perfect{" "}
                <span 
                  className="text-primary"
                  style={{
                    background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Property Deal
                </span>
              </h1>

              <p
                className="text-text-muted mx-auto text-center w-full"
                style={{ 
                  fontSize: "18px", 
                  maxWidth: "640px", 
                  lineHeight: "1.8", 
                  marginBottom: "56px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  animation: "fadeInUp 0.6s ease-out 0.2s both",
                }}
              >
                Search across 99acres, MagicBricks, Housing.com, NoBroker and more. Get location intelligence, 
                property condition scores, and find properties matching your aesthetic.
              </p>
            </div>

            <div className="w-full flex justify-center" style={{ animation: "fadeInUp 0.6s ease-out 0.3s both", marginBottom: "48px" }}>
              <SearchForm />
            </div>

            {/* Image Search CTA */}
            <div className="w-full text-center -mx-6 lg:-mx-8 px-6 lg:px-8" style={{ animation: "fadeInUp 0.6s ease-out 0.4s both", marginTop: "0" }}>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border max-w-[100px]"></div>
                <p className="text-text-muted text-xs font-semibold whitespace-nowrap tracking-wider">OR TRY A DIFFERENT APPROACH</p>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border max-w-[100px]"></div>
              </div>
              <button
                onClick={() => setIsImageSearchOpen(true)}
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold transition-all border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-lg hover:-translate-y-1"
                style={{
                  backdropFilter: "blur(10px)",
                  background: "rgba(255, 255, 255, 0.5)",
                }}
              >
                <span className="text-2xl">🖼️</span>
                <span>Search by Room Photo</span>
              </button>
              <p className="text-text-muted text-xs mt-3">
                Upload a room photo and find properties with similar aesthetics & layout
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-white" style={{ padding: "80px 0" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center" style={{ marginBottom: "56px" }}>
              <h2
                className="font-bold text-text"
                style={{ fontSize: "30px", marginBottom: "12px" }}
              >
                How It Works
              </h2>
              <p className="text-text-muted" style={{ fontSize: "18px" }}>
                Three simple steps to find your best deal
              </p>
            </div>

            <div className="grid md:grid-cols-3" style={{ gap: "32px" }}>
              {[
                {
                  step: "1",
                  title: "Enter Your Criteria",
                  description:
                    "Specify your location, property type (apartment, house, PG), and whether you want to buy or rent.",
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                },
                {
                  step: "2",
                  title: "Compare Prices",
                  description:
                    "We search across multiple real estate platforms and show you all matching listings sorted by price.",
                  icon: "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4",
                },
                {
                  step: "3",
                  title: "Visit the Best Deal",
                  description:
                    "Click on any listing to go directly to the original website and proceed with your booking or inquiry.",
                  icon: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="text-center bg-surface hover:bg-surface-dark transition-colors group"
                  style={{ padding: "40px 32px", borderRadius: "20px" }}
                >
                  <div
                    className="flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "16px",
                      marginBottom: "24px",
                      background: "rgba(15,118,110,0.08)",
                    }}
                  >
                    <svg
                      className="text-primary"
                      style={{ width: "28px", height: "28px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                  </div>
                  <div
                    className="text-primary font-bold"
                    style={{ fontSize: "12px", marginBottom: "8px", letterSpacing: "0.05em" }}
                  >
                    STEP {item.step}
                  </div>
                  <h3
                    className="font-semibold text-text"
                    style={{ fontSize: "18px", marginBottom: "10px" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-text-muted"
                    style={{ fontSize: "14px", lineHeight: "1.7" }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms Section */}
        <section className="bg-surface" style={{ padding: "64px 0" }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2
              className="font-bold text-text"
              style={{ fontSize: "24px", marginBottom: "12px" }}
            >
              We Search Across Top Platforms
            </h2>
            <p
              className="text-text-muted"
              style={{ marginBottom: "40px" }}
            >
              Listings aggregated from major real estate websites
            </p>
            <div className="flex flex-wrap justify-center" style={{ gap: "16px" }}>
              {[
                "99acres",
                "MagicBricks",
                "Housing.com",
                "NoBroker",
                "Zillow",
                "Square Yards",
                "Makaan",
                "CommonFloor",
              ].map((platform) => (
                <div
                  key={platform}
                  className="bg-white border border-border text-sm font-medium text-text-muted hover:text-primary hover:border-primary transition-colors"
                  style={{ padding: "12px 24px", borderRadius: "12px" }}
                >
                  {platform}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Image Search Modal */}
      <ImageUploadModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
      />
    </div>
  );
}
