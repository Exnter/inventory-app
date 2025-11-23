// file: client/src/components/LocationManager.tsx
import { useState, useEffect } from 'react';
import { fetchLocations, createLocation, updateLocation, deleteLocation, moveLocation } from '../api';
import { Location } from '../types';
import { translations, Lang } from '../locales';
import ConfirmDialog from './dialogs/ConfirmDialog';
import MoveDialog from './dialogs/MoveDialog'; // Reuse move dialog logic but adapt for location? No, need specialized tree selector

// Specialized Move Location Dialog
const MoveLocationModal = ({ isOpen, onClose, onConfirm, locations, movingLoc }: any) => {
    const [targetId, setTargetId] = useState('');
    if (!isOpen) return null;
    
    // Filter out self and descendants to prevent cycles
    const getDescendants = (id: string): string[] => {
        const children = locations.filter((l:any) => l.parentId === id);
        let res = [id];
        children.forEach((c:any) => res = [...res, ...getDescendants(c.id)]);
        return res;
    };
    const invalidIds = movingLoc ? getDescendants(movingLoc.id) : [];
    const validTargets = locations.filter((l:any) => !invalidIds.includes(l.id));

    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-96">
               <h3 className="font-bold mb-4">Move "{movingLoc?.name}" to...</h3>
               <select className="form-select w-full mb-4 rounded-lg" value={targetId} onChange={e => setTargetId(e.target.value)}>
                   <option value="">(Root)</option>
                   {validTargets.map((l:any) => (
                       <option key={l.id} value={l.id}>{l.fullPath}</option>
                   ))}
               </select>
               <div className="flex justify-end gap-2">
                   <button onClick={onClose} className="px-3 py-1.5 rounded bg-gray-200 text-sm font-bold">Cancel</button>
                   <button onClick={() => onConfirm(targetId || null)} className="px-3 py-1.5 rounded bg-primary text-white text-sm font-bold">Move</button>
               </div>
           </div>
       </div>
    );
};

