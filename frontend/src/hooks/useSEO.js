import { useEffect } from "react";
import { SEO_METADATA } from "../utils/constants";

export const useSEO = (pageTitle, pageDescription, pageImage) => {
  useEffect(() => {
    const title = pageTitle
      ? `${pageTitle} | ${SEO_METADATA.name}`
      : SEO_METADATA.name;
    const description = pageDescription || SEO_METADATA.description;
    const image = pageImage || SEO_METADATA.ogImage;

    // Set document title
    document.title = title;

    // Basic meta tags
    setMetaTag("description", description);

    // Check if keywords exists before calling join()
    if (SEO_METADATA.keywords && Array.isArray(SEO_METADATA.keywords)) {
      setMetaTag("keywords", SEO_METADATA.keywords.join(", "));
    }

    setMetaTag("author", SEO_METADATA.company?.name || SEO_METADATA.name);

    // Open Graph (Facebook, LinkedIn, Pinterest, etc.)
    setMetaTag("og:title", title, "property");
    setMetaTag("og:description", description, "property");
    setMetaTag("og:image", image, "property");
    setMetaTag("og:url", window.location.href, "property");
    setMetaTag("og:type", "website", "property");
    setMetaTag("og:site_name", SEO_METADATA.name, "property");
    setMetaTag("og:locale", "en_US", "property");

    // Twitter Card
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", image);
    setMetaTag("twitter:creator", SEO_METADATA.social?.twitter || "");
    setMetaTag("twitter:site", SEO_METADATA.social?.twitter || "");

    // LinkedIn Specific
    setMetaTag("linkedin:owner", SEO_METADATA.social?.linkedin || "");

    // Additional platforms
    setMetaTag(
      "article:author",
      SEO_METADATA.company?.name || SEO_METADATA.name
    );
    setMetaTag("article:publisher", SEO_METADATA.company?.website || "");

    // Image dimensions for better sharing
    setMetaTag("og:image:width", "1200");
    setMetaTag("og:image:height", "630");
    setMetaTag(
      "og:image:alt",
      SEO_METADATA.ogImageAlt || SEO_METADATA.description
    );

    // Structured Data for Google (JSON-LD)
    injectStructuredData(title, description, image);
  }, [pageTitle, pageDescription, pageImage]);
};

// Helper function to set meta tags
const setMetaTag = (name, content, attribute = "name") => {
  if (!content) return;

  let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!metaTag) {
    metaTag = document.createElement("meta");
    metaTag.setAttribute(attribute, name);
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute("content", content);
};

// Inject JSON-LD structured data for Google
const injectStructuredData = (title, description, image) => {
  // Remove existing structured data
  const existingScript = document.getElementById("structured-data");
  if (existingScript) {
    existingScript.remove();
  }

  const structuredData = {
    // FIXED: Correct variable name
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_METADATA.company?.name || SEO_METADATA.name,
    description: description,
    url: SEO_METADATA.company?.website || window.location.href,
    logo: image,
    email: SEO_METADATA.company?.email || "",
    telephone: SEO_METADATA.company?.phone || "",
    sameAs: SEO_METADATA.socialUrls
      ? Object.values(SEO_METADATA.socialUrls)
      : [],
    contactPoint: {
      "@type": "ContactPoint",
      email: SEO_METADATA.company?.email || "",
      contactType: "Customer Service",
    },
  };

  const script = document.createElement("script");
  script.id = "structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(structuredData); // FIXED: Correct variable name
  document.head.appendChild(script);
};
