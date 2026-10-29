import '../Interval/IntervalDefinition.css';

const QualityPage2 = () => {
  return (
    <div className="interval-container">
      <p className="page-content">若遇到非大調音階、當中包含著升降符號的情況時，可根據升或降幾個半音去改變形容詞，決定度的名稱。</p>
      
      <div className="quality-rules-card">
        <div className="rule-group">
          <div className="rule-title">1 4 5 8</div>
          <div className="rule-flow">
            <span className="rule-item">減</span>
            <div className="rule-arrow left"><span>- 半音</span></div>
            <span className="rule-item perfect">完全</span>
            <div className="rule-arrow right"><span>+ 半音</span></div>
            <span className="rule-item">增</span>
          </div>
        </div>
      </div>
      <div className="quality-rules-card">
        <div className="rule-group">
          <div className="rule-flow">
            <span className="rule-item">減</span>
            <div className="rule-arrow left"><span>- 半音</span></div>
            <span className="rule-item">小</span>
            <div className="rule-arrow left"><span>- 半音</span></div>
            <span className="rule-item major">大</span>
            <div className="rule-arrow right"><span>+ 半音</span></div>
            <span className="rule-item">增</span>
          </div>
          <div className="rule-title">2 3 6 7</div>
        </div>
      </div>
    </div>
  );
};

export default QualityPage2;