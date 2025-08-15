

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Rect } from '../types';

interface ImageAnnotationModalProps {
  imageFile: File;
  onAnalyze: (file: File, selections?: Rect[]) => void;
  onClose: () => void;
}

const ImageAnnotationModal: React.FC<ImageAnnotationModalProps> = ({ imageFile, onAnalyze, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.lineWidth = 2;

    // Draw saved rectangles
    rects.forEach(rect => {
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });

    // Draw current drawing rectangle
    if (isDrawing && currentRect) {
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
    }
  }, [rects, isDrawing, currentRect]);

  useEffect(() => {
    const imageUrl = URL.createObjectURL(imageFile);
    const img = imageRef.current;
    const canvas = canvasRef.current;

    img.onload = () => {
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        draw();
      }
    };
    img.src = imageUrl;

    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageFile, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const { x: endX, y: endY } = getCanvasCoordinates(e);
    setCurrentRect({
      x: Math.min(startPoint.x, endX),
      y: Math.min(startPoint.y, endY),
      w: Math.abs(endX - startPoint.x),
      h: Math.abs(endY - startPoint.y),
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.w > 5 && currentRect.h > 5) {
      setRects(prev => [...prev, currentRect]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };
  
  const handleReset = () => {
    setRects([]);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-7xl w-full h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" /></svg>
                    <h2 className="text-xl font-bold text-white">Seleção Inteligente de Screenshot</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onAnalyze(imageFile)} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">Analisar Imagem Inteira</button>
                    <button onClick={() => onAnalyze(imageFile, rects)} disabled={rects.length === 0} className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-amber-900/50 disabled:cursor-not-allowed">Analisar Seleção ({rects.length})</button>
                    <button onClick={handleReset} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded-lg transition-colors text-sm">Resetar</button>
                    <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Cancelar</button>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-auto flex justify-center items-start bg-gray-900">
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp} // End drawing if mouse leaves canvas
                    className="max-w-full max-h-full object-contain cursor-crosshair"
                />
            </div>
            <div className="p-3 border-t border-gray-700 bg-gray-800 text-center text-sm text-gray-400 flex-shrink-0">
                Clique e arraste na imagem para selecionar as áreas com os resultados que você deseja que a IA analise.
            </div>
        </div>
    </div>
  );
};

export default ImageAnnotationModal;