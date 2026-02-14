import "./globals.css";

export const metadata = {
  title: "Employment Risk Assessment | Workforce.ai",
  description: "AI-powered employment risk analysis using workforce intelligence data",
  openGraph: {
    title: "Employment Risk Assessment | Workforce.ai",
    description: "AI-powered employment risk analysis using workforce intelligence data",
    type: "website",
    url: "https://risk.workforce.ai",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
