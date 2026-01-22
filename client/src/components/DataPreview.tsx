import { useEffect, useRef, useState } from 'react';
import drawingData from '../../../drawing.json';
import { drawStrokes } from '../utils/drawStrokes';
import type { Stroke, Color } from '../similarity/model';

const ITEMS_PER_PAGE = 20;
const THUMBNAIL_SIZE = 150;

const DrawingThumbnail = ({ strokes, index }: { strokes: Stroke[]; index: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    drawStrokes(ctx, strokes, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }, [strokes]);

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '5px', 
      textAlign: 'center',
      backgroundColor: '#fff',
      borderRadius: '4px'
    }}>
      <canvas
        ref={canvasRef}
        width={THUMBNAIL_SIZE}
        height={THUMBNAIL_SIZE}
        style={{ border: '1px solid #eee' }}
      />
      <div style={{ fontSize: '12px', marginTop: '5px' }}>ID: {index}</div>
    </div>
  );
};

export const DataPreview = () => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(drawingData.length / ITEMS_PER_PAGE);

  const currentItems = drawingData.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1>데이터 미리보기 (총 {drawingData.length}개)</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{ padding: '5px 10px' }}
        >
          이전
        </button>
        <span>페이지 {page + 1} / {totalPages}</span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          style={{ padding: '5px 10px' }}
        >
          다음
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '20px' 
      }}>
        {currentItems.map((item, idx) => {
          const globalIndex = page * ITEMS_PER_PAGE + idx;
          const strokes: Stroke[] = item.map((s: any) => ({
            points: s.points as [number[], number[]],
            color: s.color as Color
          }));

          return (
            <DrawingThumbnail 
              key={globalIndex} 
              strokes={strokes} 
              index={globalIndex} 
            />
          );
        })}
      </div>
    </div>
  );
};
