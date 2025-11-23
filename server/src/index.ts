// file: server/src/index.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { initDb, query, run } from './db';

// Disable Sharp cache
sharp.cache(false);

// --- CONFIGURATION ---
const QR_BASE_URL = process.env.QR_BASE_URL || "http://172.20.20.202:32104"; 
const UPLOADS_DIR = process.env.UPLOADS_DIR_PATH || path.join(__dirname, '../uploads');
const IS_DEV = process.env.NODE_ENV !== 'production'; 

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(UPLOADS_DIR, {
    maxAge: '365d',
    immutable: true 
}));

const FRONTEND_PATH = path.join(__dirname, '../public');
if (fs.existsSync(FRONTEND_PATH)) {
    app.use(express.static(FRONTEND_PATH));
}

initDb();

// --- Maintenance Tasks ---
const runMaintenance = async () => {
    if (IS_DEV) return;
    try {
        if (fs.existsSync(UPLOADS_DIR)) {
            const files = fs.readdirSync(UPLOADS_DIR);
            const items = await query('SELECT thumbnailPath FROM items WHERE thumbnailPath IS NOT NULL');
            const validFiles = new Set(items.map(i => path.basename(i.thumbnailPath)));
            for (const file of files) {
                if (!validFiles.has(file)) {
                    try { fs.unlinkSync(path.join(UPLOADS_DIR, file)); } catch(e) {}
                }
            }
        }
        await run('VACUUM');
    } catch (e) { console.error('[Maintenance] Error:', e); }
};

if (!IS_DEV) {
    setInterval(runMaintenance, 48 * 60 * 60 * 1000);
    setTimeout(runMaintenance, 10000);
}

// --- Helpers ---
const generateShortCode = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '', isUnique = false;
    while (!isUnique) {
        code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        const existing = await query('SELECT id FROM locations WHERE code = ?', [code]);
        if (existing.length === 0) isUnique = true;
    }
    return code;
};

const getDescendantIds = async (locId: string): Promise<string[]> => {
  let ids = [locId];
  const children = await query('SELECT id FROM locations WHERE parentId = ?', [locId]);
  for (const child of children) { ids = [...ids, ...await getDescendantIds(child.id)]; }
  return ids;
};

const getMaxDepth = async (locId: string, currentDepth: number = 1): Promise<number> => {
  const children = await query('SELECT id FROM locations WHERE parentId = ?', [locId]);
  if (children.length === 0) return currentDepth;
  let max = currentDepth;
  for (const child of children) {
    const depth = await getMaxDepth(child.id, currentDepth + 1);
    if (depth > max) max = depth;
  }
  return max;
};

const getParentDepth = async (parentId: string | null): Promise<number> => {
  if (!parentId) return 0;
  const parent = (await query('SELECT parentId FROM locations WHERE id = ?', [parentId]))[0];
  if (!parent) return 0;
  return 1 + await getParentDepth(parent.parentId);
};

const updatePathsRecursive = async (locId: string, parentPath: string) => {
    const self = (await query('SELECT name FROM locations WHERE id = ?', [locId]))[0];
    if(!self) return;
    const newPath = parentPath ? `${parentPath} / ${self.name}` : self.name;
    await run('UPDATE locations SET fullPath = ? WHERE id = ?', [newPath, locId]);
    const children = await query('SELECT id FROM locations WHERE parentId = ?', [locId]);
    for(const child of children) { await updatePathsRecursive(child.id, newPath); }
};

app.get('/api/config', (req, res) => { res.json({ qrBaseUrl: QR_BASE_URL }); });

// --- Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `temp-${Date.now()}-${Math.round(Math.random() * 1E9)}`)
});
const upload = multer({ storage });

