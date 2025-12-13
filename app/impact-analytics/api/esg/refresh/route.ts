// POST /api/esg/refresh - Refresh ESG scores for a relationship

import { NextRequest, NextResponse } from 'next/server';
import { saveRelationship, loadESGScores } from '@/lib/esg/db';
import { getPortfolioHoldings, getGroupInfo } from '@/lib/esg/addepar';
import { calculateWeightedESG } from '@/lib/esg/calculator';
import type { Relationship } from '@/lib/esg/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { relationshipId, relationshipIds } = body;

    // Handle single or multiple relationships
    const ids: string[] = relationshipIds || (relationshipId ? [relationshipId] : []);

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'relationshipId or relationshipIds required' },
        { status: 400 }
      );
    }

    // Load ESG scores cache
    const { isinScores, cusipScores } = await loadESGScores();

    if (isinScores.size === 0 && cusipScores.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No ESG scores in cache. Import scores first using POST /api/esg/import-scores',
        },
        { status: 400 }
      );
    }

    const results: Array<{ id: string; name: string; success: boolean; error?: string; data?: Relationship }> = [];

    for (const id of ids) {
      try {
        // Get group info
        const groupInfo = await getGroupInfo(id);
        if (!groupInfo) {
          results.push({ id, name: 'Unknown', success: false, error: 'Relationship not found' });
          continue;
        }

        // Get holdings from Addepar
        const { holdings, totalValue } = await getPortfolioHoldings(id);

        // Calculate weighted ESG scores
        const esgResult = calculateWeightedESG(holdings, isinScores, cusipScores);

        // Create relationship record
        const relationship: Relationship = {
          id,
          name: groupInfo.name,
          totalValue,
          esgScore: esgResult.overallScore,
          environmentalScore: esgResult.environmentalScore,
          socialScore: esgResult.socialScore,
          governanceScore: esgResult.governanceScore,
          coverage: Math.round(esgResult.coverage * 10) / 10,
          lastUpdated: new Date().toISOString(),
        };

        // Save to cache
        await saveRelationship(relationship);

        results.push({ id, name: groupInfo.name, success: true, data: relationship });
      } catch (error) {
        results.push({ id, name: 'Unknown', success: false, error: String(error) });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: failed.length === 0,
      message: `Refreshed ${successful.length}/${ids.length} relationships`,
      results,
      summary: {
        total: ids.length,
        successful: successful.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error('Error refreshing ESG scores:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
