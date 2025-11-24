// file: client/src/components/ItemList.tsx
import { useState } from 'react';
import { createPortal } from 'react-dom'; // 引入 Portal
import { InventoryItem, Tag } from '../types';
import { translations, Lang } from '../locales';
import ImagePreview from './ImagePreview';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

interface Props {
  lang: Lang;
  items: InventoryItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onEdit: (item: InventoryItem) => void;
  pagination?: PaginationProps;
  sortConfig?: SortConfig;
  onSortChange?: (key: string) => void;
}

export default function ItemList({ lang, items, selectedIds, onToggleSelect, onSelectAll, onEdit, pagination, sortConfig, onSortChange }: Props) {
  const t = translations[lang];
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tagTooltip, setTagTooltip] = useState<{ x: number, y: number, tags: Tag[] } | null>(null);
  const handleSelectAll = () => {
    if (allSelected) onSelectAll([]);
    else onSelectAll(items.map(i => i.id));
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { page, totalPages, onPageChange } = pagination;
    const windowSize = 11;
    const side = Math.floor(windowSize / 2);
    let start = Math.max(1, page - side);
    let end = Math.min(totalPages, page + side);
    if (page <= side) end = Math.min(totalPages, windowSize);
    else if (page > totalPages - side) start = Math.max(1, totalPages - windowSize + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-1">
        <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
        {start > 1 && (<><button onClick={() => onPageChange(1)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-50">1</button>{start > 2 && <span className="px-1 text-gray-400">...</span>}</>)}
        {pages.map(p => (<button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${p === page ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>))}
        {end < totalPages && (<>{end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}<button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-50">{totalPages}</button></>)}
        <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
      </div>
    );
  };

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: string }) => {
      if (!sortConfig || !onSortChange) return <th className="px-3 py-3.5 text-left font-semibold">{label}</th>;
      const isActive = sortConfig.key === sortKey;
      return (
          <th 
            className="px-3 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none group"
            onClick={() => onSortChange(sortKey)}
          >
              <div className="flex items-center gap-1">
                  {label}
                  <span className={`material-symbols-outlined text-sm transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-30'}`}>
                      {isActive && sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                  </span>
              </div>
          </th>
      );
  };

  return (
    <>
      <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark flex flex-col shadow-sm">
        <div className="overflow-y-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left font-semibold w-12">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer" checked={allSelected} onChange={handleSelectAll} />
                </th>
                <SortHeader label={t.itemName} sortKey="name" />
                <SortHeader label={t.location} sortKey="location" />
                <th className="px-3 py-3.5 text-left font-semibold">{t.price}</th>
                <th className="px-3 py-3.5 text-left font-semibold">{t.tags}</th>
                <SortHeader label={t.added} sortKey="createdAt" />
                <SortHeader label={t.edited} sortKey="updatedAt" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.length === 0 && (<tr><td colSpan={7} className="p-12 text-center text-gray-400">No items found.</td></tr>)}
              {items.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const rowClass = item.isArchived ? 'opacity-60 grayscale bg-gray-50 dark:bg-gray-800/30' : 'bg-white dark:bg-transparent';
                
                return (
                  <tr key={item.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : rowClass}`}>
                    <td className="py-4 pl-4 pr-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer" checked={isSelected} onChange={() => onToggleSelect(item.id)} />
                    </td>
                    <td className="px-3 py-4 font-medium text-gray-900 dark:text-white cursor-pointer" onClick={() => onEdit(item)}>
                      <div className="flex items-center gap-4">
                        {item.thumbnailPath ? (
                          <img src={item.thumbnailPath} className="h-10 w-10 rounded object-cover bg-gray-200 border border-gray-200 hover:opacity-80 transition-opacity cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setPreviewImage(item.thumbnailPath); }} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-600"><span className="material-symbols-outlined text-xl">image</span></div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-[15px]">{item.name}</span>
                             {item.isArchived && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-bold">ARCHIVED</span>}
                             {item.note && (
                               <div className="relative group/info">
                                 <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 hover:text-primary text-[16px] cursor-help transition-colors" onMouseEnter={() => setActiveNoteId(item.id)} onMouseLeave={() => setActiveNoteId(null)}>info</span>
                                 {activeNoteId === item.id && (<div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg shadow-xl w-48 z-50 pointer-events-none">{item.note}</div>)}
                               </div>
                             )}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5 font-normal">{item.quantity} {item.quantityUnit}</div>
                        </div>
                      </div>
                    </td>    
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-400 text-sm">{item.locationName ? (<span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-medium inline-block leading-6 break-words text-gray-700 dark:text-gray-300">{item.locationName}</span>) : (<span className="text-red-400 text-xs italic">Unassigned</span>)}
                    </td>
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-400 text-sm font-mono">{item.purchasePrice ? `${item.purchasePriceCurrency || '$'}${item.purchasePrice}` : '-'}</td>
                    {/* Tags Column */}
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map(t => (
                          <span key={t.id} className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 max-w-[5rem] truncate">
                            {t.name}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span 
                             className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 cursor-help"
                             onMouseEnter={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 setTagTooltip({
                                     x: rect.left + rect.width / 2,
                                     y: rect.top,
                                     tags: item.tags
                                 });
                             }}
                             onMouseLeave={() => setTagTooltip(null)}
                          >
                            +{item.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-gray-500 dark:text-gray-500 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-4 text-gray-500 dark:text-gray-500 text-xs">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
             <span className="text-sm text-gray-500">Total {pagination.totalItems} items</span>
             {renderPagination()}
          </div>
        )}
      </div>
      {previewImage && <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />}
      {tagTooltip && createPortal(
          <div 
              className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-2 w-48 pointer-events-none"
              style={{
                  top: tagTooltip.y - 8,
                  left: tagTooltip.x,
                  transform: 'translate(-50%, -100%)'
              }}
          >
              <div className="flex flex-wrap gap-1.5">
                  {tagTooltip.tags.map(t => (
                      <span key={t.id} className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 break-all">
                          {t.name}
                      </span>
                  ))}
              </div>
          </div>,
          document.body
      )}
    </>
  );
}
