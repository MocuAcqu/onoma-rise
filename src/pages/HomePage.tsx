import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlacementQuizOverlay from '../components/PlacementQuizOverlay';
import type { PlacementResult } from '../data/placementQuiz';
import './HomePage.css';
import mainLogoImage from '../assets/images/main-logo.png';

const PLACEMENT_STATUS_KEY_PREFIX = 'onomarise_placement_status';

// 旗標要依登入帳號區分，不然同一瀏覽器只要被任何一個帳號（或訪客）問過一次，
// 之後不管換哪個帳號登入（包含全新註冊的帳號）都不會再跳出前測。
function getPlacementStatusKey(): string {
  const username = localStorage.getItem('user');
  return `${PLACEMENT_STATUS_KEY_PREFIX}:${username ?? 'guest'}`;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [showPlacementQuiz, setShowPlacementQuiz] = useState(
    () => localStorage.getItem(getPlacementStatusKey()) === null,
  );

  const handleSkip = () => {
    localStorage.setItem(getPlacementStatusKey(), 'skipped');
    setShowPlacementQuiz(false);
  };

  const handleComplete = (result: PlacementResult) => {
    localStorage.setItem(getPlacementStatusKey(), 'completed');
    // 不要在這裡把 overlay 關掉：navigate 換頁時 HomePage 整棵樹（含 overlay）
    // 會一起卸載，先手動 setShowPlacementQuiz(false) 只會讓首頁內容在換頁前先閃一下。
    navigate('/placement-result', { state: result });
  };

  return (
    <div className="home-content-new">
      {showPlacementQuiz && (
        <PlacementQuizOverlay onSkip={handleSkip} onComplete={handleComplete} />
      )}
      <div className="main-logo-container">
        <img src={mainLogoImage} alt="音擬而起 OnomaRise" className="main-logo-img" />
      </div>

      <div className="home-slogan-container">
        <h1 className="home-slogan-title">讓抽象的音樂理論直觀可見</h1>
        <p className="home-slogan-desc">解決傳統音樂學習的痛點，用多元、視覺化的方式認識音樂。</p>
      </div>

      <div className="home-menu-grid">
        <div className="menu-row-top">
          <Link to="/knowledge" className="menu-button-new btn-knowledge">
            <span className="btn-title">樂理知識</span>
            <span className="btn-desc">跟著六大章節，一步步聽懂音樂的語言</span>
          </Link>
        </div>
        <div className="menu-row-bottom">
          <Link to="/tonnetz" className="menu-button-new btn-tonnetz">
            <span className="btn-title">調性網路</span>
            <span className="btn-desc">用視覺化網格，直覺看懂和弦與轉調的關係</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;