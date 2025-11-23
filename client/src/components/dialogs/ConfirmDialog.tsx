interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", isDestructive = false, onClose, onConfirm }: Props) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4 border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 flex items-center justify-center size-10 rounded-full ${isDestructive ? 'bg-[#DC3545]/10 text-[#DC3545]' : 'bg-[#197fe6]/10 text-[#197fe6]'}`}>
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end items-center gap-3">
          <button onClick={onClose} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 text-sm font-bold hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-3 text-white text-sm font-bold hover:opacity-90 ${isDestructive ? 'bg-[#DC3545]' : 'bg-[#197fe6]'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}