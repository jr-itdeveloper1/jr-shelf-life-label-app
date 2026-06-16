import { isValidElement, ReactNode, useId } from 'react';
import { DataTableControls } from './DataTableClient';

export type DataTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
};

export function DataTable<T>({
  rows,
  columns,
  searchPlaceholder = 'Search...',
  getSearchText,
  controls,
  resetKey,
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  getSearchText: (row: T) => string;
  controls?: ReactNode;
  resetKey?: string | number;
}) {
  const tableId = `data-table-${useId().replace(/:/g, '')}`;

  return (
    <div className="table-shell">
      <DataTableControls tableId={tableId} searchPlaceholder={searchPlaceholder} resetKey={resetKey}>
        {controls}
      </DataTableControls>
      <table id={tableId}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={column.header}>
                <button className="sort-button" type="button" data-column-index={index}>
                  <span>{column.header}</span>
                  <span className="sort-indicator">─</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} data-original-index={index} data-search={getSearchText(row).toLowerCase()}>
              {columns.map((column) => {
                const rendered = column.render(row);
                return (
                  <td key={column.header} data-sort-value={normalizeSortValue(column.sortValue ? column.sortValue(row) : nodeToText(rendered))}>
                    {rendered}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr data-empty-row hidden={rows.length > 0}>
            <td colSpan={columns.length}>No matching records.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function normalizeSortValue(value: string | number | boolean | Date | null | undefined) {
  if (value instanceof Date) return String(value.getTime());
  if (typeof value === 'number') return String(value).padStart(20, '0');
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value ?? '').trim().toLowerCase();
}

function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join(' ');
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeToText(node.props.children);
  return '';
}
