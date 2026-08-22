/**
 * Shared chrome — Linear/Vercel command bar + mission-control ticker.
 */
import Link from 'next/link';
import Head from 'next/head';
import { useSSE } from '../lib/sse';

const NAV = [
  { href: '/', label: 'Mission', key: 'overview' },
  { href: '/incident', label: 'Incidents', key: 'incident' },
  { href: '/playbook', label: 'Playbook', key: 'playbook' },
  { href: '/data', label: 'Extract', key: 'data' },
];

const DEFAULT_TICKER = [
  '★ WEMAKEDEVS (Featured) · Devpost · Unstop · HackerEarth · Devfolio',
  'bdata scraper create · Collector ID c_wemakedevs_scraper issued',
  'bdata scraper run · nightly 03:00 UTC',
  'fingerprint SHA-256 · dual-signal gate',
  'bdata scraper heal · Stage 2 LLM inside Studio',
  'bdata scraper approve · same collector, never recreated',
  'playbook hit · ~1.8s remap, skip 15min heal',
];

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#00FF88" stroke="#0E131F" strokeWidth="2" />
      <path d="M5 15h5l3-6 3 9 2-3h5" fill="none" stroke="#0E131F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppShell({
  active,
  title,
  description,
  children,
  action,
  rail,
  tickerItems,
}) {
  const { connected } = useSSE();
  const items = tickerItems?.length ? tickerItems : DEFAULT_TICKER;
  const loop = [...items, ...items];

  return (
    <>
      <Head>
        <title>{title ? `${title} — HealPipe` : 'HealPipe'}</title>
        {description ? <meta name="description" content={description} /> : null}
      </Head>

      <div className={`layout${rail ? ' has-rail' : ''}`}>
        <header className="topbar" role="banner">
          <div className="topbar-brand">
            <div className="topbar-logo">
              <Mark />
            </div>
            <div>
              <div className="topbar-title">HEALPIPE // SCADA COMMAND</div>
              <div className="topbar-sub">DOM Skeleton Fingerprint · Bright Data Studio</div>
            </div>
          </div>

          <nav className="topnav" aria-label="Primary navigation">
            {NAV.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={`topnav-link${active === l.key ? ' active' : ''}`}
                aria-current={active === l.key ? 'page' : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="topbar-actions">
            <div className={`live-chip${connected ? ' on' : ''}`}>
              <span className="signal-dot" aria-hidden="true" />
              {connected ? 'LIVE SSE' : 'FILE POLL'}
            </div>
            {action}
          </div>
        </header>

        <div className="ticker" aria-hidden="true">
          <div className="ticker-label">STUDIO</div>
          <div className="ticker-viewport">
            <div className="ticker-track">
              {loop.map((t, i) => (
                <span className="ticker-item" key={i}>
                  <strong>▸</strong> {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {rail}

        <main className="main-panel" id="main-content" role="main">
          {children}
        </main>
      </div>
    </>
  );
}
