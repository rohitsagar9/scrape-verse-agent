import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), '..', 'heal', 'playbook.json');
  try {
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : {};
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch {
    res.status(200).json({});
  }
}
