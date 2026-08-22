/**
 * components/IncidentStepper.js
 * ------------------------------
 * Shows the cascade stages as a vertical stepper.
 * Each stage lights up as the pipeline progresses (via SSE events or static data).
 *
 * stages: [{
 *   id: 'playbook' | 'heuristic' | 'llm' | 'escalated',
 *   label: string,
 *   detail: string,
 *   status: 'done' | 'active' | 'fail' | 'skip' | 'pending'
 * }]
 */

const STAGE_NUMS = { playbook: '0', heuristic: '1', llm: '2', escalated: '3' };
const STAGE_LABELS = {
  playbook:   'Stage 0 — Playbook Lookup',
  heuristic:  'Stage 1 — Heuristic Remap',
  llm:        'Stage 2 — LLM Heal (bdata scraper heal)',
  escalated:  'Stage 3 — Escalate & Manual Review',
};
const STAGE_DESCS = {
  playbook:  'Check if this exact hash transition was healed before. If yes, re-apply stored selector map instantly.',
  heuristic: 'Score sibling/cousin elements against field type expectations. Adopt if confidence ≥ 0.85.',
  llm:       'Run npx -p @brightdata/cli bdata scraper heal with the incident context. Validate preview before approving.',
  escalated: 'All automated stages failed. Roll back to last good baseline. Open PR for manual review.',
};

function statusIcon(status) {
  if (status === 'done')    return '✓';
  if (status === 'active')  return '◉';
  if (status === 'fail')    return '✕';
  if (status === 'skip')    return '·';
  return '○';
}

export default function IncidentStepper({ activeStage, outcome }) {
  // Determine status of each stage from activeStage + outcome
  const stageOrder = ['playbook', 'heuristic', 'llm', 'escalated'];
  const activeIdx = stageOrder.indexOf(activeStage);

  const stages = stageOrder.map((id, idx) => {
    let status = 'pending';
    if (idx < activeIdx) status = 'skip';    // tried but escalated past
    if (idx === activeIdx) {
      if (outcome === 'healed')    status = 'done';
      else if (outcome === 'escalated' && id === 'escalated') status = 'fail';
      else status = 'active';
    }
    return { id, status };
  });

  return (
    <div className="stepper" aria-label="Heal cascade stages">
      {stages.map(({ id, status }) => (
        <div className="step" key={id}>
          <div className={`step-icon ${status}`}>
            {statusIcon(status)}
          </div>
          <div className="step-body">
            <div className="step-title" style={{
              color: status === 'done'   ? 'var(--teal)'
                   : status === 'active' ? 'var(--amber)'
                   : status === 'fail'   ? 'var(--coral)'
                   : status === 'skip'   ? 'var(--text-muted)'
                   : 'var(--text-faint)',
            }}>
              {STAGE_LABELS[id]}
            </div>
            <div className="step-detail">{STAGE_DESCS[id]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
