// file: client/src/components/BottomToolbar.tsx
import { ArrowMove24Regular, Delete24Regular, Archive24Regular } from '@fluentui/react-icons';
import { translations, Lang } from '../locales';

interface Props {
  lang: Lang;
  selectedCount: number;
  onMove: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function BottomToolbar({ lang, selectedCount, onMove, onArchive, onDelete }: Props) {
  const t = translations[lang];
  
  if (selectedCount === 0) return null;

  return (
    // 修复重点 1: 移除了外层的 transition-all duration-300
    // 修复重点 2: 添加了 z-50 确保层级
    <div className="fixed bottom-0 md:bottom-8 left-0 md:left-72 right-0 z-50 flex justify-center pointer-events-none">
      
      {/* Floating Container */}
      <div className="
          pointer-events-auto flex items-center justify-between 
          
          /* 修复重点 3: 显式添加 blur-none 以防止任何继承的模糊滤镜影响内容 */
          blur-none

          /* Mobile Styles: Full width, white-ish, safe area */
          w-full bg-white/95 border-t border-gray-200 p-3 px-4 pb-[max(12px,env(safe-area-inset-bottom))] shadow-lg
          
          /* Desktop Styles: Glassmorphism */
          /* 使用 backdrop-blur-xl 增强背景模糊，同时保持前景清晰 */
          md:w-auto md:min-w-[450px] md:max-w-[90%] 
          md:rounded-2xl 
          md:border md:border-[#197fe6]/30 
          md:bg-[#197fe6]/10 md:dark:bg-[#197fe6]/20 
          md:backdrop-blur-xl md:saturate-150
          md:shadow-2xl md:shadow-[#197fe6]/10
          md:p-3 md:px-6 md:pb-3
          
          /* 仅对内部样式变化做过渡，而不是位置 */
          transition-colors duration-200
      ">
        <p className="text-sm font-bold text-primary whitespace-nowrap mr-4 select-none">
          {selectedCount} {t.itemsSelected}
        </p>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onMove} 
            className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-700/50 px-3 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors shadow-sm active:scale-95"
          >
            <ArrowMove24Regular className="text-xl md:text-lg" /> 
            <span className="hidden md:inline">{t.move}</span>
          </button>
          
          <button 
            onClick={onArchive} 
            className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-700/50 px-3 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors shadow-sm active:scale-95"
          >
            <Archive24Regular className="text-xl md:text-lg" /> 
            <span className="hidden md:inline">{t.archive}</span>
          </button>
          
          <button 
            onClick={onDelete} 
            className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-50 hover:bg-red-100 px-3 text-sm font-semibold text-red-600 border border-red-200 transition-colors shadow-sm active:scale-95"
          >
            <Delete24Regular className="text-xl md:text-lg" /> 
            <span className="hidden md:inline">{t.delete}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
