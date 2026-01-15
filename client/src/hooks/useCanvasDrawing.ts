import { useRef, useState, useEffect } from 'react';
import type { Stroke, Color } from '../similarity/model';

interface UseCanvasDrawingReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  strokes: Stroke[];
  currentColor: Color;
  setCurrentColor: (color: Color) => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  loadStrokes: (loadedStrokes: Stroke[]) => void;
}

/**
 * 캔버스에서 그림을 그리고 스트로크 데이터를 수집하는 훅
 */
export const useCanvasDrawing = (
  canvasWidth: number,
  canvasHeight: number,
  onStrokeComplete?: (strokes: Stroke[]) => void
): UseCanvasDrawingReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentColor, setCurrentColor] = useState<Color>([0, 0, 0]); // 기본 검정색
  const [currentStroke, setCurrentStroke] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight]);

  // 그리기 시작
  const startDrawing = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 캔버스 좌표를 0-255 범위로 정규화
    const normalizedX = Math.round((x / canvasWidth) * 255);
    const normalizedY = Math.round((y / canvasHeight) * 255);

    setIsDrawing(true);
    setCurrentStroke({ x: [normalizedX], y: [normalizedY] });

    // 캔버스에 그리기 시작
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // 그리기 중
  const draw = (e: MouseEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 캔버스 좌표를 0-255 범위로 정규화
    const normalizedX = Math.round((x / canvasWidth) * 255);
    const normalizedY = Math.round((y / canvasHeight) * 255);

    // 포인트 추가
    setCurrentStroke((prev) => ({
      x: [...prev.x, normalizedX],
      y: [...prev.y, normalizedY],
    }));

    // 캔버스에 그리기
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // 그리기 종료
  const endDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // 스트로크 완성
    if (currentStroke.x.length > 0) {
      const newStroke: Stroke = {
        points: [currentStroke.x, currentStroke.y],
        color: currentColor,
      };

      const updatedStrokes = [...strokes, newStroke];
      setStrokes(updatedStrokes);
      setCurrentStroke({ x: [], y: [] });

      // 스트로크 완성 콜백 호출
      if (onStrokeComplete) {
        onStrokeComplete(updatedStrokes);
      }
    }
  };

  // 캔버스 초기화
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    setStrokes([]);
    setCurrentStroke({ x: [], y: [] });

    // 스트로크 초기화 콜백 호출
    if (onStrokeComplete) {
      onStrokeComplete([]);
    }
  };

  // 마지막 스트로크 취소
  const undoStroke = () => {
    if (strokes.length === 0) return;

    const updatedStrokes = strokes.slice(0, -1);
    setStrokes(updatedStrokes);

    // 캔버스 다시 그리기
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 지우기
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 남은 스트로크들 다시 그리기
    updatedStrokes.forEach((stroke) => {
      const [xPoints, yPoints] = stroke.points;
      const [r, g, b] = stroke.color;

      if (xPoints.length === 0) return;

      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      const firstX = (xPoints[0] / 255) * canvasWidth;
      const firstY = (yPoints[0] / 255) * canvasHeight;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < xPoints.length; i++) {
        const x = (xPoints[i] / 255) * canvasWidth;
        const y = (yPoints[i] / 255) * canvasHeight;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    });

    // 유사도 재계산 콜백 호출
    if (onStrokeComplete) {
      onStrokeComplete(updatedStrokes);
    }
  };

  // 스트로크 데이터 로드
  const loadStrokes = (loadedStrokes: Stroke[]) => {
    setStrokes(loadedStrokes);

    // 캔버스 다시 그리기
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 지우기
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 로드된 스트로크들 그리기
    loadedStrokes.forEach((stroke) => {
      const [xPoints, yPoints] = stroke.points;
      const [r, g, b] = stroke.color;

      if (xPoints.length === 0) return;

      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      const firstX = (xPoints[0] / 255) * canvasWidth;
      const firstY = (yPoints[0] / 255) * canvasHeight;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < xPoints.length; i++) {
        const x = (xPoints[i] / 255) * canvasWidth;
        const y = (yPoints[i] / 255) * canvasHeight;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    });

    // 유사도 재계산 콜백 호출
    if (onStrokeComplete) {
      onStrokeComplete(loadedStrokes);
    }
  };

  // 이벤트 리스너 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDrawing);
      canvas.removeEventListener('mouseleave', endDrawing);
    };
  });

  return {
    canvasRef,
    strokes,
    currentColor,
    setCurrentColor,
    clearCanvas,
    undoStroke,
    loadStrokes,
  };
};
