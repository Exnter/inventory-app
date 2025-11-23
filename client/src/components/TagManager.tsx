// file: client/src/components/TagManager.tsx
import { useState, useEffect } from 'react';
import { fetchTags, createTag, updateTag, deleteTag } from '../api';
import { Tag } from '../types';
import { translations, Lang } from '../locales';

interface Props {
  lang: Lang;
}

export default function TagManager({ lang }: Props) {
  const t = translations[lang];
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  
  // Edit Modal State
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  
  // Delete Modal State
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  useEffect(() => { load(); }, []);
  const load = () => fetchTags().then(r => setTags(r.data));

  const handleCreate = async () => {
    if(!newTagName.trim()) return;
    await createTag(newTagName.trim());
    setNewTagName('');
    load();
  };

  const handleUpdateConfirm = async () => {
    if(!editingTag || !editName.trim()) return;
    await updateTag(editingTag.id, editName.trim());
    setEditingTag(null);
    load();
  };

  const handleDeleteConfirm = async () => {
    if(deletingTag) {
        await deleteTag(deletingTag.id);
        setDeletingTag(null);
        load();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark h-full">
      <div className="mx-auto max-w-3xl bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.tagManagement}</h1>

        <div className="flex gap-3 mb-8">
           <input 
             className="form-input flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-primary" 
             placeholder="New tag name..." 
             value={newTagName} 
             onChange={e => setNewTagName(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleCreate()}
           />
           <button onClick={handleCreate} className="bg-primary text-white px-6 rounded-lg font-bold hover:bg-primary/90 transition-colors">
             {t.addTag}
           </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           {tags.map(tag => (
             <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <span className="font-medium text-gray-700 dark:text-gray-200 truncate pr-2">{tag.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                   <button onClick={() => { setEditingTag(tag); setEditName(tag.name); }} className="text-gray-400 hover:text-primary p-1 transition-colors">
                     <span className="material-symbols-outlined text-lg">edit</span>
                   </button>
                   <button onClick={() => setDeletingTag(tag)} className="text-gray-400 hover:text-danger p-1 transition-colors">
                     <span className="material-symbols-outlined text-lg">delete</span>
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4 border border-gray-200 dark:border-gray-700 p-6">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rename Tag</h3>
             <input 
               autoFocus
               className="form-input w-full rounded-lg border-gray-300 focus:ring-primary mb-6" 
               value={editName} 
               onChange={e => setEditName(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleUpdateConfirm()}
             />
             <div className="flex justify-end gap-3">
               <button onClick={() => setEditingTag(null)} className="px-4 py-2 rounded-lg bg-white border border-gray-300 font-bold text-sm hover:bg-gray-50">Cancel</button>
               <button onClick={handleUpdateConfirm} className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90">Save</button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4 border border-gray-200 dark:border-gray-700 p-6">
             <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 flex items-center justify-center size-10 rounded-full bg-red-100 text-red-600">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Tag?</h3>
                  <p className="text-sm text-gray-500 mt-1">Are you sure you want to delete "{deletingTag.name}"? This will remove it from all items.</p>
                </div>
             </div>
             <div className="flex justify-end gap-3">
               <button onClick={() => setDeletingTag(null)} className="px-4 py-2 rounded-lg bg-white border border-gray-300 font-bold text-sm hover:bg-gray-50">Cancel</button>
               <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-lg bg-danger text-white font-bold text-sm hover:bg-red-700">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}