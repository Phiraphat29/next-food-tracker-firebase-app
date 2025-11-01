import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Food Tracker App",
  description: "Created by Phiraphat29 SAU",
  keywords: ["Food", "Tracker", "Health", "อาหาร", "ติดตาม", "สุขภาพ"],
  icons: {
    icon: "/favicon.ico",
  },
  authors: [{ name: "Phiraphat29 SAU", url: "https://github.com/Phiraphat29" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${prompt.className} antialiased`}>{children}</body>
    </html>
  );
}
