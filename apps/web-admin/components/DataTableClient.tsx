'use client';

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';

type SortDirection = 'asc' | 'desc' | null;
const ROWS_PER_PAGE = 10;

function compareCell(a: HTMLTableRowElement, b: HTMLTableRowElement, columnIndex: number, direction: Exclude<SortDirection, null>) {
  const aValue = a.cells[columnIndex]?.dataset.sortValue ?? '';
  const bValue = b.cells[columnIndex]?.dataset.sortValue ?? '';
  const aNumber = Number(aValue);
  const bNumber = Number(bValue);
  const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
    ? aNumber - bNumber
    : aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });

  return direction === 'asc' ? result : -result;
}

export function DataTableControls({ tableId, searchPlaceholder, resetKey, children }: { tableId: string; searchPlaceholder: string; resetKey?: string | number; children?: ReactNode }) {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pageCount: 1, start: 0, end: 0 });
  const sortRef = useRef<{ columnIndex: number; direction: SortDirection }>({ columnIndex: -1, direction: null });

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    const table = document.getElementById(tableId);
    const tbody = table?.querySelector('tbody');
    if (!table || !tbody) return;
    const tableBody = tbody;

    const rows = () => Array.from(tableBody.querySelectorAll<HTMLTableRowElement>('tr[data-search]'));
    const emptyRow = tableBody.querySelector<HTMLTableRowElement>('tr[data-empty-row]');
    const buttons = Array.from(table.querySelectorAll<HTMLButtonElement>('.sort-button'));

    function updateIndicators() {
      buttons.forEach((button, index) => {
        const indicator = button.querySelector('.sort-indicator');
        const activeDirection = sortRef.current.columnIndex === index ? sortRef.current.direction : null;
        button.dataset.sortDirection = activeDirection ?? 'none';
        if (indicator) indicator.textContent = activeDirection === 'asc' ? '↑' : activeDirection === 'desc' ? '↓' : '─';
      });
    }

    function applyFilter() {
      const normalizedQuery = query.trim().toLowerCase();
      const matchingRows = rows().filter((row) => !normalizedQuery || (row.dataset.search ?? '').includes(normalizedQuery));
      const pageCount = Math.max(1, Math.ceil(matchingRows.length / ROWS_PER_PAGE));
      const safePage = Math.min(currentPage, pageCount);

      if (safePage !== currentPage) {
        setCurrentPage(safePage);
        return;
      }

      const startIndex = (safePage - 1) * ROWS_PER_PAGE;
      const endIndex = startIndex + ROWS_PER_PAGE;

      rows().forEach((row) => {
        const matchIndex = matchingRows.indexOf(row);
        row.hidden = matchIndex === -1 || matchIndex < startIndex || matchIndex >= endIndex;
      });

      if (emptyRow) emptyRow.hidden = matchingRows.length > 0;
      setPagination((previous) => {
        const next = {
          total: matchingRows.length,
          pageCount,
          start: matchingRows.length === 0 ? 0 : startIndex + 1,
          end: Math.min(endIndex, matchingRows.length),
        };
        return previous.total === next.total && previous.pageCount === next.pageCount && previous.start === next.start && previous.end === next.end ? previous : next;
      });
    }

    function applySort() {
      const currentRows = rows();
      const { columnIndex, direction } = sortRef.current;

      if (direction && columnIndex >= 0) {
        currentRows.sort((a, b) => compareCell(a, b, columnIndex, direction));
      } else {
        currentRows.sort((a, b) => Number(a.dataset.originalIndex ?? 0) - Number(b.dataset.originalIndex ?? 0));
      }

        currentRows.forEach((row) => tableBody.appendChild(row));
        if (emptyRow) tableBody.appendChild(emptyRow);
      updateIndicators();
      applyFilter();
    }

    function onSortClick(event: Event) {
      const button = event.currentTarget as HTMLButtonElement;
      const columnIndex = Number(button.dataset.columnIndex);
      const current = sortRef.current;
      const nextDirection: SortDirection = current.columnIndex !== columnIndex ? 'asc' : current.direction === 'asc' ? 'desc' : current.direction === 'desc' ? null : 'asc';
      sortRef.current = { columnIndex: nextDirection ? columnIndex : -1, direction: nextDirection };
      applySort();
    }

    buttons.forEach((button) => button.addEventListener('click', onSortClick));
    function onExternalFilter(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      setCurrentPage(1);
      setQuery(detail ?? '');
    }

    window.addEventListener('jr-table-filter', onExternalFilter);
    applySort();

    return () => {
      buttons.forEach((button) => button.removeEventListener('click', onSortClick));
      window.removeEventListener('jr-table-filter', onExternalFilter);
    };
  }, [currentPage, query, resetKey, tableId]);

  function onSearch(event: ChangeEvent<HTMLInputElement>) {
    setCurrentPage(1);
    setQuery(event.target.value);
  }

  return (
    <div className="table-controls">
      <div className="table-filter-controls">
        <input className="search-input" type="search" placeholder={searchPlaceholder} value={query} onChange={onSearch} />
        {children}
      </div>
      <div className="pagination-controls">
        <span>{pagination.total === 0 ? 'No records' : `Showing ${pagination.start}-${pagination.end} of ${pagination.total}`}</span>
        <button className="button" type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button>
        <button className="button" type="button" disabled={currentPage >= pagination.pageCount} onClick={() => setCurrentPage((page) => Math.min(pagination.pageCount, page + 1))}>Next</button>
      </div>
    </div>
  );
}
