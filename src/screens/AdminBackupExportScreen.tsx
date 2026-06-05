import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as XLSX from 'xlsx';

import { StickyBackHeader } from '../components/StickyBackHeader';
import type { AppDataImport, Outlet, OutletProduct, PrintJob, Product, ProductCategory } from '../domain/models';
import { colors } from '../theme/colors';

type Props = {
  outlets: Outlet[];
  categories: ProductCategory[];
  products: Product[];
  outletProducts: OutletProduct[];
  printJobs: PrintJob[];
  onImportData: (importData: AppDataImport) => void;
  onBack: () => void;
};

type SheetRow = Record<string, unknown>;

export function AdminBackupExportScreen({
  outlets,
  categories,
  products,
  outletProducts,
  printJobs,
  onImportData,
  onBack,
}: Props) {
  const [lastExportUri, setLastExportUri] = useState<string | null>(null);
  const [lastImportSummary, setLastImportSummary] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const snapshot = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: 'jr-shelf-life-label-app',
    data: {
      outlets,
      categories,
      products,
      outletProducts,
      printJobs,
    },
  };

  const exportExcel = async () => {
    if (!FileSystem.documentDirectory) {
      Alert.alert('Export unavailable', 'The app document folder is not available on this device.');
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `jr-shelf-life-data-${timestamp}.xlsx`;
      const workbook = createExportWorkbook({ outlets, categories, products, outletProducts, printJobs });
      const workbookBase64 = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'base64',
      });

      const fileUri = await saveWorkbookFile(fileName, workbookBase64);

      setLastExportUri(fileUri);
      Alert.alert('Export complete', 'Excel workbook exported successfully.');
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Unable to create Excel workbook.');
    } finally {
      setIsExporting(false);
    }
  };

  const importExcel = async () => {
    setIsImporting(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert('Import failed', 'No file was selected.');
        return;
      }

      const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const workbook = XLSX.read(fileBase64, { type: 'base64' });
      const importData = parseWorkbook(workbook, { categories, outlets, products });

      const totalRows =
        (importData.categories?.length ?? 0) +
        (importData.outlets?.length ?? 0) +
        (importData.products?.length ?? 0) +
        (importData.outletProducts?.length ?? 0);

      if (totalRows === 0) {
        Alert.alert('No importable rows', 'No valid rows were found in Categories, Outlets, Products, or OutletProducts sheets.');
        return;
      }

      onImportData(importData);

      const summary = [
        `${importData.categories?.length ?? 0} categories`,
        `${importData.outlets?.length ?? 0} outlets`,
        `${importData.products?.length ?? 0} products`,
        `${importData.outletProducts?.length ?? 0} outlet product settings`,
      ].join(', ');

      setLastImportSummary(`${file.name}: ${summary}`);
      Alert.alert('Import complete', summary);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Unable to import Excel workbook.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StickyBackHeader label="< Admin" onPress={onBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Import / Export Data</Text>
        <Text style={styles.subtitle}>
          Export current app data to an Excel workbook or import admin data from Excel.
        </Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Included Data</Text>
          <SummaryRow label="Outlets" value={outlets.length} />
          <SummaryRow label="Product Categories" value={categories.length} />
          <SummaryRow label="Products" value={products.length} />
          <SummaryRow label="Outlet Product Settings" value={outletProducts.length} />
          <SummaryRow label="Print History" value={printJobs.length} />
        </View>

        <Pressable
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={exportExcel}
          disabled={isExporting}
        >
          <Text style={styles.exportButtonText}>{isExporting ? 'Exporting...' : 'Export Excel Workbook'}</Text>
        </Pressable>

        <Pressable
          style={[styles.importButton, isImporting && styles.exportButtonDisabled]}
          onPress={importExcel}
          disabled={isImporting}
        >
          <Text style={styles.importButtonText}>{isImporting ? 'Importing...' : 'Import Excel Workbook'}</Text>
        </Pressable>

        <View style={styles.formatPanel}>
          <Text style={styles.pathTitle}>Excel Sheet Names</Text>
          <Text style={styles.pathText}>
            Exported sheets: Categories, Outlets, Products, OutletProducts, PrintJobs. Import supports Categories, Outlets, Products, and OutletProducts.
          </Text>
        </View>

        {lastExportUri ? (
          <View style={styles.pathPanel}>
            <Text style={styles.pathTitle}>Last Export</Text>
            <Text style={styles.pathText}>{lastExportUri}</Text>
          </View>
        ) : null}

        {lastImportSummary ? (
          <View style={styles.pathPanel}>
            <Text style={styles.pathTitle}>Last Import</Text>
            <Text style={styles.pathText}>{lastImportSummary}</Text>
          </View>
        ) : null}

        <View style={styles.notePanel}>
          <Text style={styles.noteTitle}>Phase 1 Note</Text>
          <Text style={styles.noteText}>
            Import updates the current local app data only. When persistence is moved to SQLite, import and export will write through the database.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function parseWorkbook(
  workbook: XLSX.WorkBook,
  currentData: {
    categories: ProductCategory[];
    outlets: Outlet[];
    products: Product[];
  },
): AppDataImport {
  const productRows = getSheetRows(workbook, ['Products', 'Product List', 'Sheet1']);
  const importedCategories = [
    ...parseCategories(getSheetRows(workbook, ['Categories', 'Product Categories'])),
    ...inferCategoriesFromProductRows(productRows, currentData.categories),
  ];
  const nextCategories = mergeByKey(
    currentData.categories,
    importedCategories,
    (category) => category.codePrefix,
  );

  const importedOutlets = parseOutlets(getSheetRows(workbook, ['Outlets']));
  const nextOutlets = mergeByKey(currentData.outlets, importedOutlets, (outlet) => outlet.shortCode);

  const importedProducts = parseProducts(
    productRows,
    nextCategories,
    nextOutlets,
    currentData.products,
  );
  const nextProducts = mergeByKey(currentData.products, importedProducts, (product) => product.productCode);

  const importedOutletProducts = parseOutletProducts(
    getSheetRows(workbook, ['OutletProducts', 'Outlet Products', 'Outlet Product Lists']),
    nextOutlets,
    nextProducts,
  );

  return {
    categories: importedCategories,
    outlets: importedOutlets,
    products: importedProducts,
    outletProducts: importedOutletProducts,
  };
}

function createExportWorkbook(data: {
  outlets: Outlet[];
  categories: ProductCategory[];
  products: Product[];
  outletProducts: OutletProduct[];
  printJobs: PrintJob[];
}) {
  const workbook = XLSX.utils.book_new();
  const categoryById = new Map(data.categories.map((category) => [category.id, category]));
  const outletById = new Map(data.outlets.map((outlet) => [outlet.id, outlet]));
  const productById = new Map(data.products.map((product) => [product.id, product]));

  appendSheet(workbook, 'Categories', data.categories.map((category) => ({
    id: category.id,
    name: category.name,
    codePrefix: category.codePrefix,
    color: category.color ?? '',
    scope: category.scope,
  })));

  appendSheet(workbook, 'Outlets', data.outlets.map((outlet) => ({
    id: outlet.id,
    name: outlet.name,
    code: outlet.code,
    shortCode: outlet.shortCode,
  })));

  appendSheet(workbook, 'Products', data.products.map((product) => {
    const category = categoryById.get(product.categoryId);
    const outlet = product.outletId ? outletById.get(product.outletId) : undefined;

    return {
      id: product.id,
      productCode: product.productCode,
      nameEn: product.nameEn,
      nameZh: product.nameZh,
      categoryId: product.categoryId,
      category: category?.name ?? '',
      categoryPrefix: category?.codePrefix ?? '',
      source: product.source,
      outletId: product.outletId ?? '',
      outletName: outlet?.name ?? '',
      outletShortCode: outlet?.shortCode ?? '',
      daysToExpire: product.daysToExpire,
      hoursToExpire: product.hoursToExpire,
      storageMethodEn: product.storageMethod.en,
      storageMethodZh: product.storageMethod.zh,
      imageUri: product.imageUri ?? '',
      active: product.active ? 'TRUE' : 'FALSE',
    };
  }));

  appendSheet(workbook, 'OutletProducts', data.outletProducts.map((outletProduct) => {
    const outlet = outletById.get(outletProduct.outletId);
    const product = productById.get(outletProduct.productId);

    return {
      id: outletProduct.id,
      outletId: outletProduct.outletId,
      outletName: outlet?.name ?? '',
      outletShortCode: outlet?.shortCode ?? '',
      productId: outletProduct.productId,
      productCode: product?.productCode ?? '',
      productNameEn: product?.nameEn ?? '',
      active: outletProduct.active ? 'TRUE' : 'FALSE',
    };
  }));

  appendSheet(workbook, 'PrintJobs', data.printJobs.map((printJob) => ({
    id: printJob.id,
    labelType: printJob.labelType ?? 'product',
    outletId: printJob.outletId,
    outletName: printJob.outletName,
    productId: printJob.productId,
    productCode: printJob.productCode,
    productNameEn: printJob.productNameEn,
    productNameZh: printJob.productNameZh,
    quantity: printJob.quantity,
    printedAt: printJob.printedAt,
    expiresAt: printJob.expiresAt,
    printerName: printJob.printerName ?? '',
    printerAddress: printJob.printerAddress ?? '',
    status: printJob.status,
  })));

  appendSheet(workbook, 'ExportInfo', [{
    app: 'jr-shelf-life-label-app',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    outlets: data.outlets.length,
    categories: data.categories.length,
    products: data.products.length,
    outletProducts: data.outletProducts.length,
    printJobs: data.printJobs.length,
  }]);

  return workbook;
}

function appendSheet(workbook: XLSX.WorkBook, sheetName: string, rows: SheetRow[]) {
  const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}], { skipHeader: rows.length === 0 });
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  sheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

