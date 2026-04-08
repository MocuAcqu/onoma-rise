import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import './Navbar.css';
import logoImage from '../assets/images/navbar-logo.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  const toggleMenu = () => { setIsMenuOpen(!isMenuOpen) };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // 向下捲動且超過 100px
      } else {
        setIsVisible(true); // 向上捲動
      }
      setLastScrollY(currentScrollY);

    };

    window.addEventListener('scroll', controlNavbar);

    // 清除監聽器，避免記憶體洩漏
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className={`navbar-new ${!isVisible && !isMenuOpen ? 'hidden' : ''}`}>
      <div className="nav-container">
        <Link to="/home" className="nav-brand-new">
          <img src={logoImage} alt="OnomaRise Logo" className="navbar-logo-img" />
        </Link>

        <nav className="nav-links">
          <Link to="/identify">音樂辨識</Link>
          <Link to="/knowledge">樂理知識</Link>
          <Link to="/tonnetz">調性網路</Link>
          <Link to="/about">關於我們</Link>
        </nav>

        <div className="nav-user-section">
          <button 
            className={`hamburger-btn-new ${isMenuOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
            aria-label="Toggle user menu"
          >
            <span className="line"></span>
            <span className="line"></span>
            <span className="line"></span>
          </button>

          <nav className={`user-menu ${isMenuOpen ? 'open' : ''}`}>
            {user ? (
              <>
                <div className="user-info">Hi, {user}</div>
                <ul>
                  <li><Link to="/profile" onClick={() => setIsMenuOpen(false)}>個人資料</Link></li>
                  <li><button onClick={handleLogout} className="logout-btn">登出</button></li>
                </ul>
              </>
            ) : (
              <ul>
                <li><Link to="/login" onClick={() => setIsMenuOpen(false)}>登入 / 註冊</Link></li>
              </ul>
            )}
          </nav>
        </div>
      </div>
      {isMenuOpen && <div className="menu-overlay-new" onClick={() => setIsMenuOpen(false)}></div>}
    </header>
  );
};

export default Navbar;