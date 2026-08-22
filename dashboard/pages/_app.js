import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="HealPipe — self-healing nightly scrapers. Bright Data Scraper Studio create/run/heal/approve plus dual-signal fingerprinting. No humans at 3am."
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23C6FF4A'/><path d='M6 17h6l3-6 3 10 2-4h5' stroke='%2308100A' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>"
        />
        <title>HealPipe</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
