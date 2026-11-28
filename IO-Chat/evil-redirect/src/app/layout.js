import "./globals.css";

export const metadata = {
  title: "I/O CHAT",
  description: "A real-time chat application built with Next.js, Socket.IO, and Tailwind CSS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
