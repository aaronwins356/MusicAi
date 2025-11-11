import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Singing Object Studio - AI Music Lab",
  description: "Design, customize, and perform with AI-generated singing personalities for inanimate objects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
