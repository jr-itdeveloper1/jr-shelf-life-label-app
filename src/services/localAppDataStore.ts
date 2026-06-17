import * as SQLite from 'expo-sqlite';

import type { Outlet, OutletProduct, PrintJob, Product, ProductCategory } from '../domain/models';

export type LocalAppData = {
  categories: ProductCategory[];
  outlets: Outlet[];
  products: Product[];
  outletProducts: OutletProduct[];
  printJobs: PrintJob[];
};

type CollectionName = keyof LocalAppData;
type StoredRow = {
  json: string;
};

const databaseName = 'jr-shelf-life-label-app.db';
const collectionTables: Record<CollectionName, string> = {
  categories: 'local_categories',
  outlets: 'local_outlets',
  products: 'local_products',
  outletProducts: 'local_outlet_products',
  printJobs: 'local_print_jobs',
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export async function loadLocalAppData(): Promise<LocalAppData | null> {
  const database = await openLocalDatabase();
  const appData: LocalAppData = {
    categories: await loadCollection<ProductCategory>(database, 'categories'),
    outlets: await loadCollection<Outlet>(database, 'outlets'),
    products: await loadCollection<Product>(database, 'products'),
    outletProducts: await loadCollection<OutletProduct>(database, 'outletProducts'),
    printJobs: await loadCollection<PrintJob>(database, 'printJobs'),
  };

  const hasStoredData = Object.values(appData).some((items) => items.length > 0);
  return hasStoredData ? appData : null;
}

export async function replaceLocalAppData(appData: LocalAppData) {
  await enqueueWrite(async () => {
    const database = await openLocalDatabase();

    await runInTransaction(database, async () => {
      await replaceCollection(database, 'categories', appData.categories);
      await replaceCollection(database, 'outlets', appData.outlets);
      await replaceCollection(database, 'products', appData.products);
      await replaceCollection(database, 'outletProducts', appData.outletProducts);
      await replaceCollection(database, 'printJobs', appData.printJobs);
    });
  });
}

export async function replaceLocalMasterData(appData: Omit<LocalAppData, 'printJobs'>) {
  await enqueueWrite(async () => {
    const database = await openLocalDatabase();

    await runInTransaction(database, async () => {
      await replaceCollection(database, 'categories', appData.categories);
      await replaceCollection(database, 'outlets', appData.outlets);
      await replaceCollection(database, 'products', appData.products);
      await replaceCollection(database, 'outletProducts', appData.outletProducts);
    });
  });
}

export async function replaceLocalPrintJobs(printJobs: PrintJob[]) {
  await enqueueWrite(async () => {
    const database = await openLocalDatabase();

    await runInTransaction(database, async () => {
      await replaceCollection(database, 'printJobs', printJobs);
    });
  });
}

async function openLocalDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(databaseName).then(async (database) => {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS local_categories (
        id TEXT PRIMARY KEY NOT NULL,
        sort_order INTEGER NOT NULL,
        json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_outlets (
        id TEXT PRIMARY KEY NOT NULL,
        sort_order INTEGER NOT NULL,
        json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_products (
        id TEXT PRIMARY KEY NOT NULL,
        sort_order INTEGER NOT NULL,
        json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_outlet_products (
        id TEXT PRIMARY KEY NOT NULL,
        sort_order INTEGER NOT NULL,
        json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS local_print_jobs (
        id TEXT PRIMARY KEY NOT NULL,
        sort_order INTEGER NOT NULL,
        json TEXT NOT NULL
      );
    `);

    return database;
  });

  return databasePromise;
}

async function loadCollection<T extends { id: string }>(
  database: SQLite.SQLiteDatabase,
  collectionName: CollectionName,
) {
  const rows = await database.getAllAsync<StoredRow>(
    `SELECT json FROM ${collectionTables[collectionName]} ORDER BY sort_order ASC`,
  );

  return rows.flatMap((row) => {
    try {
      const item = JSON.parse(row.json) as T;
      return item && typeof item.id === 'string' ? [item] : [];
    } catch {
      return [];
    }
  });
}

async function replaceCollection<T extends { id: string }>(
  database: SQLite.SQLiteDatabase,
  collectionName: CollectionName,
  items: T[],
) {
  const tableName = collectionTables[collectionName];
  await database.runAsync(`DELETE FROM ${tableName}`);

  for (const [sortOrder, item] of items.entries()) {
    await database.runAsync(
      `INSERT OR REPLACE INTO ${tableName} (id, sort_order, json) VALUES (?, ?, ?)`,
      item.id,
      sortOrder,
      JSON.stringify(item),
    );
  }
}

async function runInTransaction(database: SQLite.SQLiteDatabase, action: () => Promise<void>) {
  await database.execAsync('BEGIN IMMEDIATE TRANSACTION');

  try {
    await action();
    await database.execAsync('COMMIT');
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}

async function enqueueWrite(action: () => Promise<void>) {
  const nextWrite = writeQueue.catch(() => undefined).then(action);
  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}
