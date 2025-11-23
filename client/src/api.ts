// file: client/src/api.ts
import axios from 'axios';
import { InventoryItem, Tag, Location } from './types';

export const api = axios.create({ baseURL: '/api' });

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Items ---
export const fetchItems = (params: any) => {
  const safeParams = { ...params };
  if (safeParams.showArchived !== undefined) {
    safeParams.onlyArchived = safeParams.showArchived ? 'true' : 'false';
    delete safeParams.showArchived;
  }
  if (Array.isArray(safeParams.tagIds)) {
      safeParams.tagIds = safeParams.tagIds.join(',');
  }
  if (!safeParams.page) safeParams.page = 1;
  if (!safeParams.limit) safeParams.limit = 50;
  
  // Sort params (handled by App state, but ensuring defaults here)
  if (!safeParams.sortBy) safeParams.sortBy = 'updatedAt';
  if (!safeParams.sortOrder) safeParams.sortOrder = 'desc';

  return api.get<PaginatedResponse<InventoryItem>>('/items', { params: safeParams });
};

export const createItem = (data: any) => api.post('/items', data);
export const updateItem = (id: string, data: any) => api.put(`/items/${id}`, data);
export const deleteItems = (itemIds: string[]) => api.post('/items/bulk/delete', { itemIds });
export const archiveItems = (itemIds: string[], archive: boolean) => api.post('/items/bulk/archive', { itemIds, archive });
export const moveItems = (itemIds: string[], destinationLocationId: string) => api.post('/items/bulk/move', { itemIds, destinationLocationId });

// --- Locations ---
export const fetchLocations = () => api.get<Location[]>('/locations');
export const createLocation = (name: string, parentId: string | null, note?: string) => api.post<Location>('/locations', { name, parentId, note });
export const updateLocation = (id: string, name: string, note?: string) => api.put(`/locations/${id}`, { name, note });
export const deleteLocation = (id: string) => api.delete(`/locations/${id}`);
export const moveLocation = (id: string, newParentId: string | null) => api.put(`/locations/${id}/move`, { newParentId });
export const fetchLocationByCode = (code: string) => api.get<Location>(`/locations/lookup/${code}`);

// --- Tags ---
export const fetchTags = () => api.get<Tag[]>('/tags');
export const createTag = (name: string) => api.post<Tag>('/tags', { name });
export const updateTag = (id: string, name: string) => api.put(`/tags/${id}`, { name });
export const deleteTag = (id: string) => api.delete(`/tags/${id}`);

// --- System / Upload ---
export const fetchConfig = () => api.get<{qrBaseUrl: string}>('/config');

export const deleteImage = (path: string) => api.delete('/uploads', { data: { path } });

export const uploadThumbnail = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<{path: string; hash?: string}>('/uploads/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};