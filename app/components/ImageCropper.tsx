"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ZoomIn, Move } from "lucide-react";

type ImageCropperProps = {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // Default 3 / 4.2
};

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 3 / 4.2,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: Point) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteInternal = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="text-white/60" size={20} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
          Crop Your Cover
        </span>
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest disabled:opacity-30 hover:bg-white/90 transition-all"
        >
          {isProcessing ? (
            "..."
          ) : (
            <>
              <Check size={14} /> Done
            </>
          )}
        </button>
      </div>

      {/* Cropper Container */}
      <div className="flex-1 relative bg-[#0a0a0a]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
          classes={{
            containerClassName: "bg-black",
            mediaClassName: "max-w-none",
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/40 border-t border-white/5 space-y-6">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex items-center justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <ZoomIn size={12} /> Zoom
            </div>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        <div className="flex justify-center gap-8 text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <Move size={12} /> Drag to Reposition
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Canvas helper to crop the image
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