async function saveWorkbookFile(fileName: string, workbookBase64: string) {
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (Platform.OS === 'android') {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        mimeType,
      );
      await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, workbookBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return fileUri;
    }
  }

  if (!FileSystem.documentDirectory) {
    throw new Error('The app document folder is not available on this device.');
  }

  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, workbookBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

function parseCategories(rows: SheetRow[]): ProductCategory[] {
  return rows.flatMap((row) => {
    const name = readCell(row, ['name', 'category', 'categoryName']);
    const codePrefix = normalizeCode(readCell(row, ['codePrefix', 'prefix', 'categoryPrefix']), 5);
    const rawScope = readCell(row, ['scope', 'type']);

    if (!name || !codePrefix) {
      return [];
    }

    return [{
      id: readCell(row, ['id']) || `category-${codePrefix.toLowerCase()}`,
      name,
      codePrefix,
      color: readCell(row, ['color', 'colour', 'categoryColor']),
      scope: rawScope.toLowerCase().includes('outlet') ? 'outlet' : 'company',
    }];
  });
}

function inferCategoriesFromProductRows(rows: SheetRow[], currentCategories: ProductCategory[]): ProductCategory[] {
  const inferredPrefixes = Array.from(new Set(
    rows
      .map((row) => getProductCodePrefix(readCell(row, ['productCode', 'code', 'Product Code'])))
      .filter(Boolean),
  ));

  return inferredPrefixes
    .filter((prefix) => !currentCategories.some((category) => category.codePrefix === prefix))
    .map((prefix) => ({
      id: prefix.toLowerCase(),
      name: defaultCategoryNames[prefix] ?? prefix,
      codePrefix: prefix,
      scope: 'company',
    }));
}

