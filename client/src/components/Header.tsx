// file: client/src/components/Header.tsx
import { useState, useRef, useEffect, RefObject } from 'react';
import { translations, Lang } from '../locales';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  onAdd: () => void;
  onPrint: () => void;
  onSearch: (term: string) => void;
  onManageWarehouses: () => void;
  onManageTags: () => void;
  searchInputRef?: RefObject<HTMLInputElement>;
  onToggleMobileMenu: () => void; // New Prop
}

export default function Header({ lang, setLang, onAdd, onPrint, onSearch, onManageWarehouses, onManageTags, searchInputRef, onToggleMobileMenu }: Props) {
  const t = translations[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark px-4 md:px-6 relative z-30 gap-2">
      
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-2 md:gap-4">
        <button className="md:hidden p-1 -ml-2 text-gray-600" onClick={onToggleMobileMenu}>
             <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <span className="material-symbols-outlined text-primary text-3xl shrink-0">inventory_2</span>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">{t.inventory}</h1>
      </div>
      
      {/* Center: Search */}
      <div className="flex flex-1 items-center justify-center px-2 md:px-8 min-w-0">
        <div className="w-full max-w-2xl">
          <label className="relative flex w-full items-center">
            <span className="material-symbols-outlined absolute left-3 text-gray-500 dark:text-gray-400 text-lg">search</span>
            <input 
              ref={searchInputRef} 
              className="form-input h-10 w-full rounded-lg border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-800 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary focus:ring-primary" 
              placeholder={t.searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Desktop: Full Buttons */}
        <button 
          onClick={onPrint}
          className="hidden md:flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 px-4 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined text-lg mr-2">print</span>
          <span>{t.printLabels}</span>
        </button>
        <button 
          onClick={onAdd}
          className="hidden md:flex h-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg mr-2">add</span>
          <span>{t.addItem}</span>
        </button>

        {/* Mobile: Icon Buttons */}
        <button onClick={onPrint} className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <span className="material-symbols-outlined text-xl">print</span>
        </button>
        <button onClick={onAdd} className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined text-xl">add</span>
        </button>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 z-50">
              <button 
                onClick={() => { onManageWarehouses(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
              >
                <span className="material-symbols-outlined text-gray-400">domain</span>
                {t.manageWarehouses}
              </button>
              <button 
                onClick={() => { onManageTags(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
              >
                <span className="material-symbols-outlined text-gray-400">label</span>
                {t.manageTags}
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
              <button 
                onClick={() => { setLang(lang === 'en' ? 'zh' : 'en'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
              >
                <span className="material-symbols-outlined text-gray-400">language</span>
                <span>{t.switchTo}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}