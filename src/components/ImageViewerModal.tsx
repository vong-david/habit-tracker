"use client";

import React from "react";
import { X, ZoomIn, Download } from "lucide-react";

interface ImageViewerModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `chart-screenshot-${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="ទាញយករូបភាព"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="បិទ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Image */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 max-h-[85vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Trading Chart Screenshot"
            className="max-h-[85vh] max-w-full object-contain rounded-2xl select-none"
          />
        </div>
      </div>
    </div>
  );
};