app.post('/api/uploads/thumbnail', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const tempPath = req.file.path;
  try {
      const fileBuffer = fs.readFileSync(tempPath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      const hex = hashSum.digest('hex');
      const existing = await query('SELECT thumbnailPath FROM items WHERE imageHash = ? LIMIT 1', [hex]);
      if (existing.length > 0) {
          try { fs.unlinkSync(tempPath); } catch(e) {}
          return res.json({ path: existing[0].thumbnailPath, hash: hex });
      }
      const optimizedFilename = `${Date.now()}-${hex.substring(0, 8)}.webp`;
      const optimizedPath = path.join(UPLOADS_DIR, optimizedFilename);
      await sharp(fileBuffer).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(optimizedPath);
      try { fs.unlinkSync(tempPath); } catch (err) {}
      res.json({ path: `/uploads/${optimizedFilename}`, hash: hex });
  } catch (e) { 
      console.error(e); 
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(err) {}
      res.status(500).json({ error: 'Upload failed' }); 
  }
});

app.delete('/api/uploads', async (req, res) => {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Path required' });
    try {
        const usage = await query('SELECT count(*) as count FROM items WHERE thumbnailPath = ?', [filePath]);
        if (usage[0].count > 0) return res.json({ success: true, skipped: true });
        const fullPath = path.join(UPLOADS_DIR, path.basename(filePath));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Delete failed' }); }
});

// --- Locations/Tags APIs (Unchanged) ---
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await query(`SELECT l.*, COUNT(i.id) as itemCount FROM locations l LEFT JOIN items i ON l.id = i.locationId GROUP BY l.id ORDER BY l.fullPath ASC`);
    res.json(locations);
  } catch (e) { res.status(500).json({ error: e }); }
});
app.get('/api/locations/lookup/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const loc = await query('SELECT * FROM locations WHERE code = ?', [code]);
        if (loc.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(loc[0]);
    } catch (e) { res.status(500).json({ error: e }); }
});
app.post('/api/locations', async (req, res) => {
  const { name, parentId, note } = req.body;
  const parentDepth = await getParentDepth(parentId);
  if (parentDepth >= 4) return res.status(400).json({ error: 'Max depth reached.' });
  const id = uuidv4();
  const code = await generateShortCode();
  let fullPath = name;
  if (parentId) {
    const parents = await query('SELECT fullPath FROM locations WHERE id = ?', [parentId]);
    if (parents.length > 0) fullPath = `${parents[0].fullPath} / ${name}`;
  }
  await run('INSERT INTO locations (id, name, parentId, fullPath, note, code, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, name, parentId, fullPath, note || '', code, new Date().toISOString()]);
  res.json({ id, name, parentId, fullPath, note, code });
});
app.put('/api/locations/:id', async (req, res) => {
  const { id } = req.params;
  const { name, note } = req.body;
  try {
    await run('UPDATE locations SET name = ?, note = ? WHERE id = ?', [name, note || '', id]);
    const self = (await query('SELECT parentId FROM locations WHERE id = ?', [id]))[0];
    let parentPath = '';
    if(self.parentId) {
       const p = (await query('SELECT fullPath FROM locations WHERE id = ?', [self.parentId]))[0];
       if(p) parentPath = p.fullPath;
    }
    await updatePathsRecursive(id, parentPath);
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e}); }
});
app.put('/api/locations/:id/move', async (req, res) => {
  const { id } = req.params;
  const { newParentId } = req.body;
  try {
    if (id === newParentId) return res.status(400).json({ error: 'Self move' });
    const descendants = await getDescendantIds(id);
    if (descendants.includes(newParentId)) return res.status(400).json({ error: 'Descendant move' });
    const subtreeDepth = await getMaxDepth(id);
    const targetParentDepth = await getParentDepth(newParentId);
    if (targetParentDepth + subtreeDepth > 4) return res.status(400).json({ error: 'Max depth' });
    await run('UPDATE locations SET parentId = ? WHERE id = ?', [newParentId, id]);
    let parentPath = '';
    if(newParentId) {
        const p = (await query('SELECT fullPath FROM locations WHERE id = ?', [newParentId]))[0];
        if(p) parentPath = p.fullPath;
    }
    await updatePathsRecursive(id, parentPath);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});
app.delete('/api/locations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const idsToDelete = await getDescendantIds(id);
    if (idsToDelete.length > 0) {
      const placeholders = idsToDelete.map(() => '?').join(',');
      await run(`UPDATE items SET locationId = NULL WHERE locationId IN (${placeholders})`, idsToDelete);
      await run(`DELETE FROM locations WHERE id IN (${placeholders})`, idsToDelete);
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: e}); }
});
app.get('/api/tags', async (req, res) => {
  const tags = await query('SELECT * FROM tags ORDER BY name ASC');
  res.json(tags);
});
app.post('/api/tags', async (req, res) => {
  const { name } = req.body;
  const existing = await query('SELECT * FROM tags WHERE name = ?', [name]);
  if (existing.length > 0) return res.json(existing[0]);
  const id = uuidv4();
  await run('INSERT INTO tags (id, name, createdAt) VALUES (?, ?, ?)', [id, name, new Date().toISOString()]);
  res.json({ id, name });
});
app.put('/api/tags/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try { await run('UPDATE tags SET name = ? WHERE id = ?', [name, id]); res.json({ success: true }); } catch(e) { res.status(500).json({error: e}); }
});
app.delete('/api/tags/:id', async (req, res) => {
  const { id } = req.params;
  try { await run('DELETE FROM item_tags WHERE tagId = ?', [id]); await run('DELETE FROM tags WHERE id = ?', [id]); res.json({ success: true }); } catch(e) { res.status(500).json({error: e}); }
});

