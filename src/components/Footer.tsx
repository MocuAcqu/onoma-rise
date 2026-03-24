import { Link } from 'react-router-dom';
import './Footer.css';
import footerLogo from '../assets/images/footer-logo.png';

const Footer = () => {
  return (
    <footer className="footer-new">
      <div className="footer-content">        
        <div className="footer-center">
            <img src={footerLogo} alt="Logo" style={{ width: '60px', opacity: 0.5}} />
            <span>© 2026 OnomaRise.</span>
            <Link to="/terms">term</Link>
            <Link to="/about">about us</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;