import React, { useEffect, useRef } from 'react';

type Props = {
  triggerTime: number; // 0 代表尚未點擊，非 0 代表點擊的時間戳記
};

const AirMoleculeCanvas: React.FC<Props> = ({ triggerTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTriggerRef = useRef<number>(0);
  
  // 隨機位移緩存，用於模擬布朗運動，增加真實感
  const jitters = useRef<{ x: number; y: number }[]>([]);

  // 初始化布朗運動隨機值
  if (jitters.current.length === 0) {
    for (let i = 0; i < 15 * 25; i++) {
      jitters.current.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
    }
  }

  const draw = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const rows = 15;
    const cols = 25;
    const spacingX = canvas.width / cols;
    const spacingY = canvas.height / rows;

    const waveSpeed = 0.25; 
    const waveWidth = 80;  
    const elapsed = lastTriggerRef.current > 0 ? time - lastTriggerRef.current : -1;

    let index = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let baseX = i * spacingX + spacingX / 2;
        let baseY = j * spacingY + spacingY / 2;

        // --- 優化 1：加入微小的布朗運動 (熱運動) ---
        // 隨時間變化的微小漂移
        const thermalX = Math.sin(time * 0.005 + index) * 0.8;
        const thermalY = Math.cos(time * 0.005 + index) * 0.8;

        let x = baseX + thermalX;
        let y = baseY + thermalY;

        // 計算距離中心
        const dx = baseX - centerX;
        const dy = baseY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- 優化 2：波紋邏輯 ---
        const waveFront = elapsed * waveSpeed;
        
        // 只有當 elapsed > 0 (已被點擊) 且波前在合理範圍內時才計算震動
        if (elapsed > 0 && dist < waveFront && dist > waveFront - waveWidth) {
          // 時間衰減：波傳播越久能量越弱
          const timeDecay = Math.max(0, 1 - elapsed / 3000); 
          // 距離衰減
          const distDecay = Math.max(0, 1 - dist / 500);
          
          // 縱波物理公式：sin(k*r - w*t)
          const intensity = Math.sin((dist - waveFront) * 0.12) * 18 * timeDecay * distDecay;
          
          const angle = Math.atan2(dy, dx);
          x += Math.cos(angle) * intensity;
          y += Math.sin(angle) * intensity;
        }

        // 繪製分子
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        // 如果正在震動，顏色稍微亮一點
        ctx.fillStyle = (elapsed > 0 && dist < waveFront && dist > waveFront - waveWidth) ? "#80A2F2" : "#B0B0B0";
        ctx.fill();
        index++;
      }
    }
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    // --- 關鍵修正：解決一進介面就波動的問題 ---
    // 只有當 triggerTime 大於 0 時，才更新 lastTriggerRef 啟動波紋
    if (triggerTime > 0) {
      lastTriggerRef.current = performance.now();
    }
  }, [triggerTime]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={350} 
      className="formation-canvas"
      style={{ background: 'radial-gradient(circle, #ffffff 0%, #f4f7f9 100%)' }}
    />
  );
};

export default AirMoleculeCanvas;