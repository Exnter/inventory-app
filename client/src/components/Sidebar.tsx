// file: client/src/components/Sidebar.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchLocations, fetchTags } from '../api';
import { Location, Tag } from '../types';
import { translations, Lang } from '../locales';

interface Props {
  lang: Lang;
  onChange: (filters: any) => void;
  refreshKey: number;
  activeLocationId?: string | null;
}

export default function Sidebar({ lang, onChange, refreshKey, activeLocationId }: Props) {
  const t = translations[lang];
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [selLoc, setSelLoc] = useState<string | null>(null);
  const [selTags, setSelTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [expandedLocs, setExpandedLocs] = useState<string[]>([]);

  // 初始化锁：防止挂载时自动触发 onChange 导致 App 重渲染
  const isMounted = useRef(false);

  // Sync prop -> state
  useEffect(() => {
    if (activeLocationId !== undefined && activeLocationId !== selLoc) {
      setSelLoc(activeLocationId);
    }
  }, [activeLocationId]); 

  // Load Data
  useEffect(() => {
    let mounted = true;
    fetchLocations().then(r => {
        if(mounted) {
            setLocations(r.data);
            if (expandedLocs.length === 0) {
                setExpandedLocs(r.data.filter(l => !l.parentId).map(l => l.id));
            }
        }
    });
    fetchTags().then(r => {
        if(mounted) setTags(r.data);
    });
    return () => { mounted = false; };
  }, [refreshKey]);

  // Debounce Filter Change
  useEffect(() => {
    // 跳过首次渲染的触发，除非有默认值需要同步
    if (!isMounted.current) {
        isMounted.current = true;
        return;
    }

    const timer = setTimeout(() => {
      onChange({
        locationId: selLoc,
        includeDescendants: true,
        purchaseDateFrom: dateFrom,
        purchaseDateTo: dateTo,
        tagIds: selTags.join(','),
        showArchived
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [selLoc, selTags, dateFrom, dateTo, showArchived]);

  const locationCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      const getCount = (id: string): number => {
          if (counts[id] !== undefined) return counts[id];
          const directCount = locations.find(l => l.id === id)?.itemCount || 0;
          const children = locations.filter(l => l.parentId === id);
          let total = directCount;
          for (const child of children) total += getCount(child.id);
          counts[id] = total;
          return total;
      };
      locations.forEach(l => getCount(l.id));
      return counts;
  }, [locations]);

  const toggleTag = (id: string) => {
    if (selTags.includes(id)) setSelTags(selTags.filter(t => t !== id));
    else setSelTags([...selTags, id]);
  };

  const toggleExpand = (e: any, id: string) => {
      e.stopPropagation();
      if(expandedLocs.includes(id)) setExpandedLocs(expandedLocs.filter(x => x !== id));
      else setExpandedLocs([...expandedLocs, id]);
  };

  const renderLocNode = (loc: Location) => {
      const children = locations.filter(l => l.parentId === loc.id);
      const isExpanded = expandedLocs.includes(loc.id);
      const isSelected = selLoc === loc.id;
      const count = locationCounts[loc.id] || 0;
      
      return (
          <div key={loc.id} className="flex flex-col">
              <div 
                 className={`flex items-center justify-between h-9 px-1 rounded-lg cursor-pointer mb-0.5 transition-colors select-none
                    ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                 onClick={() => setSelLoc(isSelected ? null : loc.id)}
              >
                  <div className="flex items-center gap-1 overflow-hidden flex-1">
                      {children.length > 0 ? (
                          <span 
                            onClick={(e) => toggleExpand(e, loc.id)}
                            className={`material-symbols-outlined text-gray-400 hover:text-gray-600 text-base p-0.5 rounded hover:bg-gray-200 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                          >
                              expand_more
                          </span>
                      ) : <span className="w-5"></span>}
                      <span className="truncate text-sm">{loc.name}</span>
                  </div>
                  {count > 0 && <span className="text-xs text-gray-400 ml-2 px-2">{count}</span>}
              </div>
              {isExpanded && children.length > 0 && (
                  <div className="pl-4 border-l border-gray-100 dark:border-gray-800 ml-2.5">
                      {children.map(child => renderLocNode(child))}
                  </div>
              )}
          </div>
      );
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark h-full">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 pb-2 shrink-0">
           <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 select-none">{translations[lang].location}</h2>
           <div 
              onClick={() => setSelLoc(null)}
              className={`flex h-9 cursor-pointer items-center rounded-lg px-3 text-sm font-medium mb-1 transition-colors select-none
                ${selLoc === null ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
           >
              {translations[lang].allLocations}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4">
           {locations.filter(l => !l.parentId).map(l => renderLocNode(l))}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-6 shrink-0">
           <div>
             <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 select-none">{translations[lang].tags}</h2>
             <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
               {tags.map(t => (
                 <div key={t.id} onClick={() => toggleTag(t.id)} className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer select-none transition-all ${selTags.includes(t.id) ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}>{t.name}</div>
               ))}
             </div>
           </div>
           <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 select-none">{translations[lang].purchaseDate}</h2>
              <div className="flex flex-col gap-2">
                 <input type="date" className="form-input w-full text-xs py-1.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-primary" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                 <input type="date" className="form-input w-full text-xs py-1.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-primary" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
           </div>
           <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                 <input type="checkbox" className="form-checkbox rounded text-primary border-gray-300" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                 <span className="text-sm text-gray-700 dark:text-gray-300">{translations[lang].showArchived}</span>
              </label>
           </div>
           <button onClick={() => { setSelLoc(null); setSelTags([]); setDateFrom(''); setDateTo(''); setShowArchived(false); }} className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors select-none">{translations[lang].clearFilters}</button>
        </div>
      </div>
    </aside>
  );
}