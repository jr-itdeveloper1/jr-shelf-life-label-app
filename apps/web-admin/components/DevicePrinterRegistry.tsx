'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { StatusBadge } from './ui';

type DeviceStatus = 'ACTIVE' | 'OFFLINE' | 'NEEDS_SETUP' | 'INACTIVE';

type DeviceRow = {
  outlet?: { name?: string | null } | null;
  deviceName: string;
  printerName?: string | null;
  printerMacAddress?: string | null;
  printerBluetoothId?: string | null;
  lastPrinterConnectedAt?: string | Date | null;
  status: DeviceStatus;
};

type SortDirection = 'asc' | 'desc' | null;
const ROWS_PER_PAGE = 10;

const statusOptions: Array<{ value: 'ALL' | DeviceStatus; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'NEEDS_SETUP', label: 'Needs Setup' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const columns: Array<{ key: keyof DeviceRow | 'outletName' | 'macAddress' | 'lastConnected'; label: string; value: (row: DeviceRow) => string }> = [
  { key: 'outletName', label: 'Outlet', value: (row) => row.outlet?.name ?? 'Unassigned' },
  { key: 'deviceName', label: 'App Device', value: (row) => row.deviceName },
  { key: 'printerName', label: 'Printer Name', value: (row) => row.printerName ?? 'Not selected' },
  { key: 'macAddress', label: 'MAC Address', value: (row) => row.printerMacAddress ?? row.printerBluetoothId ?? 'Pending' },
  { key: 'lastConnected', label: 'Last Connected', value: (row) => row.lastPrinterConnectedAt ? new Date(row.lastPrinterConnectedAt).toISOString() : '' },
  { key: 'status', label: 'Status', value: (row) => row.status },
];

export function DevicePrinterRegistry({ devices }: { devices: DeviceRow[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | DeviceStatus>('ALL');
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = devices.filter((device) => {
      const statusMatches = status === 'ALL' || device.status === status;
      const searchText = [
        device.outlet?.name,
        device.deviceName,
        device.printerName,
        device.printerMacAddress,
        device.printerBluetoothId,
        device.status,
      ].join(' ').toLowerCase();
      return statusMatches && (!normalizedQuery || searchText.includes(normalizedQuery));
    });

    if (!sort.direction) return filtered;
    const column = columns.find((current) => current.key === sort.key);
    if (!column) return filtered;
    return [...filtered].sort((a, b) => {
      const result = column.value(a).localeCompare(column.value(b), undefined, { numeric: true, sensitivity: 'base' });
      return sort.direction === 'asc' ? result : -result;
    });
  }, [devices, query, sort, status]);
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, pageCount);
  const pageRows = visibleRows.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const pageStart = visibleRows.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const pageEnd = Math.min(safePage * ROWS_PER_PAGE, visibleRows.length);

  function updateSort(key: string) {
    setSort((current) => {
      const direction: SortDirection = current.key !== key ? 'asc' : current.direction === 'asc' ? 'desc' : current.direction === 'desc' ? null : 'asc';
      return { key: direction ? key : '', direction };
    });
    setCurrentPage(1);
  }

  return (
    <section className="panel wide">
      <div className="panel-head">
        <h2>App Device Printer Registry</h2>
      </div>
      <div className="device-filter-bar">
        <input
          className="search-input"
          type="search"
          placeholder="Search outlet, device, printer, MAC..."
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setCurrentPage(1); }}
        />
        <label className="inline-filter compact" aria-label="Status filter">
          <select value={status} onChange={(event) => { setStatus(event.target.value as 'ALL' | DeviceStatus); setCurrentPage(1); }}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="pagination-controls">
          <span>{visibleRows.length === 0 ? 'No records' : `Showing ${pageStart}-${pageEnd} of ${visibleRows.length}`}</span>
          <button className="button" type="button" disabled={safePage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
          <button className="button" type="button" disabled={safePage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</button>
        </div>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button className="sort-button" type="button" onClick={() => updateSort(column.key)}>
                    <span>{column.label}</span>
                    <span className="sort-indicator">{sort.key === column.key ? sort.direction === 'asc' ? '↑' : sort.direction === 'desc' ? '↓' : '─' : '─'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr key={`${row.deviceName}-${row.printerMacAddress ?? row.printerBluetoothId ?? index}`}>
                <td>{row.outlet?.name ?? 'Unassigned'}</td>
                <td>{row.deviceName}</td>
                <td>{row.printerName ?? 'Not selected'}</td>
                <td><code>{row.printerMacAddress ?? row.printerBluetoothId ?? 'Pending'}</code></td>
                <td>{formatDate(row.lastPrinterConnectedAt)}</td>
                <td><StatusBadge kind={row.status === 'NEEDS_SETUP' ? 'danger' : row.status === 'OFFLINE' ? 'warn' : row.status === 'INACTIVE' ? 'neutral' : 'ok'}>{titleCase(row.status)}</StatusBadge></td>
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>No matching devices.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function titleCase(value?: string | null) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