function parseOutlets(rows: SheetRow[]): Outlet[] {
  return rows.flatMap((row) => {
    const name = readCell(row, ['name', 'outlet', 'outletName']);
    const shortCode = normalizeCode(readCell(row, ['shortCode', 'outletShortCode', 'prefix']), 5);

    if (!name || !shortCode) {
      return [];
    }

    return [{
      id: readCell(row, ['id']) || `outlet-${shortCode.toLowerCase()}`,
      name,
      code: readCell(row, ['code', 'outletCode']) || `OUT-${shortCode}`,
      shortCode,
    }];
  });
}

function parseProducts(
  rows: SheetRow[],
  categories: ProductCategory[],
  outlets: Outlet[],
  currentProducts: Product[],
): Product[] {
  const parsedProducts: Product[] = [];

  rows.forEach((row) => {
    const category = findCategory(row, categories);
    const nameEn = readCell(row, ['nameEn', 'englishName', 'productName', 'productNameEng', 'Product Name (Eng)', 'name']);

    if (!category || !nameEn) {
      return;
    }

    const productCode = normalizeCode(readCell(row, ['productCode', 'code']), 8) ||
      nextProductCode(category.codePrefix, [...currentProducts, ...parsedProducts]);
    const existingProduct = currentProducts.find((product) => product.productCode === productCode);
    const outlet = category.scope === 'outlet' ? findOutlet(row, outlets, category.codePrefix) : undefined;
    let daysToExpire = toNonNegativeInt(readCell(row, ['daysToExpire', 'days']), 0);
    const hoursToExpire = toNonNegativeInt(readCell(row, ['hoursToExpire', 'hours']), 0);

    if (daysToExpire === 0 && hoursToExpire === 0) {
      daysToExpire = 1;
    }

    parsedProducts.push({
      id: readCell(row, ['id']) || existingProduct?.id || `product-${productCode.toLowerCase()}`,
      outletId: outlet?.id,
      categoryId: category.id,
      productCode,
      source: category.scope === 'outlet' ? 'outlet' : 'company',
      nameEn,
      nameZh: readCell(row, ['nameZh', 'chineseName', 'nameChinese', 'productNameChinese', 'Product Name (Chinese)']) || existingProduct?.nameZh || '',
      daysToExpire,
      hoursToExpire,
      storageMethod: {
        ...parseStorageMethod(row, existingProduct),
      },
      imageUri: readCell(row, ['imageUri', 'image', 'photoUri']) || existingProduct?.imageUri,
      active: readBoolean(row, ['active', 'status'], true),
    });
  });

  return parsedProducts;
}

