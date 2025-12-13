'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SpendingUploadProps {
  onSpendingLoaded: (spending: Record<number, number>) => void;
  slotName: string;
  durationQuarters: number;
}

export default function SpendingUpload({
  onSpendingLoaded,
  slotName,
  durationQuarters,
}: SpendingUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedCount, setLoadedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = useCallback(() => {
    // Create template workbook
    const quarters = Array.from({ length: Math.max(durationQuarters, 160) }, (_, i) => i + 1);
    const data = quarters.map(q => ({
      Quarter: q,
      Custom_Spending: q <= 4 ? (q === 1 ? 50000 : q === 2 ? 25000 : 0) : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Spending');

    // Add column widths
    ws['!cols'] = [{ wch: 10 }, { wch: 20 }];

    XLSX.writeFile(wb, `Custom_Spending_Template_${slotName.replace(/\s+/g, '_')}.xlsx`);
  }, [durationQuarters, slotName]);

  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setLoadedCount(null);

    try {
      let data: Record<string, string | number>[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('File must have header and data rows');

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string | number> = {};
          headers.forEach((h, i) => row[h] = values[i] || '');
          return row;
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
      } else {
        throw new Error('Unsupported format. Use CSV or Excel.');
      }

      if (data.length === 0) throw new Error('No data found');

      // Find quarter and spending columns
      const columns = Object.keys(data[0]);
      const quarterCol = columns.find(c => c.toLowerCase().includes('quarter'));
      const spendingCol = columns.find(c =>
        c.toLowerCase().includes('spending') ||
        c.toLowerCase().includes('amount') ||
        c.toLowerCase().includes('custom')
      ) || columns[1]; // Fallback to second column

      if (!quarterCol) throw new Error('Missing "Quarter" column');

      // Build spending map
      const spending: Record<number, number> = {};
      let count = 0;

      for (const row of data) {
        const quarter = parseInt(String(row[quarterCol]));
        let amount = row[spendingCol];

        if (typeof amount === 'string') {
          amount = amount.replace(/[$,]/g, '').trim();
        }
        const numAmount = parseFloat(String(amount)) || 0;

        if (!isNaN(quarter) && quarter >= 1 && numAmount > 0) {
          spending[quarter] = numAmount;
          count++;
        }
      }

      if (count === 0) throw new Error('No valid spending data found');

      setLoadedCount(count);
      onSpendingLoaded(spending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, [onSpendingLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [parseFile]);

  const handleClear = useCallback(() => {
    setLoadedCount(null);
    setError(null);
    onSpendingLoaded({});
  }, [onSpendingLoaded]);

  return (
    <div className="border border-[#e6e6e6] rounded-lg p-3 bg-[#f8f9fa]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-[#010203]">Custom Spending</span>
        <button
          onClick={downloadTemplate}
          className="text-[10px] text-[#0B6D7B] hover:text-[#095a66] flex items-center gap-1"
        >
          <Download size={10} />
          Template
        </button>
      </div>

      {/* Success state */}
      {loadedCount !== null && (
        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-[11px]">
          <span className="text-green-700">
            <FileSpreadsheet size={12} className="inline mr-1" />
            {loadedCount} spending event{loadedCount !== 1 ? 's' : ''} loaded
          </span>
          <button onClick={handleClear} className="text-green-600 hover:text-green-800">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Upload area */}
      {loadedCount === null && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload spending file"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border border-dashed rounded p-2 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#0B6D7B] bg-[#0B6D7B]/10'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-[#0B6D7B]'
          } focus:outline-none focus:ring-1 focus:ring-[#0B6D7B]`}
        >
          {isProcessing ? (
            <p className="text-[10px] text-[#0B6D7B]">Processing...</p>
          ) : (
            <>
              <Upload className="mx-auto text-gray-400" size={16} />
              <p className="text-[10px] text-gray-500 mt-1">Drop CSV/Excel</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-1">
          <AlertCircle className="text-red-500 flex-shrink-0" size={10} />
          <p className="text-[10px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
