// Clarity AI API Client for ESG Scores

import type { ESGScore } from './types';

const CLARITY_BASE_URL = process.env.CLARITY_API_BASE_URL || 'https://api.clarity.ai/clarity/v1';
const CLARITY_API_KEY = process.env.CLARITY_API_KEY || '';
const CLARITY_API_SECRET = process.env.CLARITY_API_SECRET || '';

interface ClarityToken {
  token: string;
  expiresAt: number;
}

let cachedToken: ClarityToken | null = null;

async function getToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const resp = await fetch(`${CLARITY_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: CLARITY_API_KEY, secret: CLARITY_API_SECRET }),
  });

  if (!resp.ok) {
    throw new Error(`Clarity AI auth error: ${resp.status}`);
  }

  const data = await resp.json();
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + (55 * 60 * 1000), // Cache for 55 minutes (tokens last 1 hour)
  };

  return cachedToken.token;
}

export interface ClarityJobResult {
  jobId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
}

export async function submitESGJob(
  identifiers: string[],
  identifierType: 'ISIN' | 'CUSIP'
): Promise<string> {
  const token = await getToken();

  const resp = await fetch(`${CLARITY_BASE_URL}/public/job`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifierType,
      identifiers,
      outputs: [
        'ENVIRONMENTAL.SCORE',
        'SOCIAL.SCORE',
        'GOVERNANCE.SCORE',
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Clarity AI job submit error: ${resp.status} - ${text}`);
  }

  const data = await resp.json();
  return data.uuid;
}

export async function checkJobStatus(jobId: string): Promise<ClarityJobResult> {
  const token = await getToken();

  const resp = await fetch(`${CLARITY_BASE_URL}/public/job/${jobId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!resp.ok) {
    throw new Error(`Clarity AI status error: ${resp.status}`);
  }

  const data = await resp.json();
  return {
    jobId,
    status: data.statusMessage || 'PENDING',
  };
}

export async function downloadJobResults(jobId: string): Promise<ESGScore[]> {
  const token = await getToken();

  const resp = await fetch(`${CLARITY_BASE_URL}/public/job/${jobId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!resp.ok) {
    throw new Error(`Clarity AI download error: ${resp.status}`);
  }

  const csv = await resp.text();
  return parseESGCSV(csv);
}

function parseESGCSV(csv: string): ESGScore[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',');
  const scores: ESGScore[] = [];

  // Find column indices
  const idIdx = 0; // First column is always identifier (ISIN or CUSIP)
  const govScoreIdx = header.findIndex(h => h.includes('GOVERNANCE.SCORE'));
  const envScoreIdx = header.findIndex(h => h.includes('ENVIRONMENTAL.SCORE'));
  const socScoreIdx = header.findIndex(h => h.includes('SOCIAL.SCORE'));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const identifier = cols[idIdx];

    if (!identifier) continue;

    const govScore = parseFloat(cols[govScoreIdx]) || null;
    const envScore = parseFloat(cols[envScoreIdx]) || null;
    const socScore = parseFloat(cols[socScoreIdx]) || null;

    // Calculate overall as average of available scores
    const validScores = [govScore, envScore, socScore].filter(s => s !== null) as number[];
    const overallScore = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : null;

    // Determine if ISIN or CUSIP based on format
    const isISIN = identifier.length === 12 && /^[A-Z]{2}/.test(identifier);

    scores.push({
      isin: isISIN ? identifier : undefined,
      cusip: !isISIN ? identifier : undefined,
      governanceScore: govScore,
      environmentalScore: envScore,
      socialScore: socScore,
      overallScore,
    });
  }

  return scores;
}

// Synchronous batch lookup from pre-loaded ESG scores
export function lookupESGScore(
  scores: ESGScore[],
  isin: string | null,
  cusip: string | null
): ESGScore | null {
  if (isin) {
    const match = scores.find(s => s.isin === isin);
    if (match) return match;
  }
  if (cusip) {
    const match = scores.find(s => s.cusip === cusip);
    if (match) return match;
  }
  return null;
}