function parseOutletProducts(rows: SheetRow[], outlets: Outlet[], products: Product[]): OutletProduct[] {
  return rows.flatMap((row) => {
    const outlet = findOutlet(row, outlets);
    const productCode = normalizeCode(readCell(row, ['productCode', 'code']), 8);
    const productId = readCell(row, ['productId']);
    const product = products.find(
      (currentProduct) => currentProduct.id === productId || currentProduct.productCode === productCode,
    );

    if (!outlet || !product) {
      return [];
    }

    return [{
      id: readCell(row, ['id']) || `${outlet.id}-${product.id}`,
      outletId: outlet.id,
      productId: product.id,
      active: readBoolean(row, ['active', 'visible', 'show'], true),
    }];
  });
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function getSheetRows(workbook: XLSX.WorkBook, names: string[]) {
  const targetSheetName = workbook.SheetNames.find((sheetName) =>
    names.some((name) => normalizeHeader(name) === normalizeHeader(sheetName)),
  );

  if (!targetSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[targetSheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: '' });
}

function findCategory(row: SheetRow, categories: ProductCategory[]) {
  const categoryId = readCell(row, ['categoryId']);
  const categoryPrefix = normalizeCode(readCell(row, ['categoryPrefix', 'codePrefix', 'prefix']), 5);
  const productCodePrefix = getProductCodePrefix(readCell(row, ['productCode', 'code', 'Product Code']));
  const categoryName = readCell(row, ['category', 'categoryName']);

  return categories.find(
    (category) =>
      category.id === categoryId ||
      category.codePrefix === categoryPrefix ||
      category.codePrefix === productCodePrefix ||
      normalizeHeader(category.name) === normalizeHeader(categoryName),
  );
}

function findOutlet(row: SheetRow, outlets: Outlet[], fallbackShortCode?: string) {
  const outletId = readCell(row, ['outletId']);
  const outletShortCode = normalizeCode(readCell(row, ['outletShortCode', 'shortCode', 'outletPrefix']), 5) ||
    fallbackShortCode;

  return outlets.find((outlet) => outlet.id === outletId || outlet.shortCode === outletShortCode);
}

function readCell(row: SheetRow, aliases: string[]) {
  const foundKey = Object.keys(row).find((key) =>
    aliases.some((alias) => normalizeHeader(alias) === normalizeHeader(key)),
  );
  const value = foundKey ? row[foundKey] : '';

  return value === undefined || value === null ? '' : String(value).trim();
}

function readBoolean(row: SheetRow, aliases: string[], fallback: boolean) {
  const value = readCell(row, aliases).toLowerCase();

  if (!value) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'y', 'active', 'show', 'visible'].includes(value);
}

