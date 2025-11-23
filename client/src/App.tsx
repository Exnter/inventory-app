// file: client/src/App.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ItemList from './components/ItemList';
import BottomToolbar from './components/BottomToolbar';
import ItemDialog from './components/dialogs/ItemDialog';
import PrintDialog from './components/dialogs/PrintDialog';
import MoveDialog from './components/dialogs/MoveDialog';
import ConfirmDialog from './components/dialogs/ConfirmDialog';
import LocationManager from './components/LocationManager';
import TagManager from './components/TagManager';
import { fetchItems, createItem, updateItem, deleteItems, archiveItems, moveItems, fetchLocationByCode, fetchConfig } from './api';
import { InventoryItem } from './types';
import { Lang, translations } from './locales';

export default function App() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('inventory_lang') as Lang) || 'en');
  const setLang = (newLang: Lang) => { setLangState(newLang); localStorage.setItem('inventory_lang', newLang); };

  const [currentView, setCurrentView] = useState<'inventory' | 'locations' | 'tags'>('inventory');
  const [refreshKey, setRefreshKey] = useState(0);
  const [qrBaseUrl, setQrBaseUrl] = useState('');

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters & Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filters, setFilters] = useState<any>({});
  
  const handleFilterChange = useCallback((newFilters: any) => {
      setFilters((prev: any) => {
          if (JSON.stringify(prev) === JSON.stringify(newFilters)) return prev;
          return newFilters;
      });
  }, []);

  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null); 

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sort State
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>(() => {
      const saved = localStorage.getItem('inventory_sort');
      return saved ? JSON.parse(saved) : { key: 'updatedAt', direction: 'desc' };
  });

  // Dialog States
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: () => {}, isDestructive: false });
  
  const t = translations[lang];
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => { fetchConfig().then(r => setQrBaseUrl(r.data.qrBaseUrl)); }, []);

  const handleSortChange = (key: string) => {
      const newConfig = { 
          key, 
          direction: (sortConfig.key === key && sortConfig.direction === 'desc') ? 'asc' : 'desc' 
      } as const;
      setSortConfig(newConfig);
      localStorage.setItem('inventory_sort', JSON.stringify(newConfig));
  };

  // Handle Hotkeys
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const isModalOpen = itemDialogOpen || printDialogOpen || moveDialogOpen || confirmOpen;
          const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

          if (e.key === 'Escape') {
              if (confirmOpen) setConfirmOpen(false);
              else if (itemDialogOpen) setItemDialogOpen(false);
              else if (moveDialogOpen) setMoveDialogOpen(false);
              else if (printDialogOpen) setPrintDialogOpen(false);
          }
          if ((e.key === '+' || e.key === '=') && !isModalOpen && !isInputFocused) {
              e.preventDefault();
              setEditItem(null);
              setItemDialogOpen(true);
          }
          if (e.key === '/' && !isModalOpen && !isInputFocused) {
              e.preventDefault();
              searchInputRef.current?.focus();
          }
          if (!isModalOpen && !isInputFocused && currentView === 'inventory') {
              if (e.key === 'ArrowLeft' && page > 1) setPage(p => p - 1);
              if (e.key === 'ArrowRight' && page < totalPages) setPage(p => p + 1);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemDialogOpen, printDialogOpen, moveDialogOpen, confirmOpen, page, totalPages, currentView]);

  useEffect(() => {
      if (code) {
          fetchLocationByCode(code).then(r => {
              const loc = r.data;
              setFilters((prev: any) => {
                  const next = { ...prev, locationId: loc.id, includeDescendants: true };
                  if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
                  return next;
              });
          }).catch(() => {
              navigate('/'); 
          });
      }
  }, [code, navigate]);

  const loadItems = async () => {
    try {
      const params = { 
          ...filters, search, page, limit: 50,
          sortBy: sortConfig.key, 
          sortOrder: sortConfig.direction
      }; 
      const r = await fetchItems(params);
      setItems(r.data.data);
      setTotalItems(r.data.pagination.total);
      setTotalPages(r.data.pagination.totalPages);
      setSelectedIds(prev => prev.filter(id => r.data.data.find(i => i.id === id)));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { setPage(1); }, [filters, search, sortConfig]); 

  useEffect(() => {
    if(currentView === 'inventory') loadItems();
  }, [filters, search, page, currentView, refreshKey, sortConfig]);

  const handleSaveItem = async (data: any, addAnother: boolean) => {
    if (editItem) await updateItem(editItem.id, data);
    else await createItem(data);
    if (!addAnother) { setItemDialogOpen(false); setEditItem(null); }
    triggerRefresh();
  };
  
  const handleArchiveRequest = () => {
    const selectedItemsList = items.filter(i => selectedIds.includes(i.id));
    const allArchived = selectedItemsList.length > 0 && selectedItemsList.every(i => i.isArchived);
    setConfirmConfig({
      title: allArchived ? t.unarchive : t.archive,
      message: `Selected ${selectedIds.length} items`,
      isDestructive: !allArchived,
      action: async () => {
        await archiveItems(selectedIds, !allArchived);
        setSelectedIds([]);
        setConfirmOpen(false);
        triggerRefresh();
      }
    });
    setConfirmOpen(true);
  };

  const handleDeleteRequest = () => {
    setConfirmConfig({
      title: t.confirmDeleteTitle,
      message: t.confirmDeleteMsg,
      isDestructive: true,
      action: async () => {
        await deleteItems(selectedIds);
        setSelectedIds([]);
        setConfirmOpen(false);
        triggerRefresh();
      }
    });
    setConfirmOpen(true);
  };

  const handleMoveConfirm = async (locId: string) => {
    await moveItems(selectedIds, locId);
    setMoveDialogOpen(false);
    setSelectedIds([]);
    triggerRefresh();
  };

  const renderBackButton = () => (
     <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <button onClick={() => { setCurrentView('inventory'); triggerRefresh(); }} className="text-primary font-bold flex items-center gap-1 text-sm select-none hover:text-primary/80">
           <span className="material-symbols-outlined text-lg">arrow_back</span> {translations[lang].backToInventory}
        </button>
     </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f7f8] dark:bg-[#111921]">
      <Header 
        lang={lang} setLang={setLang}
        onAdd={() => { setEditItem(null); setItemDialogOpen(true); }} 
        onPrint={() => setPrintDialogOpen(true)}
        onSearch={setSearch}
        onManageWarehouses={() => { setCurrentView('locations'); setMobileMenuOpen(false); }}
        onManageTags={() => { setCurrentView('tags'); setMobileMenuOpen(false); }}
        searchInputRef={searchInputRef} 
        // Mobile Props
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {currentView === 'inventory' && (
            <div className={`
                absolute inset-y-0 left-0 z-20 w-72 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 md:shadow-none md:z-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                 {/* Close button for mobile sidebar */}
                 <div className="md:hidden absolute top-2 right-2 p-2" onClick={() => setMobileMenuOpen(false)}>
                    <span className="material-symbols-outlined text-gray-500">close</span>
                 </div>

                 <Sidebar 
                    lang={lang} 
                    onChange={handleFilterChange}
                    refreshKey={refreshKey} 
                    activeLocationId={filters.locationId} 
                />
            </div>
        )}

        {/* Mobile Backdrop (Only show if menu is open AND we are in inventory view) */}
        {mobileMenuOpen && currentView === 'inventory' && (
            <div className="absolute inset-0 bg-black/50 z-10 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
        )}
        
        <main className="flex-1 relative flex flex-col w-full min-w-0">
          {currentView !== 'inventory' && renderBackButton()}

          {currentView === 'inventory' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-6">
                <div className="mb-2 text-sm text-gray-500">Total {totalItems} items</div>
                <ItemList 
                  lang={lang}
                  items={items} 
                  selectedIds={selectedIds} 
                  onToggleSelect={(id) => {
                    if(selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id));
                    else setSelectedIds([...selectedIds, id]);
                  }}
                  onSelectAll={setSelectedIds}
                  onEdit={(item) => { setEditItem(item); setItemDialogOpen(true); }}
                  pagination={{ page, totalPages, totalItems, onPageChange: setPage }}
                  sortConfig={sortConfig}
                  onSortChange={handleSortChange}
                />
              </div>
              <BottomToolbar 
                selectedCount={selectedIds.length} 
                onArchive={handleArchiveRequest}
                onDelete={handleDeleteRequest}
                onMove={() => setMoveDialogOpen(true)}
              />
            </>
          )}
          
          {currentView === 'locations' && <LocationManager lang={lang} />}
          {currentView === 'tags' && <TagManager lang={lang} />}
        </main>
      </div>

      {itemDialogOpen && <ItemDialog lang={lang} open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} onSave={handleSaveItem} initialData={editItem} />}
      {moveDialogOpen && <MoveDialog lang={lang} open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} selectedItems={items.filter(i => selectedIds.includes(i.id))} onConfirm={handleMoveConfirm} />}
      <PrintDialog lang={lang} open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} qrBaseUrl={qrBaseUrl} />
      <ConfirmDialog open={confirmOpen} title={confirmConfig.title} message={confirmConfig.message} isDestructive={confirmConfig.isDestructive} onClose={() => setConfirmOpen(false)} onConfirm={confirmConfig.action} />
    </div>
  );
}
