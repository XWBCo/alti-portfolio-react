// Simple JSON file-based ESG database for MVP
// In production, migrate to SQLite or PostgreSQL

import { promises as fs } from 'fs';
import path from 'path';
import type { ESGDatabase, ESGScore, Relationship } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'esg');
const DB_FILE = path.join(DATA_DIR, 'esg-database.json');
const ISIN_SCORES_FILE = path.join(DATA_DIR, 'isin-scores.json');
const CUSIP_SCORES_FILE = path.join(DATA_DIR, 'cusip-scores.json');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

export async function loadDatabase(): Promise<ESGDatabase> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Return empty database
    return {
      relationships: {},
      entities: {},
      holdings: [],
      esgScores: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function saveDatabase(db: ESGDatabase): Promise<void> {
  await ensureDataDir();
  db.lastUpdated = new Date().toISOString();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

export async function loadESGScores(): Promise<{
  isinScores: Map<string, ESGScore>;
  cusipScores: Map<string, ESGScore>;
}> {
  await ensureDataDir();

  const isinScores = new Map<string, ESGScore>();
  const cusipScores = new Map<string, ESGScore>();

  try {
    const isinData = await fs.readFile(ISIN_SCORES_FILE, 'utf-8');
    const isinArray: ESGScore[] = JSON.parse(isinData);
    for (const score of isinArray) {
      if (score.isin) isinScores.set(score.isin, score);
    }
  } catch {
    // File doesn't exist yet
  }

  try {
    const cusipData = await fs.readFile(CUSIP_SCORES_FILE, 'utf-8');
    const cusipArray: ESGScore[] = JSON.parse(cusipData);
    for (const score of cusipArray) {
      if (score.cusip) cusipScores.set(score.cusip, score);
    }
  } catch {
    // File doesn't exist yet
  }

  return { isinScores, cusipScores };
}

export async function saveESGScores(
  isinScores: ESGScore[],
  cusipScores: ESGScore[]
): Promise<void> {
  await ensureDataDir();

  await Promise.all([
    fs.writeFile(ISIN_SCORES_FILE, JSON.stringify(isinScores, null, 2)),
    fs.writeFile(CUSIP_SCORES_FILE, JSON.stringify(cusipScores, null, 2)),
  ]);
}

export async function getRelationship(id: string): Promise<Relationship | null> {
  const db = await loadDatabase();
  return db.relationships[id] || null;
}

export async function saveRelationship(relationship: Relationship): Promise<void> {
  const db = await loadDatabase();
  db.relationships[relationship.id] = relationship;
  await saveDatabase(db);
}

export async function getAllRelationships(): Promise<Relationship[]> {
  const db = await loadDatabase();
  return Object.values(db.relationships);
}

// Import ESG scores from CSV files (for bootstrapping from /tmp cache)
export async function importESGScoresFromCSV(
  isinCsvPath: string,
  cusipCsvPath: string
): Promise<{ isinCount: number; cusipCount: number }> {
  const isinScores: ESGScore[] = [];
  const cusipScores: ESGScore[] = [];

  // Parse ISIN CSV
  try {
    const isinCsv = await fs.readFile(isinCsvPath, 'utf-8');
    const lines = isinCsv.trim().split('\n');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const isin = cols[0];
      if (!isin) continue;

      const govScore = parseFloat(cols[1]) || null;
      const envScore = parseFloat(cols[4]) || null;
      const socScore = parseFloat(cols[7]) || null;

      if (govScore || envScore || socScore) {
        const validScores = [govScore, envScore, socScore].filter(s => s !== null) as number[];
        const overall = validScores.length > 0
          ? validScores.reduce((a, b) => a + b, 0) / validScores.length
          : null;

        isinScores.push({
          isin,
          governanceScore: govScore,
          environmentalScore: envScore,
          socialScore: socScore,
          overallScore: overall,
        });
      }
    }
  } catch (e) {
    console.error('Error importing ISIN CSV:', e);
  }

  // Parse CUSIP CSV
  try {
    const cusipCsv = await fs.readFile(cusipCsvPath, 'utf-8');
    const lines = cusipCsv.trim().split('\n');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const cusip = cols[0];
      if (!cusip) continue;

      const govScore = parseFloat(cols[1]) || null;
      const envScore = parseFloat(cols[4]) || null;
      const socScore = parseFloat(cols[7]) || null;

      if (govScore || envScore || socScore) {
        const validScores = [govScore, envScore, socScore].filter(s => s !== null) as number[];
        const overall = validScores.length > 0
          ? validScores.reduce((a, b) => a + b, 0) / validScores.length
          : null;

        cusipScores.push({
          cusip,
          governanceScore: govScore,
          environmentalScore: envScore,
          socialScore: socScore,
          overallScore: overall,
        });
      }
    }
  } catch (e) {
    console.error('Error importing CUSIP CSV:', e);
  }

  await saveESGScores(isinScores, cusipScores);

  return {
    isinCount: isinScores.length,
    cusipCount: cusipScores.length,
  };
}