function toNonNegativeInt(value: string, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function normalizeCode(value: string, maxLength: number) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, maxLength);
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function nextProductCode(prefix: string, products: Product[]) {
  const nextSequence = products
    .filter((product) => product.productCode.startsWith(prefix))
    .map((product) => Number(product.productCode.slice(prefix.length)))
    .filter((sequence) => Number.isInteger(sequence))
    .reduce((max, sequence) => Math.max(max, sequence), 0) + 1;

  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}

function getProductCodePrefix(productCode: string) {
  return normalizeCode(productCode, 8).match(/^[A-Z]+/)?.[0] ?? '';
}

function parseStorageMethod(row: SheetRow, existingProduct?: Product) {
  const storageMethod = readCell(row, ['storageMethod', 'Storage Method']);
  const storageMethodEn = readCell(row, ['storageMethodEn', 'storageEn']);
  const storageMethodZh = readCell(row, ['storageMethodZh', 'storageZh']);

  if (storageMethodEn || storageMethodZh) {
    return {
      en: storageMethodEn || existingProduct?.storageMethod.en || 'Chilled',
      zh: storageMethodZh || existingProduct?.storageMethod.zh || '冷藏',
    };
  }

  if (!storageMethod) {
    return existingProduct?.storageMethod ?? { en: 'Chilled', zh: '冷藏' };
  }

  const storageMethodParts = storageMethod.split(/\s+/);
  const en = storageMethodParts[0] || 'Chilled';

  return {
    en,
    zh: storageMethodZhByEn[en] ?? (storageMethodParts.slice(1).join(' ') || '冷藏'),
  };
}

const defaultCategoryNames: Record<string, string> = {
  EG: 'Eggs',
  DY: 'Dairy',
  SE: 'Sauces & Dressings',
  BS: 'Bread Spreads',
  BV: 'Beverages',
  FF: 'Frozen Food',
  DP: 'Dried Products',
  BK: 'Bakery',
  MS: 'Meat & Seafood',
  VEG: 'Vegetables',
  RTE: 'Ready To Eat',
};

const storageMethodZhByEn: Record<string, string> = {
  Chilled: '冷藏',
  Ambient: '常温',
  Frozen: '冷冻',
  Hot: '热',
};

function mergeByKey<T>(currentItems: T[], importedItems: T[], getKey: (item: T) => string) {
  const mergedItems = [...currentItems];

  importedItems.forEach((importedItem) => {
    const importedKey = getKey(importedItem);
    const existingIndex = mergedItems.findIndex((currentItem) => getKey(currentItem) === importedKey);

    if (existingIndex >= 0) {
      mergedItems[existingIndex] = importedItem;
      return;
    }

    mergedItems.push(importedItem);
  });

  return mergedItems;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  panel: {
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  exportButton: {
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
  },
  exportButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  exportButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  importButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingVertical: 15,
  },
  importButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  formatPanel: {
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  pathPanel: {
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  pathTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  pathText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  notePanel: {
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#fff7e6',
    borderWidth: 1,
    borderColor: '#f0d49a',
    padding: 14,
  },
  noteTitle: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '900',
  },
  noteText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
