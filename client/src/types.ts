// file: client/src/types.ts
export interface Location {
  id: string;
  name: string;
  parentId: string | null;
  fullPath: string;
  note?: string;
  itemCount?: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  note: string | null;
  quantity: number;
  quantityUnit: string;
  purchasePrice: number | null;
  purchasePriceCurrency: string | null;
  purchaseDate: string;
  locationId: string | null;
  locationName?: string;
  isArchived: boolean;
  thumbnailPath: string | null;
  imageHash?: string | null; // 新增：用于图片去重
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  parentId: string | null;
  fullPath: string;
  note?: string;
  code?: string; // Added
  itemCount?: number;
}