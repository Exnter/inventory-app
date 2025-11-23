// file: client/src/components/dialogs/PrintDialog.tsx
import { useState, useEffect } from 'react';
import { fetchLocations } from '../../api';
import { Location } from '../../types';
import { translations, Lang } from '../../locales';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Props {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  qrBaseUrl: string;
}

export default function PrintDialog({ lang, open, onClose, qrBaseUrl }: Props) {
  const t = translations[lang];
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocs, setSelectedLocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // 检测 Firefox
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  useEffect(() => {
    if (open) {
      fetchLocations().then(r => setLocations(r.data)).catch(() => {});
      setSelectedLocs([]);
      setProgress(0);
    }
  }, [open]);

  // 辅助：Base64 转 Blob (同步过程，比 canvas.toBlob 更稳定)
  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleDownload = async () => {
    setLoading(true);
    setProgress(0);
    
    try {
        const zip = new JSZip();
        const imgFolder = zip.folder("labels");
        let processedCount = 0;

        // --- 打印参数 (5x7cm @ 300PPI) ---
        const CANVAS_WIDTH = 600;
        const CANVAS_HEIGHT = 840;
        const QR_SIZE = 500;
        const QR_X = (CANVAS_WIDTH - QR_SIZE) / 2;
        const QR_Y = 160;
        // --------------------------------

        for (const locId of selectedLocs) {
            const loc = locations.find(l => l.id === locId);
            if (!loc) continue;

            const canvas = document.createElement('canvas');
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // 2. 绘制背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // 3. 绘制标题
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 48px Arial, "Microsoft YaHei", sans-serif'; // 增加中文字体后备
            ctx.textAlign = 'center';
            ctx.fillText(loc.name, CANVAS_WIDTH / 2, 100); 

            // 4. 生成二维码
            const targetUrl = qrBaseUrl ? `${qrBaseUrl}/${loc.code || ''}` : `NoURL/${loc.code || ''}`;
            try {
                const qrTempCanvas = document.createElement('canvas');
                await QRCode.toCanvas(qrTempCanvas, targetUrl, { 
                    margin: 1, 
                    width: QR_SIZE,
                    errorCorrectionLevel: 'M'
                });
                ctx.drawImage(qrTempCanvas, QR_X, QR_Y);
            } catch (e) {
                ctx.fillStyle = 'red';
                ctx.font = '30px sans-serif';
                ctx.fillText("QR Error", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }

            // 5. 绘制底部文字
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 36px monospace';
            ctx.fillText(loc.code || 'NO CODE', CANVAS_WIDTH / 2, 730);
            
            ctx.fillStyle = '#666666';
            ctx.font = '24px sans-serif';
            ctx.fillText(targetUrl, CANVAS_WIDTH / 2, 780);

            // 6. 获取图片数据
            // 【核心修复】Firefox 对 canvas.toBlob 处理有 Bug，改用同步的 toDataURL
            const dataUrl = canvas.toDataURL('image/png');
            const blob = dataURItoBlob(dataUrl);

            if (blob && imgFolder) {
                const safeName = loc.name.replace(/[^a-z0-9\u4e00-\u9fa5\-_]/gi, '_');
                imgFolder.file(`${safeName}-${loc.code || 'nc'}.png`, blob);
            }

            processedCount++;
            setProgress(Math.round((processedCount / selectedLocs.length) * 100));
            
            // 强制让出主线程，防止 UI 假死
            await new Promise(r => setTimeout(r, 20));
        }

        // 7. 生成并下载 ZIP
        const content = await zip.generateAsync({ type: "blob" });
        const timestamp = new Date().toISOString().slice(0,10);
        saveAs(content, `Labels-${timestamp}.zip`);

    } catch (error: any) {
        alert("Generate failed: " + (error?.message || "Unknown"));
    } finally {
        setLoading(false);
        onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.printLabels}</h2>
          <button onClick={onClose}><span className="material-symbols-outlined text-gray-500">close</span></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
           <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Select locations to generate labels for. Labels will be downloaded as a ZIP file.</p>
           <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
               {locations.map(l => (
                   <label key={l.id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0">
                       <input 
                         type="checkbox" 
                         className="form-checkbox rounded text-primary mr-3"
                         checked={selectedLocs.includes(l.id)}
                         onChange={e => {
                             if(e.target.checked) setSelectedLocs([...selectedLocs, l.id]);
                             else setSelectedLocs(selectedLocs.filter(id => id !== l.id));
                         }}
                       />
                       <div className="flex-1">
                           <div className="font-medium text-sm text-gray-900 dark:text-white">{l.name}</div>
                           <div className="text-xs text-gray-400">{l.fullPath}</div>
                       </div>
                       {l.code && <span className="text-xs font-mono bg-gray-100 dark:bg-gray-600 dark:text-gray-200 px-1 rounded">{l.code}</span>}
                   </label>
               ))}
           </div>
           
           {/* Firefox 提示信息 */}
           {isFirefox && (
             <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Firefox User:</strong> If generation fails, please keep the F12 Console open or try using Chrome/Edge.
             </div>
           )}
        </div>

        <div className="flex justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">{t.cancel}</button>
          <button 
            onClick={handleDownload}
            disabled={selectedLocs.length === 0 || loading}
            className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 min-w-[120px]"
          >
            {loading ? `Processing ${progress}%` : 'Download ZIP'}
          </button>
        </div>
      </div>
    </div>
  );
}