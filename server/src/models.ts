export interface DbItem {
  id: string;
  name: string;
  note: string | null;
  quantity: number;
  quantityUnit: string;
  purchasePrice: number | null;
  purchasePriceCurrency: string | null;
  purchaseDate: string; // ISO
  locationId: string | null;
  isArchived: number; // 0 or 1
  thumbnailPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbLocation {
  id: string;
  name: string;
  parentId: string | null;
  fullPath: string;
  createdAt: string;
}

export interface DbTag {
  id: string;
  name: string;
  createdAt: string;
}