// GET /api/esg/relationship/[id] - Get detailed ESG breakdown for a relationship

import { NextRequest, NextResponse } from 'next/server';
import { getRelationship, loadESGScores } from '@/lib/esg/db';
import { getPortfolioHoldings, getGroupInfo } from '@/lib/esg/addepar';
import { calculateWeightedESG, formatCurrency, getESGRating } from '@/lib/esg/calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check cache first
    const cached = await getRelationship(id);
    const { isinScores, cusipScores } = await loadESGScores();

    // Get group info from Addepar
    const groupInfo = await getGroupInfo(id);
    if (!groupInfo) {
      return NextResponse.json(
        { success: false, error: 'Relationship not found' },
        { status: 404 }
      );
    }

    // Get holdings from Addepar
    const { holdings, totalValue } = await getPortfolioHoldings(id);

    // Calculate weighted ESG scores
    const esgResult = calculateWeightedESG(holdings, isinScores, cusipScores);

    return NextResponse.json({
      success: true,
      data: {
        id,
        name: groupInfo.name,
        totalValue,
        totalValueFormatted: formatCurrency(totalValue),
        esgScore: esgResult.overallScore,
        esgRating: getESGRating(esgResult.overallScore),
        environmentalScore: esgResult.environmentalScore,
        socialScore: esgResult.socialScore,
        governanceScore: esgResult.governanceScore,
        coverage: Math.round(esgResult.coverage * 10) / 10,
        coveredValue: esgResult.coveredValue,
        coveredValueFormatted: formatCurrency(esgResult.coveredValue),
        holdingsCount: holdings.length,
        holdingsWithScores: esgResult.holdings.filter(h => h.esgScore !== null).length,
        lastUpdated: cached?.lastUpdated || null,
        // Detailed breakdown by entity
        entities: groupHoldingsByEntity(esgResult.holdings),
        // Top holdings by value
        topHoldings: esgResult.holdings
          .sort((a, b) => b.value - a.value)
          .slice(0, 20)
          .map(h => ({
            securityName: h.securityName,
            value: h.value,
            valueFormatted: formatCurrency(h.value),
            weight: ((h.value / totalValue) * 100).toFixed(2) + '%',
            isin: h.isin,
            cusip: h.cusip,
            esgScore: h.esgScore?.overallScore || null,
            hasESG: h.esgScore !== null,
          })),
      },
    });
  } catch (error) {
    console.error('Error fetching relationship:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

function groupHoldingsByEntity(holdings: Array<{ entityName: string; value: number; esgScore: { overallScore: number | null } | null }>) {
  const entities: Record<string, { totalValue: number; coveredValue: number; holdings: number }> = {};

  for (const h of holdings) {
    if (!entities[h.entityName]) {
      entities[h.entityName] = { totalValue: 0, coveredValue: 0, holdings: 0 };
    }
    entities[h.entityName].totalValue += h.value;
    entities[h.entityName].holdings++;
    if (h.esgScore?.overallScore !== null) {
      entities[h.entityName].coveredValue += h.value;
    }
  }

  return Object.entries(entities)
    .map(([name, data]) => ({
      name,
      totalValue: data.totalValue,
      totalValueFormatted: formatCurrency(data.totalValue),
      coverage: data.totalValue > 0 ? Math.round((data.coveredValue / data.totalValue) * 1000) / 10 : 0,
      holdingsCount: data.holdings,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}
