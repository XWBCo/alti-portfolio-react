/**
 * Data API Route
 * Provides access to production CSV data for frontend components
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  loadPortfolioUniverse,
  getPortfolioNames,
  getPortfolio,
  loadReturnSeries,
  loadSecurityMetadata,
  getAvailableBetaDates,
  loadBetaMatrix,
  loadFactorCovariance,
  loadCMAData,
  getDataSummary,
} from '@/lib/data-loader';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const name = searchParams.get('name');
  const currency = (searchParams.get('currency') as 'USD' | 'EUR' | 'GBP') || 'USD';
  const date = searchParams.get('date') || undefined;

  try {
    switch (type) {
      case 'summary':
        return NextResponse.json(getDataSummary());

      case 'portfolios':
        return NextResponse.json(getPortfolioNames());

      case 'portfolio':
        if (!name) {
          return NextResponse.json({ error: 'Portfolio name required' }, { status: 400 });
        }
        const portfolio = getPortfolio(name);
        if (!portfolio) {
          return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
        }
        return NextResponse.json(portfolio);

      case 'portfolios-all':
        const allPortfolios = loadPortfolioUniverse();
        return NextResponse.json(Array.from(allPortfolios.values()));

      case 'returns':
        return NextResponse.json(loadReturnSeries(currency));

      case 'metadata':
        return NextResponse.json(loadSecurityMetadata());

      case 'beta-dates':
        return NextResponse.json(getAvailableBetaDates());

      case 'betas':
        return NextResponse.json(loadBetaMatrix(date));

      case 'factor-covariance':
        return NextResponse.json(loadFactorCovariance(date));

      case 'cma':
        return NextResponse.json(loadCMAData());

      default:
        return NextResponse.json({
          error: 'Invalid type. Use: summary, portfolios, portfolio, portfolios-all, returns, metadata, beta-dates, betas, factor-covariance, cma',
        }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
