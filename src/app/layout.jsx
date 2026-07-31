import "./globals.scss";
import { AuthProvider } from "@/context/AuthContext";
import GlobalImageFallback from "@/components/common/GlobalImageFallback";

export const metadata = {
  title: "AetherFrame AI - Cinematic Intelligence",
  description: "Turn any idea into stunning images in seconds with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <GlobalImageFallback />
      </body>
    </html>
  );
}