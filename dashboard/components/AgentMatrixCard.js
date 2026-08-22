/**
 * components/AgentMatrixCard.js
 * ------------------------------
 * Coding Agent Execution Matrix Card.
 * Visualizes how coding agents (Antigravity / Claude / Cursor)
 * drive Scraper Studio via the Bright Data CLI (`bdata`).
 */

export default function AgentMatrixCard() {
  const COMMANDS = [
    {
      agent: 'Agentic CI Driver',
      toolCall: 'run_command("npx -p @brightdata/cli bdata scraper run c_wemakedevs_scraper")',
      status: 'EXIT 0',
      timing: '1.2s',
      result: '30 valid WeMakeDevs events received',
    },
    {
      agent: 'Sensing Subagent',
      toolCall: 'fingerprint_check("sha256(DOM_skeleton)")',
      status: 'DRIFT DETECTED',
      timing: '0.4s',
      result: 'Δ hash mismatched on field "prize_pool"',
    },
    {
      agent: 'Heal Agent',
      toolCall: 'run_command("npx -p @brightdata/cli bdata scraper heal c_wemakedevs_scraper \\"prize_pool null\\"")',
      status: 'DRAFT CREATED',
      timing: '15m (Stage 2 LLM)',
      result: 'Refactored CSS selector map generated',
    },
    {
      agent: 'Approval Agent',
      toolCall: 'run_command("npx -p @brightdata/cli bdata scraper approve c_wemakedevs_scraper")',
      status: 'APPROVED',
      timing: '0.8s',
      result: 'Draft promoted under same Collector ID',
    },
  ];

  return (
    <div className="card mb-5" style={{ padding: 0, overflow: 'hidden', background: '#090D1A', border: 'var(--border-thick)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '2.5px solid #0E131F', background: '#060A12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="section-title" style={{ margin: 0, color: 'var(--acid)', fontSize: '1.15rem' }}>
            Coding Agent CLI Driver Matrix
          </div>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--mono)', color: '#A0AEC0', marginTop: 2 }}>
            How AI agents programmatically invoke Scraper Studio CLI commands (`npx -p @brightdata/cli bdata`)
          </div>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>
          AGENT CONTROLLED
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ background: '#090D1A', color: '#FFFFFF', margin: 0, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ background: '#060A12', color: '#718096', padding: '10px 14px' }}>Agent Role</th>
              <th style={{ background: '#060A12', color: '#718096', padding: '10px 14px' }}>CLI Tool Call</th>
              <th style={{ background: '#060A12', color: '#718096', padding: '10px 14px' }}>Status</th>
              <th style={{ background: '#060A12', color: '#718096', padding: '10px 14px' }}>Latency</th>
            </tr>
          </thead>
          <tbody>
            {COMMANDS.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1E293B', background: '#090D1A' }}>
                <td className="text-mono" style={{ color: 'var(--acid)', fontWeight: 700, fontSize: '0.74rem', padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  {c.agent}
                </td>
                <td style={{ padding: '8px 14px' }}>
                  <code style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: '#A7F3D0', background: '#040710', border: '1px solid #1E293B', borderRadius: 4, padding: '4px 8px', display: 'inline-block', wordBreak: 'break-all' }}>
                    {c.toolCall}
                  </code>
                </td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  <span className={`badge ${c.status === 'APPROVED' || c.status === 'EXIT 0' ? 'badge-ok' : 'badge-heal'}`} style={{ fontSize: '0.58rem' }}>
                    {c.status}
                  </span>
                </td>
                <td className="text-mono" style={{ fontSize: '0.7rem', color: '#A0AEC0', padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  {c.timing}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
