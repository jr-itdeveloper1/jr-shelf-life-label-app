'use client';

import { useState } from 'react';
import { ExportButton } from './ExportButton';
import { apiPost } from '@/lib/client-api';

type MonthlyTotalRow = {
  outletName: string;
  productLabel60x40: number;
  compactProductLabel40x20: number;
  timestampLabel40x30: number;
  totalStickers: number;
  topPrinterName: string;
};

export function PrintAnalyticsActions({ month, rows }: { month: string; rows: MonthlyTotalRow[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  async function scheduleEmailReport() {
    setMessage(null);
    setError(null);
    setIsScheduling(true);

    try {
      const response = await apiPost<{ message: string }>('/company/print-analytics/email-schedule', { month });
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to schedule email report.');
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <ExportButton fileName={`print-analytics-${month}.csv`} rows={rows.map((row) => ({
          outlet: row.outletName,
          product60x40: row.productLabel60x40,
          compact40x20: row.compactProductLabel40x20,
          timestamp40x30: row.timestampLabel40x30,
          totalStickers: row.totalStickers,
          topPrinter: row.topPrinterName,
        }))} primary>
          Export Monthly Report
        </ExportButton>
        <button className="button" type="button" disabled={isScheduling} onClick={scheduleEmailReport}>
          {isScheduling ? 'Scheduling...' : 'Schedule Email Report'}
        </button>
      </div>
      {message ? <div className="form-message success">{message}</div> : null}
      {error ? <div className="form-message error">{error}</div> : null}
    </>
  );
}
