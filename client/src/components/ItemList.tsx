// file: client/src/components/ItemList.tsx
import { useState } from 'react';
import { createPortal } from 'react-dom'; 
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
    
    // Mobile friendly pagination: Simplified
    const isMobile = window.innerWidth < 768; // Simple check, or use CSS hidden classes
    
    const windowSize = 11; 
    const side = Math.floor(windowSize / 2);
    let start = Math.max(1, page - side);
    let end = Math.min(totalPages, page + side);
    if (page <= side) end = Math.min(totalPages, windowSize);
    else if (page > totalPages - side) start = Math.max(1, totalPages - windowSize + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
        
        {/* Desktop Pagination */}
        <div className="hidden md:flex gap-1">
            {start > 1 && (<><button onClick={() => onPageChange(1)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-50">1</button>{start > 2 && <span className="px-1 text-gray-400">...</span>}</>)}
            {pages.map(p => (<button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${p === page ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>))}
            {end < totalPages && (<>{end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}<button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-50">{totalPages}</button></>)}
        </div>

        {/* Mobile Pagination (Simple) */}
        <span className="md:hidden text-sm px-2">{page} / {totalPages}</span>

        <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1 rounded border border-gray-300 bg-white text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
      </div>
    );
  };

  const SortHeader = ({ label, sortKey }: { label: string, sortKey: string }) => {
      if (!sortConfig || !onSortChange) return <th className="px-3 py-3.5 text-left font-semibold">{label}</th>;
      const isActive = sortConfig.key === sortKey;
      return (
          <th 
            className="px-3 py-3.5 text-left font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none group whitespace-nowrap"
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
          <table className="w-full text-sm">
            {/* Hidden on Mobile */}
            <thead className="hidden md:table-header-group bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 text-gray-500 dark:text-gray-400">
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

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 block md:table-row-group">
              {items.length === 0 && (
                <tr className="block md:table-row"><td colSpan={7} className="p-12 text-center text-gray-400 block md:table-cell">No items found.</td></tr>
              )}
              {items.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const rowClass = item.isArchived ? 'opacity-60 grayscale bg-gray-50 dark:bg-gray-800/30' : 'bg-white dark:bg-transparent';
                
                // Mobile Card Style vs Desktop Row Style
                return (
                  <tr 
                    key={item.id} 
                    className={`
                        group block md:table-row 
                        ${isSelected ? 'bg-primary/5 dark:bg-primary/10 border-primary' : rowClass}
                        border-b border-gray-100 last:border-0 md:border-0
                        transition-colors
                        hover:bg-gray-50 dark:hover:bg-gray-800/50
                    `}
                  >
                    {/* Checkbox: Absolute on mobile or first col on desktop */}
                    <td className="p-3 pl-4 md:py-4 md:pl-4 md:pr-3 flex md:table-cell items-center justify-between md:justify-start bg-gray-50 md:bg-transparent">
                      <div className="md:hidden font-bold text-gray-400 text-xs">#{item.id.substring(0,4)}</div>
                      <input 
                        type="checkbox" 
                        className="h-5 w-5 md:h-4 md:w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                      />
                    </td>
                    
                    {/* Item Main Info */}
                    <td className="px-4 py-3 md:px-3 md:py-4 font-medium text-gray-900 dark:text-white cursor-pointer block md:table-cell" onClick={() => onEdit(item)}>
                      <div className="flex items-start md:items-center gap-4">
                        {item.thumbnailPath ? (
                          <img 
                            src={item.thumbnailPath} 
                            className="h-16 w-16 md:h-10 md:w-10 rounded object-cover bg-gray-200 border border-gray-200 hover:opacity-80 transition-opacity cursor-zoom-in shrink-0" 
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(item.thumbnailPath); }}
                            alt="" 
                          />
                        ) : (
                          <div className="h-16 w-16 md:h-10 md:w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-600 shrink-0">
                            <span className="material-symbols-outlined text-2xl md:text-xl">image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                             <span className="font-bold text-base md:text-[15px] truncate block w-full md:w-auto">{item.name}</span>
                             {item.isArchived && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-bold">ARCHIVED</span>}
                             {item.note && (
                               <div className="relative group/info inline-flex">
                                 <span className="material-symbols-outlined text-gray-300 hover:text-primary text-base cursor-help" onMouseEnter={() => setActiveNoteId(item.id)} onMouseLeave={() => setActiveNoteId(null)}>info</span>
                                 {activeNoteId === item.id && (<div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-lg shadow-xl w-48 z-50 pointer-events-none">{item.note}</div>)}
                               </div>
                             )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 md:mt-0.5 font-normal flex items-center gap-2">
                              <span>{item.quantity} {item.quantityUnit}</span>
                              {/* Mobile only price display next to qty */}
                              <span className="md:hidden text-gray-400">|</span>
                              <span className="md:hidden font-mono text-gray-700">{item.purchasePrice ? `${item.purchasePriceCurrency||'$'}${item.purchasePrice}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Location */}
                    <td className="px-4 py-1 md:px-3 md:py-4 text-gray-600 dark:text-gray-400 text-sm block md:table-cell">
                      <div className="md:hidden text-xs text-gray-400 mb-1 uppercase font-bold">Location</div>
                      {item.locationName ? (
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium inline-block max-w-full truncate">{item.locationName}</span>
                      ) : (
                        <span className="text-red-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    
                    {/* Price (Desktop) */}
                    <td className="px-3 py-4 text-gray-600 dark:text-gray-400 text-sm font-mono hidden md:table-cell">
                      {item.purchasePrice ? `${item.purchasePriceCurrency || '$'}${item.purchasePrice}` : '-'}
                    </td>
                    
                    {/* Tags */}
                    <td className="px-4 py-2 md:px-3 md:py-4 block md:table-cell pb-4 md:pb-4">
                      <div className="flex flex-wrap gap-1 relative group/tags">
                        {item.tags.slice(0, 2).map(t => (
                          <span key={t.id} className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 max-w-[5rem] truncate">
                            {t.name}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 cursor-help">
                            +{item.tags.length - 2}
                          </span>
                        )}
                        {/* Tag Tooltip */}
                        {item.tags.length > 2 && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tags:block p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg w-48 z-50 pointer-events-none">
                                <div className="flex flex-wrap gap-1.5">
                                    {item.tags.map(t => (<span key={t.id} className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">{t.name}</span>))}
                                </div>
                            </div>
                        )}
                      </div>
                    </td>

                    {/* Dates (Desktop Only) */}
                    <td className="px-3 py-4 text-gray-500 dark:text-gray-500 text-xs hidden md:table-cell">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-3 py-4 text-gray-500 dark:text-gray-500 text-xs hidden md:table-cell">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
             <span className="text-sm text-gray-500 hidden md:inline">Total {pagination.totalItems} items</span>
             {renderPagination()}
          </div>
        )}
      </div>

      {/* Portal Tooltip (Desktop) */}
      {tagTooltip && createPortal(
          <div className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 shadow-xl rounded-lg p-2 w-48 pointer-events-none" style={{ top: tagTooltip.y - 8, left: tagTooltip.x, transform: 'translate(-50%, -100%)' }}>
              <div className="flex flex-wrap gap-1.5">{tagTooltip.tags.map(t => (<span key={t.id} className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">{t.name}</span>))}</div>
          </div>,
          document.body
      )}

      {previewImage && <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />}
    </>
  );
}