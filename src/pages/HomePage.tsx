import { Link } from 'react-router-dom';
import './HomePage.css';
import mainLogoImage from '../assets/images/main-logo.png';

const HomePage = () => {
  return (
    <div className="home-content-new">
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