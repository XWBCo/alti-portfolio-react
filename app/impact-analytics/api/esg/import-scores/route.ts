// POST /api/esg/import-scores - Import ESG scores from CSV cache files

import { NextRequest, NextResponse } from 'next/server';
import { importESGScoresFromCSV, loadESGScores } from '@/lib/esg/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      isinCsvPath = '/tmp/clarity_esg_results.csv',
      cusipCsvPath = '/tmp/clarity_cusip_full_results.csv',
    } = body;

    // Import scores from CSV files
    const { isinCount, cusipCount } = await importESGScoresFromCSV(isinCsvPath, cusipCsvPath);

    return NextResponse.json({
      success: true,
      message: `Imported ${isinCount} ISIN scores and ${cusipCount} CUSIP scores`,
      data: {
        isinCount,
        cusipCount,
        totalScores: isinCount + cusipCount,
      },
    });
  } catch (error) {
    console.error('Error importing ESG scores:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// GET - Check current ESG scores cache status
export async function GET() {
  try {
    const { isinScores, cusipScores } = await loadESGScores();

    return NextResponse.json({
      success: true,
      data: {
        isinCount: isinScores.size,
        cusipCount: cusipScores.size,
        totalScores: isinScores.size + cusipScores.size,
        hasScores: isinScores.size > 0 || cusipScores.size > 0,
      },
    });
  } catch (error) {
    console.error('Error checking ESG scores:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
