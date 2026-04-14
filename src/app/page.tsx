"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import ImageUploadModal from "@/components/ImageUploadModal";

export default function Home() {
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-blue-50/30 to-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden"
          style={{
            paddingTop: "100px",
            paddingBottom: "120px",
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(15,118,110,0.02) 50%, rgba(245,158,11,0.02) 100%)",
          }}
        >
          {/* Background Decoration */}
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              width: "500px",
              height: "500px",
              top: "-100px",
              left: "-150px",
              background: "linear-gradient(135deg, rgba(15,118,110,0.08) 0%, rgba(20,184,166,0.04) 100%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute rounded-full blur-3xl"
            style={{
              width: "600px",
              height: "600px",
              bottom: "-150px",
              right: "-100px",
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,146,60,0.04) 100%)",
              filter: "blur(80px)",
            }}
          />

          <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
            <div className="text-center w-full" style={{ marginBottom: "64px" }}>
              <div
                className="inline-flex items-center justify-center gap-2 text-primary text-sm font-semibold rounded-full animate-fade-in-up"
                style={{
                  padding: "10px 20px",
                  marginBottom: "40px",
                  background: "linear-gradient(135deg, rgba(15,118,110,0.15) 0%, rgba(20,184,166,0.05) 100%)",
                  border: "1.5px solid rgba(15,118,110,0.25)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 8px 32px rgba(15,118,110,0.08)",
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                ✨ Smart property comparison powered by AI
              </div>

              <h1
                className="font-black text-text leading-tight text-center w-full"
                style={{ 
                  fontSize: "clamp(44px, 7vw, 72px)", 
                  marginBottom: "32px",
                  letterSpacing: "-0.03em",
                  animation: "fadeInUp 0.6s ease-out 0.1s both",
                  lineHeight: "1.2",
                }}
              >
                Find Your Perfect{" "}
                <span 
                  className="text-primary"
                  style={{
                    background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #06b6d4 100%)",
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
                  fontSize: "19px", 
                  maxWidth: "700px", 
                  lineHeight: "1.9", 
                  marginBottom: "64px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  animation: "fadeInUp 0.6s ease-out 0.2s both",
                  fontWeight: "500",
                }}
              >
                Search across 99acres, MagicBricks, Housing.com, NoBroker and more. Get location intelligence, 
                property condition scores, and find properties matching your aesthetic.
              </p>
            </div>

            <div className="w-full flex flex-col items-center gap-8">
              <div style={{ animation: "fadeInUp 0.6s ease-out 0.3s both", width: "100%", maxWidth: "900px", margin: "0 auto" }}>
                <SearchForm />
              </div>

              {/* Image Search CTA */}
              <div className="w-full text-center" style={{ animation: "fadeInUp 0.6s ease-out 0.4s both" }}>
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent max-w-[120px]"></div>
                  <p className="text-text-muted text-sm font-semibold whitespace-nowrap tracking-widest">OR TRY A DIFFERENT APPROACH</p>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent max-w-[120px]"></div>
                </div>
                <button
                  onClick={() => setIsImageSearchOpen(true)}
                  className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 border-2 border-primary text-primary hover:bg-gradient-to-r hover:from-primary hover:to-teal-600 hover:text-white hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1"
                  style={{
                    backdropFilter: "blur(10px)",
                    background: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <span className="text-3xl">🖼️</span>
                  <span>Search by Room Photo</span>
                </button>
                <p className="text-text-muted text-sm mt-4 font-medium">
                  Upload a room photo and find properties with similar aesthetics & layout
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-gradient-to-b from-white to-blue-50/50" style={{ padding: "100px 0" }}>
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <div
                className="inline-flex items-center justify-center gap-2 text-primary text-xs font-bold rounded-full mb-6"
                style={{
                  padding: "8px 16px",
                  background: "rgba(15,118,110,0.1)",
                  border: "1px solid rgba(15,118,110,0.2)",
                  letterSpacing: "0.05em",
                }}
              >
                HOW IT WORKS
              </div>
              <h2
                className="font-black text-text"
                style={{ fontSize: "48px", marginBottom: "16px", letterSpacing: "-0.02em" }}
              >
                Three Simple Steps
              </h2>
              <p className="text-text-muted text-xl max-w-2xl mx-auto">
                Find the best property deals with our AI-powered comparison tool
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Enter Your Criteria",
                  description:
                    "Specify your location, property type (apartment, house, PG), and whether you want to buy or rent.",
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  color: "from-blue-500/20 to-cyan-500/20",
                  border: "border-blue-500/30",
                },
                {
                  step: "2",
                  title: "Compare Prices",
                  description:
                    "We search across multiple real estate platforms and show you all matching listings sorted by price.",
                  icon: "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4",
                  color: "from-emerald-500/20 to-teal-500/20",
                  border: "border-emerald-500/30",
                },
                {
                  step: "3",
                  title: "Visit the Best Deal",
                  description:
                    "Click on any listing to go directly to the original website and proceed with your booking or inquiry.",
                  icon: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
                  color: "from-amber-500/20 to-orange-500/20",
                  border: "border-amber-500/30",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`text-center bg-gradient-to-br ${item.color} border ${item.border} hover:shadow-2xl transition-all duration-300 group`}
                  style={{ padding: "48px 36px", borderRadius: "24px", cursor: "pointer" }}
                >
                  <div
                    className="flex items-center justify-center mx-auto group-hover:scale-125 transition-transform duration-300"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "20px",
                      marginBottom: "32px",
                      background: "rgba(15,118,110,0.08)",
                      margin: "0 auto 32px",
                    }}
                  >
                    <svg
                      className="text-primary"
                      style={{ width: "40px", height: "40px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={item.icon}
                      />
                    </svg>
                  </div>
                  <div
                    className="text-primary font-bold text-xs mb-3"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    STEP {item.step}
                  </div>
                  <h3
                    className="font-bold text-text"
                    style={{ fontSize: "20px", marginBottom: "14px", letterSpacing: "-0.01em" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-text-muted"
                    style={{ fontSize: "15px", lineHeight: "1.8", fontWeight: "500" }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms Section */}
        <section className="bg-white py-24 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <h2
              className="font-black text-text"
              style={{ fontSize: "40px", marginBottom: "16px", letterSpacing: "-0.02em" }}
            >
              We Search Across Top Platforms
            </h2>
            <p
              className="text-text-muted text-lg"
              style={{ marginBottom: "56px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}
            >
              Listings aggregated from major real estate websites, all in one place
            </p>
            <div className="flex flex-wrap justify-center" style={{ gap: "20px" }}>
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
                  className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200/50 text-sm font-semibold text-text hover:text-primary hover:border-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  style={{ padding: "14px 32px", borderRadius: "14px" }}
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
