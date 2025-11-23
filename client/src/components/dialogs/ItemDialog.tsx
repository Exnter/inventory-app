// file: client/src/components/dialogs/ItemDialog.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryItem, Location, Tag } from '../../types';
import { uploadThumbnail, fetchLocations, fetchTags, createTag, createLocation, deleteImage } from '../../api';
import CascadingLocationSelect from '../CascadingLocationSelect';
import CustomSelect from '../CustomSelect';
import { translations, Lang } from '../../locales';

interface Props {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  onSave: (data: any, addAnother: boolean) => Promise<void>;
  initialData?: InventoryItem | null;
}

export default function ItemDialog({ lang, open, onClose, onSave, initialData }: Props) {
  const t = translations[lang];
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('$'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [locId, setLocId] = useState<string | null>(null);
  const [selTagIds, setSelTagIds] = useState<string[]>([]);
  const [thumbPath, setThumbPath] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [isDirtyImage, setIsDirtyImage] = useState(false); 
  const [note, setNote] = useState('');
  
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showQuickLoc, setShowQuickLoc] = useState(false);
  const [quickLocName, setQuickLocName] = useState('');
  const [isQuickLocFocused, setIsQuickLocFocused] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentDepth = (id: string | null) => {
      if(!id) return 0;
      let depth = 0;
      let curr = locations.find(l => l.id === id);
      while(curr) { depth++; curr = locations.find(l => l.id === curr?.parentId); }
      return depth;
  };
  const highlightLevel = useMemo(() => {
      if (!isQuickLocFocused) return null;
      const depth = getCurrentDepth(locId);
      return Math.min(depth, 3); 
  }, [isQuickLocFocused, locId, locations]);

  useEffect(() => {
    if (open) {
      setErrors({});
      setErrorMsg(null);
      setIsDirtyImage(false);
      fetchLocations().then(r => setLocations(r.data));
      fetchTags().then(r => setTags(r.data));
      if (initialData) {
        setName(initialData.name);
        setQty(initialData.quantity.toString());
        setUnit(initialData.quantityUnit);
        setPrice(initialData.purchasePrice?.toString() || '');
        setCurrency(initialData.purchasePriceCurrency || '$');
        setDate(initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '');
        setLocId(initialData.locationId);
        setSelTagIds(initialData.tags.map(t => t.id));
        setThumbPath(initialData.thumbnailPath);
        setImageHash(initialData.imageHash || null);
        setNote(initialData.note || '');
      } else {
        resetForm();
      }
    }
  }, [open, initialData]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const resetForm = () => {
      setName(''); setSku(''); setQty('1'); setUnit('pcs'); setPrice(''); setCurrency('$');
      setDate(new Date().toISOString().split('T')[0]); setLocId(null); 
      setSelTagIds([]); setThumbPath(null); setImageHash(null); setNote('');
      setIsDirtyImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
      if (isDirtyImage && thumbPath) deleteImage(thumbPath);
      onClose();
  };

  const handleSave = async (addAnother: boolean) => {
      const newErrors: Record<string, boolean> = {};
      if (!name.trim()) newErrors.name = true;
      if (!qty || isNaN(Number(qty))) newErrors.qty = true;
      if (price && isNaN(Number(price))) newErrors.price = true;

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          setErrorMsg(t.correctErrors); 
          return;
      }

      setIsSubmitting(true);
      const data = {
          name, quantity: Number(qty), quantityUnit: unit, 
          purchasePrice: Number(price), purchasePriceCurrency: currency,
          purchaseDate: date, locationId: locId, tagIds: selTagIds, 
          thumbnailPath: thumbPath, imageHash: imageHash, note
      };
      
      try {
          await onSave(data, addAnother);
          setIsDirtyImage(false); 
          if(addAnother) {
              resetForm(); 
              setIsSubmitting(false);
          }
      } catch (e) { setIsSubmitting(false); }
  };

  const handleFileUpload = async (e: any) => {
      if (e.target.files?.[0]) {
          if (isDirtyImage && thumbPath) deleteImage(thumbPath);
          const res = await uploadThumbnail(e.target.files[0]);
          setThumbPath(res.data.path);
          if (res.data.hash) setImageHash(res.data.hash);
          setIsDirtyImage(true);
          e.target.value = ''; 
      }
  };

  const handleTagInputKey = async (e: any) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          e.preventDefault();
          let tag = tags.find(t => t.name === tagInput.trim());
          if (!tag) {
              const res = await createTag(tagInput.trim());
              tag = res.data;
              setTags([...tags, tag]);
          }
          if(tag && !selTagIds.includes(tag.id)) setSelTagIds([...selTagIds, tag.id]);
          setTagInput('');
      }
  };

  const handleQuickAddLoc = async () => {
      if(!quickLocName) return;
      const res = await createLocation(quickLocName, locId);
      const r = await fetchLocations();
      setLocations(r.data);
      setQuickLocName('');
      setShowQuickLoc(false);
      setLocId(res.data.id); 
  };

  // Fix 2: Get candidate tags (exclude already selected)
  const candidateTags = tags.filter(t => !selTagIds.includes(t.id)).slice(0, 8);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4 backdrop-blur-sm">
      <div className="w-full h-full md:h-auto md:max-w-4xl rounded-none md:rounded-xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col md:max-h-[90vh] relative">
        {errorMsg && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold z-[60] animate-in fade-in slide-in-from-bottom-4">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{initialData ? t.editItem : t.newItem}</h2>
          <button onClick={handleClose}><span className="material-symbols-outlined text-gray-400">close</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Col 1 */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Image</label>
                <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 overflow-hidden">
                   {thumbPath ? <img src={thumbPath} className="w-full h-full object-cover" /> : <><span className="material-symbols-outlined text-4xl text-gray-400">upload_file</span><p className="text-xs text-gray-400 mt-2">Click to upload</p></>}
                </div>
                <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.itemName} <span className="text-red-500">*</span></label><input className={`form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={name} onChange={e => { setName(e.target.value); if(errors.name) setErrors({...errors, name:false}) }} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.sku}</label><input className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary" value={sku} onChange={e => setSku(e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.desc}</label><textarea className="form-textarea w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary" rows={3} value={note} onChange={e => setNote(e.target.value)} /></div>
            </div>

            {/* Col 2 & 3 */}
            <div className="md:col-span-2 flex flex-col gap-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.quantity}</label>
                    <div className={`flex items-stretch rounded-lg border bg-white dark:bg-gray-700 transition-all duration-200 ${errors.qty ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary'}`}>
                      <input type="number" className="form-input w-2/3 rounded-l-lg border-none focus:ring-0 bg-transparent text-gray-900 dark:text-white z-10" value={qty} onChange={e => setQty(e.target.value)} />
                      <div className="w-px bg-gray-300 dark:bg-gray-600 my-1"></div>
                      <div className="w-1/3 relative"><CustomSelect value={unit} onChange={setUnit} options={['pcs','kg','box','bottle','set','pair'].map(u => ({label:u, value:u}))} className="!border-none !ring-0 h-full [&>div]:!border-none [&>div]:!shadow-none [&>div]:!bg-transparent" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.unitPrice}</label>
                    <div className={`flex items-stretch rounded-lg border bg-white dark:bg-gray-700 transition-all duration-200 ${errors.price ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary'}`}>
                      <div className="w-20 relative"><CustomSelect value={currency} onChange={setCurrency} options={['$','€','¥','£'].map(c => ({label:c, value:c}))} className="!border-none !ring-0 h-full [&>div]:!border-none [&>div]:!shadow-none [&>div]:!bg-transparent" /></div>
                      <div className="w-px bg-gray-300 dark:bg-gray-600 my-1"></div>
                      <input type="number" className="form-input flex-1 rounded-r-lg border-none focus:ring-0 bg-transparent text-gray-900 dark:text-white z-10" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.total}: <span className="font-semibold text-gray-700 dark:text-gray-300">{currency} {((parseFloat(qty) || 0) * (parseFloat(price) || 0)).toFixed(2)}</span></p>
                  </div>
               </div>

               <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.purchaseDate}</label><input type="date" className="form-input w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary" value={date} onChange={e => setDate(e.target.value)} /></div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.tags}</label>
                 <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                    {tags.filter(t => selTagIds.includes(t.id)).map(t => (
                      // Fix 3: Truncate selected tags
                      <span key={t.id} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                        <span className="truncate">{t.name}</span>
                        <span className="material-symbols-outlined text-sm cursor-pointer hover:text-primary/70 shrink-0" onClick={() => setSelTagIds(selTagIds.filter(id => id !== t.id))}>close</span>
                      </span>
                    ))}
                    <input className="flex-1 border-none p-0 focus:ring-0 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400" placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagInputKey} />
                 </div>
                 
                 {/* Fix 2: Recent Tags Candidates */}
                 {candidateTags.length > 0 && (
                     <div className="mt-2">
                         <p className="text-xs text-gray-400 mb-1"></p>
                         <div className="flex flex-wrap gap-1.5">
                             {candidateTags.map(t => (
                                 <span 
                                   key={t.id} 
                                   onClick={() => setSelTagIds([...selTagIds, t.id])}
                                   className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 max-w-[10em] truncate"
                                 >
                                     {t.name}
                                 </span>
                             ))}
                         </div>
                     </div>
                 )}
               </div>

               <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t.locationSelect}</label>
                    <button onClick={() => { setShowQuickLoc(!showQuickLoc); setTimeout(() => document.getElementById('quickLocInput')?.focus(), 50); }} className="text-xs text-primary font-bold hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">add</span> {t.createLocation}</button>
                 </div>
                 {showQuickLoc && (
                     <div className="flex gap-2 mb-3 p-2 bg-white dark:bg-gray-700 rounded border border-primary/30 shadow-sm animate-in slide-in-from-top-2">
                         <input id="quickLocInput" className="form-input flex-1 text-sm py-1.5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-primary" placeholder={`Create under: ${locId ? (locations.find(l=>l.id===locId)?.name || 'Root') : 'Root'}`} value={quickLocName} onChange={e => setQuickLocName(e.target.value)} onFocus={() => setIsQuickLocFocused(true)} onBlur={() => setIsQuickLocFocused(false)} onKeyDown={e => e.key === 'Enter' && handleQuickAddLoc()} />
                         <button onClick={handleQuickAddLoc} className="bg-primary text-white px-4 rounded text-xs font-bold hover:bg-primary/90">OK</button>
                     </div>
                 )}
                 <CascadingLocationSelect locations={locations} value={locId} onChange={setLocId} highlightLevel={highlightLevel} />
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
           <button onClick={handleClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">{t.cancel}</button>
           {!initialData && <button onClick={() => handleSave(true)} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg font-bold text-sm hover:bg-primary/20">{t.saveAdd}</button>}
           <button onClick={() => handleSave(false)} className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90">{t.save}</button>
        </div>

      </div>
    </div>
  );
}