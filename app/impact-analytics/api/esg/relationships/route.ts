// GET /api/esg/relationships - List all relationships with ESG scores

import { NextResponse } from 'next/server';
import { getAllRelationships } from '@/lib/esg/db';
import { getRelationshipGroups } from '@/lib/esg/addepar';

export async function GET() {
  try {
    // Get cached relationships from database
    const cachedRelationships = await getAllRelationships();

    // If we have cached data, return it
    if (cachedRelationships.length > 0) {
      return NextResponse.json({
        success: true,
        data: cachedRelationships.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0)),
        source: 'cache',
        count: cachedRelationships.length,
      });
    }

    // Otherwise, fetch from Addepar and return basic info (no ESG scores yet)
    const groups = await getRelationshipGroups();

    const relationships = groups.map(g => ({
      id: g.id,
      name: g.name,
      totalValue: 0,
      esgScore: null,
      environmentalScore: null,
      socialScore: null,
      governanceScore: null,
      coverage: 0,
      lastUpdated: null,
    }));

    return NextResponse.json({
      success: true,
      data: relationships,
      source: 'addepar',
      count: relationships.length,
      message: 'ESG scores not calculated yet. Use POST /api/esg/refresh to calculate.',
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
