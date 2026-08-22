import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        {/*
          THESIS: Linear/Vercel mission board — giant status, Studio ticker, dual-signal cascade.
          OWN-WORLD: Deep navy #070B14, acid #C6FF4A, Inter + JetBrains Mono, hairline borders.
          STORY: Overnight scrapers die silently; HealPipe heals via Bright Data Studio and remembers.
          FIRST VIEWPORT: Giant NOMINAL pill, headline, create/run/heal/approve strip, Run heal.
          FORM: User-pinned Linear × Vercel × mission control
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
