// file: server/src/db.ts
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_FILE_PATH || path.join(__dirname, '../inventory.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR_PATH || path.join(__dirname, '../uploads');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Helper to run safely
const runSafe = (sql: string): Promise<void> => {
    return new Promise((resolve) => {
        db.run(sql, (err) => {
            if (err && !err.message.includes('duplicate column') && !err.message.includes('unique constraint')) {
                console.warn(`[DB Warning] ${err.message}`);
            }
            resolve();
        });
    });
};

export const initDb = async () => {
  db.serialize(async () => {
    // Locations
    db.run(`CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parentId TEXT,
      fullPath TEXT NOT NULL,
      note TEXT,
      code TEXT UNIQUE, 
      createdAt TEXT,
      FOREIGN KEY(parentId) REFERENCES locations(id)
    )`);

    // Tags
    db.run(`CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      createdAt TEXT
    )`);

    // Items
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      note TEXT,
      quantity REAL DEFAULT 0,
      quantityUnit TEXT DEFAULT 'pcs',
      purchasePrice REAL,
      purchasePriceCurrency TEXT,
      purchaseDate TEXT,
      locationId TEXT,
      isArchived INTEGER DEFAULT 0,
      thumbnailPath TEXT,
      imageHash TEXT, 
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY(locationId) REFERENCES locations(id)
    )`);

    // ItemTags
    db.run(`CREATE TABLE IF NOT EXISTS item_tags (
      itemId TEXT,
      tagId TEXT,
      PRIMARY KEY (itemId, tagId),
      FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY(tagId) REFERENCES tags(id) ON DELETE CASCADE
    )`);
  });
  
  // 在 serialize 块之外执行迁移
  await runSafe("ALTER TABLE items ADD COLUMN imageHash TEXT;");
  await runSafe("ALTER TABLE locations ADD COLUMN note TEXT;");
  await runSafe("ALTER TABLE locations ADD COLUMN code TEXT;"); 
};

export const query = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql: string, params: any[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

export default db;