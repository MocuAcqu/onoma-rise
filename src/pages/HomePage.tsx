import { Link } from 'react-router-dom';
import './HomePage.css';
import mainLogoImage from '../assets/images/main-logo.png';

const HomePage = () => {
  return (
    <div className="home-content-new">
      <div className="main-logo-container">
        <img src={mainLogoImage} alt="音擬而起 OnomaRise" className="main-logo-img" />
      </div>

      <div className="home-menu-grid">
        <div className="menu-row-top">
          <Link to="/identify" className="menu-button-new btn-identify">
            音樂辨識
          </Link>
          <Link to="/knowledge" className="menu-button-new btn-knowledge">
            樂理知識
          </Link>
        </div>
        <div className="menu-row-bottom">
          <Link to="/tonnetz" className="menu-button-new btn-tonnetz">
            調性網路
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;