// --- ITEMS API (Modified for Sorting) ---
app.get('/api/items', async (req, res) => {
  const { 
    search, locationId, includeDescendants, tagIds, purchaseDateFrom, purchaseDateTo, onlyArchived, 
    page = 1, limit = 50,
    sortBy = 'updatedAt', sortOrder = 'desc' // Default Sort
  } = req.query;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (onlyArchived === 'true') where += ' AND i.isArchived = 1';
  else where += ' AND i.isArchived = 0';

  if (search) {
    where += ` AND (i.name LIKE ? OR i.note LIKE ? OR l.fullPath LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (locationId) {
    if (includeDescendants === 'true') {
       const locs = await query('SELECT fullPath FROM locations WHERE id = ?', [locationId]);
       if (locs.length > 0) { where += ' AND l.fullPath LIKE ?'; params.push(`${locs[0].fullPath}%`); }
    } else { where += ' AND i.locationId = ?'; params.push(locationId); }
  }
  if (purchaseDateFrom) { where += ' AND i.purchaseDate >= ?'; params.push(purchaseDateFrom); }
  if (purchaseDateTo) { where += ' AND i.purchaseDate <= ?'; params.push(purchaseDateTo); }
  if (tagIds && typeof tagIds === 'string' && tagIds.length > 0) {
    const tags = tagIds.split(',');
    for (const tagId of tags) {
      where += ` AND EXISTS (SELECT 1 FROM item_tags it WHERE it.itemId = i.id AND it.tagId = ?)`;
      params.push(tagId);
    }
  }

  // Sorting Map (Whitelist columns)
  const sortMap: Record<string, string> = {
      'name': 'i.name',
      'location': 'l.fullPath',
      'createdAt': 'i.createdAt',
      'updatedAt': 'i.updatedAt'
  };
  const dbSortCol = sortMap[String(sortBy)] || 'i.updatedAt';
  const dbSortDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  // Requirement: Secondary Sort by Name (Collating No Case if possible, but Name ASC is fine)
  const orderBy = `ORDER BY ${dbSortCol} ${dbSortDir}, i.name ASC`;

  try {
    const countResult = await query(`SELECT COUNT(DISTINCT i.id) as total FROM items i LEFT JOIN locations l ON i.locationId = l.id ${where}`, params);
    const total = countResult[0].total;
    
    const offset = (Number(page) - 1) * Number(limit);
    const sql = `
      SELECT 
        i.*, 
        l.fullPath as locationName,
        (
           SELECT GROUP_CONCAT(t.id || ':::' || t.name, '|||')
           FROM item_tags it
           JOIN tags t ON it.tagId = t.id
           WHERE it.itemId = i.id
        ) as tags_data
      FROM items i 
      LEFT JOIN locations l ON i.locationId = l.id 
      ${where}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    const rows = await query(sql, [...params, limit, offset]);
    const items = rows.map(row => {
        const tagList = [];
        if (row.tags_data) {
            const rawTags = row.tags_data.split('|||');
            for (const rt of rawTags) {
                const parts = rt.split(':::');
                if (parts.length === 2) tagList.push({ id: parts[0], name: parts[1] });
            }
        }
        const { tags_data, ...rest } = row;
        return { ...rest, tags: tagList, isArchived: !!rest.isArchived };
    });

    res.json({
      data: items,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (e) { 
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch items' }); 
  }
});

// ... (Rest: POST/PUT items same as before) ...
app.post('/api/items', async (req, res) => {
  const { name, note, quantity, quantityUnit, purchasePrice, purchasePriceCurrency, purchaseDate, locationId, tagIds, isArchived, thumbnailPath, imageHash } = req.body;
  const id = uuidv4(); const now = new Date().toISOString();
  try {
    await run(`INSERT INTO items (id, name, note, quantity, quantityUnit, purchasePrice, purchasePriceCurrency, purchaseDate, locationId, isArchived, thumbnailPath, imageHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, name, note, quantity, quantityUnit, purchasePrice, purchasePriceCurrency, purchaseDate, locationId, isArchived ? 1 : 0, thumbnailPath, imageHash, now, now]);
    if (tagIds && Array.isArray(tagIds)) { for (const tagId of tagIds) await run('INSERT INTO item_tags (itemId, tagId) VALUES (?, ?)', [id, tagId]); }
    res.json({ id, ...req.body });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, note, quantity, quantityUnit, purchasePrice, purchasePriceCurrency, purchaseDate, locationId, tagIds, isArchived, thumbnailPath, imageHash } = req.body;
  const now = new Date().toISOString();
  try {
    await run(`UPDATE items SET name=?, note=?, quantity=?, quantityUnit=?, purchasePrice=?, purchasePriceCurrency=?, purchaseDate=?, locationId=?, isArchived=?, thumbnailPath=?, imageHash=?, updatedAt=? WHERE id=?`, [name, note, quantity, quantityUnit, purchasePrice, purchasePriceCurrency, purchaseDate, locationId, isArchived ? 1 : 0, thumbnailPath, imageHash, now, id]);
    await run('DELETE FROM item_tags WHERE itemId = ?', [id]);
    if (tagIds && Array.isArray(tagIds)) { for (const tagId of tagIds) await run('INSERT INTO item_tags (itemId, tagId) VALUES (?, ?)', [id, tagId]); }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});
app.post('/api/items/bulk/archive', async (req, res) => { const { itemIds, archive } = req.body; try { const placeholders = itemIds.map(() => '?').join(','); await run(`UPDATE items SET isArchived = ? WHERE id IN (${placeholders})`, [archive ? 1 : 0, ...itemIds]); res.json({ success: true }); } catch(e) { res.status(500).json({error: e}); } });
app.post('/api/items/bulk/delete', async (req, res) => { const { itemIds } = req.body; try { const placeholders = itemIds.map(() => '?').join(','); await run(`DELETE FROM item_tags WHERE itemId IN (${placeholders})`, [...itemIds]); await run(`DELETE FROM items WHERE id IN (${placeholders})`, [...itemIds]); res.json({ success: true }); } catch(e) { res.status(500).json({error: e}); } });
app.post('/api/items/bulk/move', async (req, res) => { const { itemIds, destinationLocationId } = req.body; try { const placeholders = itemIds.map(() => '?').join(','); await run(`UPDATE items SET locationId = ? WHERE id IN (${placeholders})`, [destinationLocationId, ...itemIds]); res.json({ success: true }); } catch(e) { res.status(500).json({error: e}); } });

app.get('*', (req, res) => {
    const indexHtml = path.join(FRONTEND_PATH, 'index.html');
    if (fs.existsSync(indexHtml)) res.sendFile(indexHtml);
    else res.send('Inventory API Server running.');
});

const HOST = IS_DEV ? '127.0.0.1' : '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});