'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReportConfig } from '@/lib/reports';

interface ReportDataState {
  client_name: string;
  metrics: Record<string, unknown>;
  benchmark: Record<string, unknown>;
  config: ReportConfig;
}

export default function ReportPreview() {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Report configuration options
  const [config, setConfig] = useState<ReportConfig>({
    includeClimate: true,
    includeNaturalCapital: true,
    includeSocial: true,
    includeGovernance: true,
    includeHeatmap: true,
    benchmarkName: 'MSCI ACWI',
    reportYear: new Date().getFullYear(),
  });

  // Load preview HTML
  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/impact-analytics/api/reports/generate?format=html');
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }
      const html = await response.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Download PDF
  const handleDownload = async () => {
    setDownloading(true);

    try {
      const response = await fetch('/impact-analytics/api/reports/generate');
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `esg-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Toggle section
  const toggleSection = (section: keyof ReportConfig) => {
    setConfig(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f0f0' }}>
      <main className="max-w-6xl mx-auto px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl mb-2 tracking-tight" style={{ color: '#010203' }}>
              ESG Impact Report
            </h1>
            <p className="text-lg" style={{ color: '#757575' }}>
              Preview and customize your 4-page ESG report before downloading
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={loadPreview}
              className="px-6 py-3 rounded-full text-base font-medium"
              style={{ backgroundColor: 'white', border: '2px solid #C3E6E3', color: '#757575' }}
            >
              Refresh Preview
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-8 py-3 rounded-full text-base font-medium flex items-center gap-2"
              style={{
                backgroundColor: downloading ? '#C3E6E3' : '#34E5B8',
                color: '#010203',
                opacity: downloading ? 0.7 : 1
              }}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section Toggles */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8" style={{ borderLeft: '4px solid #34E5B8' }}>
          <h3 className="font-serif text-xl mb-4" style={{ color: '#010203' }}>
            Report Sections
          </h3>
          <div className="flex gap-6 flex-wrap">
            {[
              { key: 'includeClimate', label: 'Climate Impact' },
              { key: 'includeNaturalCapital', label: 'Natural Capital' },
              { key: 'includeSocial', label: 'Social' },
              { key: 'includeGovernance', label: 'Governance' },
              { key: 'includeHeatmap', label: 'Summary Heatmap' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[key as keyof ReportConfig] as boolean}
                  onChange={() => toggleSection(key as keyof ReportConfig)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#34E5B8' }}
                />
                <span className="text-base" style={{ color: '#010203' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview Frame */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 mx-auto mb-4" style={{ color: '#34E5B8' }} viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-lg" style={{ color: '#757575' }}>Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-lg mb-4" style={{ color: '#ff3030' }}>{error}</p>
                <button
                  onClick={loadPreview}
                  className="px-6 py-2 rounded-full text-base font-medium"
                  style={{ backgroundColor: '#34E5B8', color: '#010203' }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={htmlContent}
              title="Report Preview"
              className="w-full border-0"
              style={{ height: '800px' }}
            />
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#757575' }}>
            This preview uses sample data. In production, data will be fetched from your selected portfolio.
          </p>
        </div>
      </main>
    </div>
  );
}
