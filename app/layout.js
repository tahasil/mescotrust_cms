import "./globals.css";
import PublicSiteWrapper from "@/components/layout/PublicSiteWrapper";

export const metadata = {
  title: "Mesco Trust CMS",
  description: "Content management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PublicSiteWrapper>{children}</PublicSiteWrapper>
      </body>
    </html>
  );
}
