import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  const dataDir = path.join(process.cwd(), '..', 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      res.status(200).json([]);
      return;
    }
    const files = fs.readdirSync(dataDir)
      .filter(f => f.endsWith('.json') && f !== 'anomalies.json')
      .sort()
      .reverse();

    const snapshots = files.map(f => {
      const date = f.replace('.json', '');
      try {
        const items = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
        return { date, items: Array.isArray(items) ? items.length : 1 };
      } catch {
        return { date, items: 0 };
      }
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(snapshots);
  } catch {
    res.status(200).json([]);
  }
}
