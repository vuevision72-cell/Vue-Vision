
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";
import { Providers } from "./providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zenopurevision.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Zeno Pure Vision | Clarity and Sophistication in Eyewear",
    template: "%s | Zeno Pure Vision",
  },
  description: "Discover a new standard of clarity and style with Zeno Pure Vision. Shop our curated collection of premium eyeglasses, sunglasses, screen glasses, and contact lenses. Quality eyewear for men, women, and kids.",
  keywords: ["eyeglasses", "sunglasses", "contact lenses", "blue light glasses", "prescription glasses", "buy glasses online", "Zeno Pure Vision", "eyewear", "fashion frames"],
  openGraph: {
    title: "Zeno Pure Vision | Clarity and Sophistication in Eyewear",
    description: "Shop our curated collection of premium eyeglasses, sunglasses, and contact lenses.",
    url: siteUrl,
    siteName: "Zeno Pure Vision",
    images: [
      {
        url: `${siteUrl}/og-image.png`, // Assumes you will add an og-image.png to your public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zeno Pure Vision | Clarity and Sophistoocation in Eyewear",
    description: "Discover premium eyewear with Zeno Pure Vision. Shop the latest trends in eyeglasses, sunglasses, and more.",
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'dyES5AR3wsevolfK3Go6HnTgYOpD40qjE-FHBVDKdww',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script async src="https://plausible.io/js/pa-sgZhd0NCjf2NICweL1u0x.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };
              plausible.init = plausible.init || function(i) { plausible.o = i || {} };
              plausible.init();
            `,
          }}
        />
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1860915814587731');
              fbq('track', 'PageView');
            `,
          }}
        />
        {/* End Meta Pixel Code */}
      </head>
      <body className="font-body antialiased">
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1860915814587731&ev=PageView&noscript=1"
          />
        </noscript>
        <Providers>
            <AppLayout>{children}</AppLayout>
            <Toaster />
        </Providers>
      </body>
    </html>
  );
}
