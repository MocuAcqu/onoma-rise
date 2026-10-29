import TonnetzGrid from './TonnetzGrid';
import './Tonnetz.css';

const TonnetzPage4 = () => {
  return (
    <div className="tonnetz-container">
      <h2 className="tonnetz-main-title">音樂轉調與和弦進行</h2>
      
      <div className="tonnetz-interactive-area" style={{ maxWidth: '900px' }}>
        <div className="mode-description" style={{ textAlign: 'center' }}>
          <p className="page-content">
            在線性網路上彈奏，不同的三角形代表不同「和弦」，從一個三角形走到另一個三角形的路線是「和弦進行」，將整個形狀或圖案在網路上做大範圍的平移就是「音樂轉調」。
          </p>
        </div>

        <div className="grid-window" style={{ height: '500px', border: '3px solid var(--color-blue1)' }}>
          <TonnetzGrid 
            mode="face" 
            interactive={true} 
            height="100%" 
          />
        </div>
      </div>

      <p className="instruction-text">使用滑鼠點擊節點（單音）、線條（雙音）或三角形面（和弦）。可拖曳網格平移。</p>
    </div>
  );
};

export default TonnetzPage4;