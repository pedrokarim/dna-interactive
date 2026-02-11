"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageZoomModal({
  imageUrl,
  onClose,
}: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Réinitialiser quand l'image change
  useEffect(() => {
    if (imageUrl) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageUrl]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && imageUrl) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [imageUrl, onClose]);

  // Zoom avec la molette
  useEffect(() => {
    if (!imageUrl) return;

    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [imageUrl]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.25));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `marker-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!imageUrl) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Contrôles en haut */}
      <div
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100000] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-2 border border-indigo-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom arrière"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm font-medium min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          className="p-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom avant"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-indigo-500/30" />
        <button
          onClick={handleRotate}
          className="p-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-white transition-colors"
          title="Rotation 90°"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-indigo-500/30" />
        <button
          onClick={handleDownload}
          className="p-2 bg-green-600/80 hover:bg-green-600 rounded-lg text-white transition-colors"
          title="Télécharger l'image"
        >
          <Download className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-indigo-500/30" />
        <button
          onClick={handleReset}
          className="px-3 py-2 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-white text-sm transition-colors"
          title="Réinitialiser"
        >
          Réinitialiser
        </button>
        <div className="w-px h-6 bg-indigo-500/30" />
        <button
          onClick={onClose}
          className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors"
          title="Fermer (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div
        ref={containerRef}
        className="relative max-w-[95vw] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Guide visuel détaillé du marqueur sur la carte interactive Duet Night Abyss"
          className="max-w-full max-h-[90vh] object-contain select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${
              position.x / zoom
            }px, ${position.y / zoom}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          draggable={false}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Instructions en bas */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[100000] bg-slate-900/90 backdrop-blur-md rounded-lg px-4 py-2 border border-indigo-500/30 text-white text-xs text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p>
          Molette pour zoomer • Cliquer-glisser pour déplacer • ESC pour fermer
        </p>
      </div>
    </div>
  );

  // Utiliser un portal pour rendre le modal directement dans le body
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
}
