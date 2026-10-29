import React, { useEffect, useRef } from 'react';

type Props = { 
  amplitude: number; 
  frequency: number; 
  waveType: 'sine' | 'square' | 'sawtooth' | 'triangle' 
};

const WaveformCanvas: React.FC<Props> = ({ amplitude, frequency, waveType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  let offset = 0;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = '#377589';
    ctx.lineWidth = 3;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    for (let x = 0; x < width; x++) {
      const t = (x + offset) * (frequency / 1000);
      let y = 0;

      // 根據不同的 waveType 使用不同的數學公式
      switch (waveType) {
        case 'sine':
          y = Math.sin(t);
          break;
        case 'square':
          y = Math.sin(t) >= 0 ? 1 : -1;
          break;
        case 'sawtooth':
          y = 2 * (t / (Math.PI * 2) - Math.floor(0.5 + t / (Math.PI * 2)));
          break;
        case 'triangle':
          y = Math.asin(Math.sin(t)) / (Math.PI / 2);
          break;
      }

      const drawY = centerY + y * (amplitude * 1.5);
      if (x === 0) ctx.moveTo(x, drawY);
      else ctx.lineTo(x, drawY);
    }

    ctx.stroke();
    offset -= 5; // 讓波形持續移動
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [amplitude, frequency, waveType]);

  return <canvas ref={canvasRef} width={450} height={250} className="waveform-canvas" />;
};

export default WaveformCanvas;