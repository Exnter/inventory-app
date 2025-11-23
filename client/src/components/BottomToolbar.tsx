// file: client/src/components/BottomToolbar.tsx
import { ArrowMove24Regular, Delete24Regular, Archive24Regular } from '@fluentui/react-icons';

interface Props {
  selectedCount: number;
  onMove: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function BottomToolbar({ selectedCount, onMove, onArchive, onDelete }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 md:bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      {/* Floating Container */}
      <div className="pointer-events-auto flex h-16 items-center justify-between bg-white md:rounded-xl md:bg-[#197fe6]/10 dark:bg-[#197fe6]/20 p-4 border-t md:border border-[#197fe6]/20 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg w-full md:w-[600px] md:max-w-[90%]">
        <p className="text-sm font-bold text-[#197fe6]">{selectedCount} items selected</p>
        
        <div className="flex items-center gap-2">
          {/* Buttons same as before */}
          <button onClick={onMove} className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-700 px-3 text-sm font-semibold text-gray-800 border border-gray-300 hover:bg-gray-50"><ArrowMove24Regular /> <span className="hidden sm:inline">Move</span></button>
          <button onClick={onArchive} className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-700 px-3 text-sm font-semibold text-gray-800 border border-gray-300 hover:bg-gray-50"><Archive24Regular /> <span className="hidden sm:inline">Archive</span></button>
          <button onClick={onDelete} className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-semibold text-[#DC3545] border border-[#DC3545]/20 hover:bg-red-100"><Delete24Regular /> <span className="hidden sm:inline">Delete</span></button>
        </div>
      </div>
    </div>
  );
}