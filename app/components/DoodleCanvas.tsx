"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Undo2, Trash2, Minus, Circle } from "lucide-react";

const INK_COLORS = [
  { name: "Ink Black", color: "#1a1a1a" },
  { name: "Wine Red", color: "#8B2252" },
  { name: "Navy", color: "#1a2744" },
  { name: "Forest", color: "#1a3a2a" },
  { name: "Royal Purple", color: "#3a1a5c" },
  { name: "Eraser", color: "#f5f0e8" },
];

const BRUSH_SIZES = [
  { label: "S", size: 2 },
  { label: "M", size: 5 },
  { label: "L", size: 10 },
];

interface DoodleCanvasProps {
  onDrawingChange: (hasDrawing: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function DoodleCanvas({
  onDrawingChange,
  canvasRef,
}: DoodleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeColor, setActiveColor] = useState(INK_COLORS[0].color);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    if (!container) return;

    // Set canvas size based on container
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = Math.round(width * 0.75); // 4:3 aspect ratio

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#f5f0e8";
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [canvasRef]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    },
    [canvasRef],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Save state before this stroke
      const dpr = window.devicePixelRatio || 1;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setStrokeHistory((prev) => [...prev.slice(-20), imageData]); // keep last 20

      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      setIsDrawing(true);
    },
    [canvasRef, getPos, activeColor, brushSize],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, canvasRef, getPos],
  );

  const endDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (isDrawing) {
        setIsDrawing(false);
        setHasStrokes(true);
        onDrawingChange(true);
      }
    },
    [isDrawing, onDrawingChange],
  );

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistory.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));

    if (strokeHistory.length <= 1) {
      setHasStrokes(false);
      onDrawingChange(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setStrokeHistory([]);
    setHasStrokes(false);
    onDrawingChange(false);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 rounded-2xl"
        style={{
          background: "rgba(0,0,0,0.02)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {INK_COLORS.map((ink) => (
            <button
              key={ink.color}
              type="button"
              onClick={() => setActiveColor(ink.color)}
              title={ink.name}
              className="relative w-6 h-6 rounded-full transition-all active:scale-90"
              style={{
                background:
                  ink.color === "#f5f0e8"
                    ? "linear-gradient(135deg, #f5f0e8, #e8e0d0)"
                    : ink.color,
                boxShadow:
                  activeColor === ink.color
                    ? `0 0 0 2px #fff, 0 0 0 3.5px ${ink.color === "#f5f0e8" ? "#999" : ink.color}`
                    : "0 1px 3px rgba(0,0,0,0.15)",
                border:
                  ink.color === "#f5f0e8"
                    ? "1px solid rgba(0,0,0,0.15)"
                    : "none",
              }}
            >
              {ink.color === "#f5f0e8" && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] text-black/40 font-bold">
                  E
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-1">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setBrushSize(b.size)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                brushSize === b.size
                  ? "bg-black text-white shadow-sm"
                  : "bg-black/[0.03] text-black/40 hover:bg-black/[0.06]"
              }`}
            >
              {b.label === "S" ? (
                <Minus size={10} strokeWidth={3} />
              ) : b.label === "M" ? (
                <Circle size={8} fill="currentColor" />
              ) : (
                <Circle size={12} fill="currentColor" />
              )}
            </button>
          ))}
        </div>

        {/* Undo / Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeHistory.length === 0}
            className="w-7 h-7 rounded-lg bg-black/[0.03] flex items-center justify-center text-black/40 hover:bg-black/[0.06] transition-all active:scale-90 disabled:opacity-20"
            title="Undo"
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasStrokes}
            className="w-7 h-7 rounded-lg bg-black/[0.03] flex items-center justify-center text-black/40 hover:bg-red-50 hover:text-red-400 transition-all active:scale-90 disabled:opacity-20"
            title="Clear all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        {/* Paper grain texture */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* Empty state hint */}
        {!hasStrokes && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
            <span className="text-3xl mb-2 opacity-20">🎨</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/15">
              Draw your confession here
            </span>
          </div>
        )}
      </div>

      {/* Brush preview */}
      <div className="flex justify-center">
        <div
          className="rounded-full transition-all"
          style={{
            width: `${brushSize * 2 + 4}px`,
            height: `${brushSize * 2 + 4}px`,
            background: activeColor === "#f5f0e8" ? "#ccc" : activeColor,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}
