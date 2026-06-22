import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { checkPreferredBluetoothPrinterReadiness } from '../services/printerService';

export type PrinterReadinessStatus = 'checking' | 'ready' | 'missing' | 'offline' | 'error';

export type PrinterReadinessState = {
  status: PrinterReadinessStatus;
  label: string;
};

export const initialPrinterReadiness: PrinterReadinessState = {
  status: 'checking',
  label: 'Checking',
};

export function usePrinterReadiness(enabled = true) {
  const [readiness, setReadiness] = useState<PrinterReadinessState>(initialPrinterReadiness);

  const refreshReadiness = useCallback(async () => {
    setReadiness((currentReadiness) => ({
      ...currentReadiness,
      status: 'checking',
      label: currentReadiness.status === 'missing' ? 'No printer' : 'Checking',
    }));

    try {
      const result = await checkPreferredBluetoothPrinterReadiness();

      if (result.status === 'missing') {
        setReadiness({
          status: 'missing',
          label: 'No printer',
        });
        return;
      }

      if (result.status === 'offline') {
        setReadiness({
          status: 'offline',
          label: 'Printer offline',
        });
        return;
      }

      setReadiness({
        status: 'ready',
        label: 'Printer ready',
      });
    } catch {
      setReadiness({
        status: 'error',
        label: 'Check printer',
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    void refreshReadiness();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshReadiness();
      }
    });

    return () => subscription.remove();
  }, [enabled, refreshReadiness]);

  return {
    readiness,
    refreshReadiness,
  };
}

