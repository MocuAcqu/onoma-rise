import './IntervalDefinition.css'; 

const IntervalPage4 = () => {
  return (
    <div className="interval-container">
      <p className="page-content">以大調音階（ＣＤＥＦＧＡＢ）為基準，任何升降記號皆不影響度數的關係，只跟音的「音名」有關，因此會有相同度數但實際距離不同的問題。</p>
      <img 
        src="/assets/interval-degree-static.png" 
        alt="相同度數但距離不同"
        style={{ maxWidth: '70%', margin: '1rem 0' }}
      />

      <div className="interval-result">
        <div className="result-note-box">Do</div>
        <div className="result-arrow">
          <span className="result-text">差 3 度</span>
          <div className="arrow-line"></div>
        </div>
        <div className="result-note-box">Mi</div>
      </div>

      <p className="instruction-text">以上任意一組音符，皆差三度</p>
    </div>
  );
};

export default IntervalPage4;