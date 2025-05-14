import React from 'react';

interface OrganizationProps {
  url?: string;
  logo?: string;
  name?: string;
}

interface WebsiteProps {
  url?: string;
  name?: string;
}

export const OrganizationJsonLd = ({
  url = "https://akunpro.com",
  logo = "https://akunpro.com/logo.png",
  name = "AkunPro"
}: OrganizationProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    "logo": logo,
    "sameAs": [
      "https://www.facebook.com/akunpro",
      "https://www.instagram.com/akunpro_official",
      "https://twitter.com/akunpro"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+62-xxx-xxx-xxxx",
      "contactType": "customer service",
      "availableLanguage": ["Indonesian", "English"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export const WebsiteJsonLd = ({
  url = "https://akunpro.com",
  name = "AkunPro - Marketplace Akun Premium"
}: WebsiteProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": url,
    "name": name,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export const ProductJsonLd = ({ 
  name, 
  description, 
  image, 
  price, 
  currency = "IDR",
  sku,
  brand = "AkunPro",
  availability = "https://schema.org/InStock"
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku: string;
  brand?: string;
  availability?: string;
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": image,
    "sku": sku,
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "offers": {
      "@type": "Offer",
      "url": "https://akunpro.com/product/" + sku,
      "priceCurrency": currency,
      "price": price,
      "availability": availability
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}; 