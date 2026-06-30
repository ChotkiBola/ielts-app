import "./globals.css";

export const metadata = {
  title: "IELTS Writing Coach",
  description: "AI band scoring and feedback for IELTS Writing — Task 1 & 2",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16203A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}