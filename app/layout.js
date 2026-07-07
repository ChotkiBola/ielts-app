import "./globals.css";

export const metadata = {
  title: "IELTS Writing Coach — from cocoon to your target band",
  description: "AI band scoring, feedback and speaking practice for IELTS — Task 1, Task 2 & Speaking",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#241E33",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}