import "./globals.scss";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import GlobalImageFallback from "@/components/common/GlobalImageFallback";

export const metadata = {
  title: "dexericai - AI Image Generation",
  description: "Turn any idea into stunning images in seconds with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </AuthProvider>
        <GlobalImageFallback />
      </body>
    </html>
  );
}