// Recursive Node with Styling Fixes (Issue 1)
const LocationNode = ({ location, allLocations, level, onCreate, onEdit, onDelete, onMove }: any) => {
  const [expanded, setExpanded] = useState(true);
  const children = allLocations.filter((l:any) => l.parentId === location.id);
  const canAddChild = level < 3;

  return (
    <li className="group relative">
      {/* Issue 1 Fix: Line only spans height of content, not 100% of container. Using absolute with explicit bottom stop */}
      {level > 0 && (
         <div className="absolute left-[-12px] top-0 bottom-2 w-px bg-gray-300 dark:bg-gray-700" style={{ left: -14 }}></div>
      )}
      
      <div className={`flex items-center py-1 px-2 cursor-pointer rounded hover:bg-gray-100 transition-colors ${level === 0 ? 'mt-2 mb-1' : ''}`}>
        <span 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`material-symbols-outlined text-gray-400 hover:text-gray-600 text-lg p-0.5 transition-transform ${children.length === 0 ? 'invisible' : ''} ${expanded ? '' : '-rotate-90'}`}
        >
          keyboard_arrow_down
        </span>
        
        <span className={`material-symbols-outlined mx-2 text-base ${level === 0 ? 'text-primary' : 'text-gray-500'}`}>
          {level === 0 ? 'warehouse' : level === 1 ? 'view_column' : 'shelves'}
        </span>
        
        <div className="flex-1 flex flex-col">
            <span className={`text-sm ${level === 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} dark:text-gray-200`}>
              {location.name}
            </span>
            {location.note && <span className="text-[10px] text-gray-400">{location.note}</span>}
        </div>

        {location.itemCount !== undefined && location.itemCount > 0 && (
           <span className="text-xs text-gray-400 mr-2 bg-gray-50 border border-gray-200 px-1.5 rounded">
             {location.itemCount}
           </span>
        )}
        
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
           {canAddChild && (
             <button title="Add Child" onClick={(e) => {e.stopPropagation(); onCreate(location.id)}} className="hover:text-primary text-gray-400"><span className="material-symbols-outlined text-base">add</span></button>
           )}
           <button title="Edit/Note" onClick={(e) => {e.stopPropagation(); onEdit(location)}} className="hover:text-primary text-gray-400"><span className="material-symbols-outlined text-base">edit</span></button>
           <button title="Move" onClick={(e) => {e.stopPropagation(); onMove(location)}} className="hover:text-primary text-gray-400"><span className="material-symbols-outlined text-base">drive_file_move</span></button>
           <button title="Delete" onClick={(e) => {e.stopPropagation(); onDelete(location)}} className="hover:text-danger text-gray-400"><span className="material-symbols-outlined text-base">delete</span></button>
        </div>
      </div>

      {expanded && children.length > 0 && (
        <ul className="pl-6 border-l-0 ml-0">
          {children.map((child:any) => (
            <LocationNode key={child.id} location={child} allLocations={allLocations} level={level + 1} onCreate={onCreate} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function LocationManager({ lang }: { lang: Lang }) {
  const t = translations[lang];
  const [locations, setLocations] = useState<Location[]>([]);
  
  // UI States
  const [modalMode, setModalMode] = useState<'create'|'edit'|null>(null);
  const [activeLoc, setActiveLoc] = useState<Location|null>(null); // For edit/delete/move context
  const [parentId, setParentId] = useState<string|null>(null); // For create
  const [formData, setFormData] = useState({ name: '', note: '' });
  
  const [showDelete, setShowDelete] = useState(false);
  const [showMove, setShowMove] = useState(false);

  const load = () => fetchLocations().then(r => setLocations(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
      if(!formData.name) return;
      try {
          if (modalMode === 'create') {
              await createLocation(formData.name, parentId, formData.note);
          } else if (modalMode === 'edit' && activeLoc) {
              await updateLocation(activeLoc.id, formData.name, formData.note);
          }
          setModalMode(null);
          load();
      } catch(e) { alert('Operation failed (Check depth limits?)'); }
  };

  const handleMove = async (newParentId: string | null) => {
      if(activeLoc) {
          try {
            await moveLocation(activeLoc.id, newParentId);
            setShowMove(false);
            load();
          } catch(e) { alert('Move failed: Depth limit exceeded or invalid target.'); }
      }
  };

  const handleDelete = async () => {
      if(activeLoc) {
          await deleteLocation(activeLoc.id);
          setShowDelete(false);
          load();
      }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark h-full">
      <div className="mx-auto max-w-4xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.warehouseLayout}</h1>
           <button onClick={() => { setModalMode('create'); setParentId(null); setFormData({name:'', note:''}); }} className="bg-primary text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm">
             <span className="material-symbols-outlined">add_home</span> {t.addRoot}
           </button>
        </div>

        <ul>
            {locations.filter(l => !l.parentId).map(root => (
                <LocationNode 
                    key={root.id} location={root} allLocations={locations} level={0}
                    onCreate={(pid: string) => { setModalMode('create'); setParentId(pid); setFormData({name:'', note:''}); }}
                    onEdit={(loc: Location) => { setModalMode('edit'); setActiveLoc(loc); setFormData({name: loc.name, note: loc.note||''}); }}
                    onDelete={(loc: Location) => { setActiveLoc(loc); setShowDelete(true); }}
                    onMove={(loc: Location) => { setActiveLoc(loc); setShowMove(true); }}
                />
            ))}
        </ul>
      </div>

      {/* Edit/Create Modal */}
      {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-96">
                  <h3 className="font-bold mb-4">{modalMode === 'create' ? 'New Location' : 'Edit Location'}</h3>
                  <input className="form-input w-full mb-3 rounded-lg" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <textarea className="form-textarea w-full mb-4 rounded-lg" placeholder="Note (Optional)" rows={2} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setModalMode(null)} className="px-4 py-2 rounded bg-gray-100 text-sm font-bold">Cancel</button>
                      <button onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white text-sm font-bold">Save</button>
                  </div>
              </div>
          </div>
      )}

      <ConfirmDialog 
         open={showDelete} 
         title="Delete Location" 
         message={`Delete "${activeLoc?.name}"? ${activeLoc?.itemCount ? `Items (${activeLoc.itemCount}) will become unassigned.` : ''}`} 
         isDestructive={true} 
         onClose={() => setShowDelete(false)} 
         onConfirm={handleDelete} 
      />

      <MoveLocationModal 
         isOpen={showMove} 
         onClose={() => setShowMove(false)} 
         onConfirm={handleMove} 
         locations={locations} 
         movingLoc={activeLoc} 
      />
    </div>
  );
}