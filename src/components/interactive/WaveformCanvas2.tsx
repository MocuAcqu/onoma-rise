import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';

type Props = { 
  analyser: Tone.Analyser | null; // 接收真實的分析器
};

const WaveformCanvas: React.FC<Props> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 取得即時波形數據 (數值在 -1 到 1 之間)
    const values = analyser.getValue() as Float32Array;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#377589';

    const width = canvas.width;
    const height = canvas.height;
    const sliceWidth = width / values.length;
    let x = 0;

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const y = (v * (height / 2)) + (height / 2);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }

    ctx.stroke();
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [analyser]);

  return <canvas ref={canvasRef} width={500} height={250} className="waveform-canvas" />;
};

export default WaveformCanvas;