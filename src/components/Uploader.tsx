import React, { useState, useRef } from 'react';
import { Upload, FileText, ImageIcon, Loader2, AlertCircle, FileType } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

interface UploaderProps {
  onDataLoaded: (data: string, type: 'text' | 'image' | 'pdf') => void;
  isLoading: boolean;
}

export function Uploader({ onDataLoaded, isLoading }: UploaderProps) {
  const [pasteMode, setPasteMode] = useState(false);
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onDataLoaded(base64, 'image');
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onDataLoaded(base64, 'pdf');
      };
      reader.readAsDataURL(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Extract text from all sheets
        let fullText = "";
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          fullText += `Sheet: ${sheetName}\n`;
          fullText += XLSX.utils.sheet_to_csv(sheet);
          fullText += "\n\n";
        });
        
        onDataLoaded(fullText, 'text');
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        onDataLoaded(event.target?.result as string, 'text');
      };
      reader.readAsText(file);
    }
  };

  const handlePasteSubmit = () => {
    if (text.trim()) {
      onDataLoaded(text, 'text');
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
        <button
          onClick={() => setPasteMode(false)}
          className={cn(
            "flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            !pasteMode ? "bg-white shadow-sm text-indigo-700" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <ImageIcon className="w-3 h-3" />
          Upload
        </button>
        <button
          onClick={() => setPasteMode(true)}
          className={cn(
            "flex-1 flex justify-center items-center gap-2 py-2 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            pasteMode ? "bg-white shadow-sm text-indigo-700" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <FileText className="w-3 h-3" />
          Paste
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!pasteMode ? (
          <motion.div
            key="file"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 transition-colors group cursor-pointer text-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"
              className="hidden"
            />
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-[13px] font-semibold text-indigo-700 uppercase">Upload Reports</p>
            <p className="text-[10px] text-slate-400 mt-1">PDF, Excel, CSV, or Image</p>
            {isLoading && (
               <div className="mt-4 flex items-center gap-2 text-indigo-600 animate-pulse">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 <span className="text-[10px] font-bold uppercase">Processing...</span>
               </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="paste"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste OCR text from PDF..."
              className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all resize-none shadow-inner"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={isLoading || !text.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>Transform Data</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
