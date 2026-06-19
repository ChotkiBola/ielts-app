import "./globals.css";

export const metadata = {
  title: "IELTS Writing Coach",
  description: "AI band scoring and feedback for IELTS Writing Task 2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
