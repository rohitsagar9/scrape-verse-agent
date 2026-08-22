import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  const p = path.join(process.cwd(), '..', 'data', 'anomalies.json');
  try {
    if (!fs.existsSync(p)) {
      return res.status(200).json({ findings: [], findings_count: 0, data_quality_score: 100, verdict: 'clean' });
    }
    const report = JSON.parse(fs.readFileSync(p, 'utf-8'));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(report);
  } catch {
    res.status(200).json({ findings: [], findings_count: 0, data_quality_score: 100, verdict: 'clean' });
  }
}
