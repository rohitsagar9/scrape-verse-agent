import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    return;
  }
  const filePath = path.join(process.cwd(), '..', 'data', `${date}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: 'Failed to read snapshot' });
  }
}
