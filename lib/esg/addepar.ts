// Addepar API Client for ESG Pipeline

import type { PortfolioHolding } from './types';

const ADDEPAR_BASE_URL = process.env.ADDEPAR_BASE_URL || 'https://tiedemann.addepar.com/api/v1';
const ADDEPAR_FIRM_ID = process.env.ADDEPAR_FIRM_ID || '182';
const ADDEPAR_API_KEY = process.env.ADDEPAR_API_KEY || '';
const ADDEPAR_API_SECRET = process.env.ADDEPAR_API_SECRET || '';

function getHeaders(): HeadersInit {
  const authString = Buffer.from(`${ADDEPAR_API_KEY}:${ADDEPAR_API_SECRET}`).toString('base64');
  return {
    'Authorization': `Basic ${authString}`,
    'Addepar-Firm': ADDEPAR_FIRM_ID,
    'Content-Type': 'application/vnd.api+json',
  };
}

export interface AddeParGroup {
  id: string;
  name: string;
}

export async function getRelationshipGroups(): Promise<AddeParGroup[]> {
  const groups: AddeParGroup[] = [];
  let page = 1;

  while (page <= 3) { // Safety limit
    const resp = await fetch(
      `${ADDEPAR_BASE_URL}/groups?page[size]=500&page[number]=${page}`,
      { headers: getHeaders() }
    );

    if (!resp.ok) {
      throw new Error(`Addepar API error: ${resp.status}`);
    }

    const data = await resp.json();
    const pageGroups = data.data || [];

    if (pageGroups.length === 0) break;

    for (const g of pageGroups) {
      const name = g.attributes?.name || '';
      // Only include "Family Relationship" groups
      if (name.includes('Relationship')) {
        groups.push({ id: g.id, name });
      }
    }

    page++;
  }

  return groups;
}

export async function getPortfolioHoldings(groupId: string): Promise<{
  holdings: PortfolioHolding[];
  totalValue: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const payload = {
    data: {
      type: 'portfolio_query',
      attributes: {
        columns: [
          { key: 'value' },
          { key: 'isin' },
          { key: 'cusip' },
        ],
        groupings: [
          { key: 'top_level_legal_entity' },
          { key: 'security' },
        ],
        filters: [
          {
            attribute: 'holding_status',
            type: 'discrete',
            operator: 'include',
            values: ['Held'],
          },
        ],
        portfolio_type: 'GROUP',
        portfolio_id: [parseInt(groupId)],
        start_date: today,
        end_date: today,
        hide_previous_holdings: true,
      },
    },
  };

  const resp = await fetch(`${ADDEPAR_BASE_URL}/portfolio/query`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Addepar Portfolio Query error: ${resp.status} - ${text}`);
  }

  const data = await resp.json();
  const holdings: PortfolioHolding[] = [];
  let totalValue = 0;

  // Parse the nested response structure: data.data.attributes.total.children
  const total = data.data?.attributes?.total || {};
  const entityRows = total.children || [];

  for (const entityRow of entityRows) {
    // Level 1: Entity (top_level_legal_entity)
    const entityName = entityRow.name || 'Unknown';
    const entityId = entityRow.entity_id?.toString() || entityName;
    const securityRows = entityRow.children || [];

    for (const secRow of securityRows) {
      // Level 2: Security
      const securityName = secRow.name || 'Unknown';
      const columns = secRow.columns || {};

      const value = columns.value || 0;
      const isin = columns.isin || null;
      const cusip = columns.cusip || null;

      if (value > 0) {
        holdings.push({
          securityName,
          isin,
          cusip,
          ticker: null,
          value,
          entityName,
          entityId,
        });
        totalValue += value;
      }
    }
  }

  return { holdings, totalValue };
}

export async function getGroupInfo(groupId: string): Promise<AddeParGroup | null> {
  const resp = await fetch(
    `${ADDEPAR_BASE_URL}/groups/${groupId}`,
    { headers: getHeaders() }
  );

  if (!resp.ok) {
    return null;
  }

  const data = await resp.json();
  return {
    id: data.data?.id || groupId,
    name: data.data?.attributes?.name || 'Unknown',
  };
}
