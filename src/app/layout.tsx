import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstateCompare - Compare Real Estate Prices Instantly",
  description:
    "Find the best property deals across multiple real estate platforms. Compare prices for buying, renting, and PG accommodations in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
