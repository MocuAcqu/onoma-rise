import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const toggleMenu = () => { setIsMenuOpen(!isMenuOpen) };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="nav-brand">
            <div className="logo-placeholder"></div>
            <span className="app-name">音擬而起</span>
        </Link>
      </div>

      <div className="navbar-right">
        {user && <span className="user-greeting">Hi, {user}</span>}

        <button 
          className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </button>

        <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul>
            <li>
              <Link to="/home" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
            </li>

            {user ? (
               <li>
                 <button onClick={handleLogout} className="logout-btn">
                   Logout
                 </button>
               </li>
            ) : (
               <li><Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link></li>
            )}
          </ul>
        </nav>
      </div>
      
      {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>}
    </header>
  );
};

export default Navbar;