// file: client/src/components/dialogs/MoveDialog.tsx
import { useState, useEffect, useMemo } from 'react';
import { Location, InventoryItem } from '../../types';
import { fetchLocations, createLocation } from '../../api';
import CascadingLocationSelect from '../CascadingLocationSelect';
import { translations, Lang } from '../../locales';

interface Props {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
  onConfirm: (locId: string) => Promise<void>;
}

export default function MoveDialog({ lang, open, onClose, selectedItems, onConfirm }: Props) {
  const t = translations[lang];
  const [locations, setLocations] = useState<Location[]>([]);
  const [targetLocId, setTargetLocId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  
  // Quick Create State
  const [showQuickLoc, setShowQuickLoc] = useState(false);
  const [quickLocName, setQuickLocName] = useState('');
  const [isQuickLocFocused, setIsQuickLocFocused] = useState(false);
  
  useEffect(() => {
    if(open) load();
  }, [open]);

  const load = () => {
    fetchLocations().then(r => setLocations(r.data));
    setTargetLocId(null);
    setNote('');
    setShowQuickLoc(false);
    setQuickLocName(''); // FIXED: 修正了变量名错误
  };

  // Highlight logic reuse
  const getCurrentDepth = (id: string | null) => {
      if(!id) return 0;
      let depth = 0;
      let curr = locations.find(l => l.id === id);
      while(curr) { depth++; curr = locations.find(l => l.id === curr?.parentId); }
      return depth;
  };
  const highlightLevel = useMemo(() => {
      if (!isQuickLocFocused) return null;
      const depth = getCurrentDepth(targetLocId);
      return Math.min(depth, 3); 
  }, [isQuickLocFocused, targetLocId, locations]);

  const handleCreateLoc = async () => {
    if(!quickLocName) return;
    const res = await createLocation(quickLocName, targetLocId);
    const r = await fetchLocations();
    setLocations(r.data);
    setTargetLocId(res.data.id);
    setQuickLocName('');
    setShowQuickLoc(false);
  };

  if (!open) return null;
  const isSingle = selectedItems.length === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isSingle ? t.moveItem : t.moveSelected.replace('{n}', String(selectedItems.length))}
          </h2>
          <button onClick={onClose}><span className="material-symbols-outlined text-gray-500">close</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isSingle ? (
            <div>
               <p className="text-sm text-gray-500 mb-1">Item</p>
               <p className="font-medium text-lg mb-4">{selectedItems[0].name}</p>
               <p className="text-sm text-gray-500 mb-1">{t.currentLocation}</p>
               <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
                 <span className="material-symbols-outlined text-gray-500">location_on</span>
                 <span className="font-medium">{selectedItems[0].locationName || 'Unassigned'}</span>
               </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">Items to be moved:</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-1">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm p-2 bg-white rounded border border-gray-100">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 text-xs">{item.locationName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white">{t.newLocation}</label>
              <button 
                onClick={() => { setShowQuickLoc(!showQuickLoc); setTimeout(() => document.getElementById('moveQuickLocInput')?.focus(), 50); }}
                className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-base">add_circle</span> {t.createLocation}
              </button>
            </div>

            {showQuickLoc && (
               <div className="flex gap-2 mb-3 p-2 bg-white rounded border border-primary/30 shadow-sm animate-in slide-in-from-top-2">
                  <input 
                    id="moveQuickLocInput"
                    className="form-input flex-1 text-sm py-1.5 rounded border-gray-300 focus:ring-primary" 
                    placeholder={`Create under: ${targetLocId ? (locations.find(l=>l.id===targetLocId)?.name || 'Root') : 'Root'}`}
                    value={quickLocName} onChange={e => setQuickLocName(e.target.value)}
                    onFocus={() => setIsQuickLocFocused(true)}
                    onBlur={() => setIsQuickLocFocused(false)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateLoc()}
                  />
                  <button onClick={handleCreateLoc} className="bg-primary text-white px-3 rounded text-sm font-bold">OK</button>
               </div>
            )}

            <CascadingLocationSelect 
              locations={locations} 
              value={targetLocId} 
              onChange={setTargetLocId} 
              highlightLevel={highlightLevel}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">{t.optionalNote}</label>
            <input 
              className="form-input w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary" 
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white border border-gray-300 font-bold text-sm hover:bg-gray-50">{t.cancel}</button>
          <button 
            onClick={() => targetLocId && onConfirm(targetLocId)}
            disabled={!targetLocId}
            className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {t.move}
          </button>
        </div>
      </div>
    </div>
  );
}