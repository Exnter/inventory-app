// file: client/src/components/CustomSelect.tsx
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string; 
}

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", disabled = false, className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (event: Event) => {
      // 核心修复：如果滚动事件发生在下拉菜单内部，不关闭
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      // 只有外部滚动才关闭（防止菜单位置错位）
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // Capture phase
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const toggle = () => {
      if (disabled) return;
      if (!isOpen && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setCoords({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX,
              width: rect.width
          });
      }
      setIsOpen(!isOpen);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div 
        onClick={toggle}
        className={`w-full h-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-8 rounded-lg text-sm flex items-center justify-between transition-all
          ${isOpen ? 'ring-2 ring-primary/50 border-primary' : ''}
          ${disabled ? 'bg-gray-100 dark:bg-gray-900' : 'hover:border-gray-400'}
        `}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
      </div>

      {/* Portal for Dropdown */}
      {isOpen && !disabled && createPortal(
        <div 
            ref={dropdownRef}
            className="absolute z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
                top: coords.top, 
                left: coords.left, 
                width: coords.width,
            }}
        >
          {/* 修复2：始终显示一个空选项 */}
          {options.length === 0 && !options.some(o=>o.value==='') ? (
             <div className="px-3 py-2 text-sm text-gray-400">No options</div>
          ) : null}

          {options.map(opt => (
            <div
              key={opt.value}
              onClick={(e) => { 
                  e.stopPropagation(); 
                  onChange(opt.value); 
                  setIsOpen(false); 
              }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors
                ${opt.value === value 
                  ? 'bg-primary text-white font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary'}
              `}
            >
              {opt.label || <span className="text-gray-400 italic">(None)</span>}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}