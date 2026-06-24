import { Helmet } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";

const BASE_URL = "https://kraitin.com";
const DEFAULT_OG = `${BASE_URL}/og-image.png`;

const PageMeta = ({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG,
  ogUrl,
  twitterCard = "summary_large_image",
  noIndex = false,
}: {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image";
  noIndex?: boolean;
}) => {
  const resolvedTitle = title.includes("Kraitin") ? title : `${title} — Kraitin`;
  const resolvedOgTitle = ogTitle ?? resolvedTitle;
  const resolvedOgDesc  = ogDescription ?? description;
  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title"       content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:image"       content={ogImage} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content="Kraitin" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content={twitterCard} />
      <meta name="twitter:site"        content="@kraitin" />
      <meta name="twitter:title"       content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image"       content={ogImage} />
    </Helmet>
  );
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <TooltipProvider>
      {children}
    </TooltipProvider>
  </HelmetProvider>
);

export default PageMeta;
