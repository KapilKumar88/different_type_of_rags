import type {
  ParsedStructuredTable,
  StructuredColumnValueType,
  StructuredTableColumn,
  StructuredTableRow,
  StructuredTableSourceType,
  StructuredValue,
} from '../../../types/rag.types';

export type CreateStructuredTableInput = {
  tableKey: string;
  title: string;
  sourceType: StructuredTableSourceType;
  sourceLabel: string;
  rows: unknown[][];
  pageNumber?: number;
  firstRowContainsHeaders?: boolean;
};

type ColumnAccumulator = {
  key: string;
  name: string;
  index: number;
  values: StructuredValue[];
};

const maxSampleValues = 5;

export function createStructuredTable(
  input: CreateStructuredTableInput,
): ParsedStructuredTable | null {
  const normalizedRows = input.rows
    .map((row) => row.map((value) => normalizeStructuredValue(value)))
    .filter((row) => row.some((value) => value !== null));

  if (normalizedRows.length === 0) {
    return null;
  }

  const headerRow =
    input.firstRowContainsHeaders === false ? null : normalizedRows[0] ?? null;
  const dataRows = headerRow ? normalizedRows.slice(1) : normalizedRows;
  const columnCount = Math.max(...normalizedRows.map((row) => row.length), 0);

  if (columnCount === 0 || dataRows.length === 0) {
    return null;
  }

  const columns = buildColumns(headerRow, dataRows, columnCount);
  const rows = buildRows(columns, dataRows);

  if (rows.length === 0) {
    return null;
  }

  return {
    tableKey: input.tableKey,
    title: input.title,
    sourceType: input.sourceType,
    sourceLabel: input.sourceLabel,
    ...(input.pageNumber === undefined ? {} : { pageNumber: input.pageNumber }),
    columns,
    rows,
  };
}

export function createStructuredTableFromRecords(
  input: Omit<CreateStructuredTableInput, 'rows'> & {
    records: Record<string, unknown>[];
  },
): ParsedStructuredTable | null {
  const columnNames = Array.from(
    input.records.reduce<Set<string>>((keys, record) => {
      Object.keys(record).forEach((key) => keys.add(key));

      return keys;
    }, new Set<string>()),
  );

  if (columnNames.length === 0) {
    return null;
  }

  const rows = [
    columnNames,
    ...input.records.map((record) => columnNames.map((key) => record[key])),
  ];

  return createStructuredTable({
    ...input,
    rows,
    firstRowContainsHeaders: true,
  });
}

export function tableToSearchText(table: ParsedStructuredTable): string {
  const columnText = table.columns
    .map((column) => `${column.name} (${column.valueType})`)
    .join(', ');
  const previewRows = table.rows
    .slice(0, 5)
    .map((row) =>
      table.columns
        .map((column) => `${column.name}: ${formatStructuredValue(row.values[column.key])}`)
        .join('; '),
    )
    .join('\n');

  return [
    `Table: ${table.title}`,
    `Source: ${table.sourceLabel}`,
    `Columns: ${columnText}`,
    `Rows: ${table.rows.length}`,
    previewRows,
  ]
    .filter((part) => part.length > 0)
    .join('\n');
}

export function sanitizeColumnKey(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || fallback;
}

export function normalizeStructuredValue(value: unknown): StructuredValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    return trimmedValue.length === 0 ? null : trimmedValue;
  }

  return JSON.stringify(value);
}

export function formatStructuredValue(value: StructuredValue): string {
  if (value === null) {
    return '';
  }

  return String(value);
}

function buildColumns(
  headerRow: StructuredValue[] | null,
  dataRows: StructuredValue[][],
  columnCount: number,
): StructuredTableColumn[] {
  const usedKeys = new Set<string>();
  const accumulators: ColumnAccumulator[] = Array.from(
    { length: columnCount },
    (_, index) => {
      const fallbackName = `Column ${index + 1}`;
      const rawName = headerRow?.[index];
      const name =
        typeof rawName === 'string' && rawName.trim().length > 0
          ? rawName.trim()
          : fallbackName;
      const baseKey = sanitizeColumnKey(name, `column_${index + 1}`);
      const key = createUniqueColumnKey(baseKey, usedKeys);

      return {
        key,
        name,
        index,
        values: dataRows.map((row) => row[index] ?? null),
      };
    },
  );

  return accumulators.map((accumulator) => {
    const nonNullValues = accumulator.values.filter(
      (value): value is Exclude<StructuredValue, null> => value !== null,
    );

    return {
      key: accumulator.key,
      name: accumulator.name,
      index: accumulator.index,
      valueType: inferValueType(nonNullValues),
      nonNullCount: nonNullValues.length,
      sampleValues: Array.from(new Set(nonNullValues)).slice(0, maxSampleValues),
    };
  });
}

function buildRows(
  columns: StructuredTableColumn[],
  dataRows: StructuredValue[][],
): StructuredTableRow[] {
  return dataRows
    .map((row, rowIndex) => {
      const values = columns.reduce<Record<string, StructuredValue>>(
        (rowValues, column) => {
          rowValues[column.key] = row[column.index] ?? null;

          return rowValues;
        },
        {},
      );

      return {
        index: rowIndex,
        values,
      };
    })
    .filter((row) => {
      return Object.values(row.values).some((value) => value !== null);
    });
}

function createUniqueColumnKey(baseKey: string, usedKeys: Set<string>): string {
  let key = baseKey;
  let suffix = 2;

  while (usedKeys.has(key)) {
    key = `${baseKey}_${suffix}`;
    suffix += 1;
  }

  usedKeys.add(key);

  return key;
}

function inferValueType(
  values: Exclude<StructuredValue, null>[],
): StructuredColumnValueType {
  if (values.length === 0) {
    return 'empty';
  }

  if (values.every((value) => typeof value === 'number')) {
    return 'number';
  }

  if (values.every((value) => typeof value === 'boolean')) {
    return 'boolean';
  }

  if (values.every((value) => isDateLike(value))) {
    return 'date';
  }

  return 'string';
}

function isDateLike(value: Exclude<StructuredValue, null>): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmedValue)) {
    return false;
  }

  return !Number.isNaN(Date.parse(trimmedValue));
}
