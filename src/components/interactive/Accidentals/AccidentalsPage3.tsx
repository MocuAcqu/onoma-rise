import './StaticStaffExample.css';

const Page3 = () => {
  return (
    <div className="page-content">
      <p>若升降符號位於音符左方，稱為臨時記號，只會在同一小節生效。在譜號的右方，稱為調號，除非有另作交待，否則會在整段音樂持續生效。</p>
      
      <div className="static-staff-container">
        
        {/* 左側：臨時記號圖片展示區 */}
        <div className="staff-section image-section">
          <img 
            src="/assets/accidentals-example-left.png" 
            alt="臨時記號範例" 
            className="staff-example-img"
          />
        </div>

        {/* 右側：調號圖片展示區 */}
        <div className="staff-section image-section">
          <img 
            src="/assets/accidentals-example-right.png" 
            alt="調號範例" 
            className="staff-example-img"
          />
        </div>

      </div>
    </div>
  );
};

export default Page3;