import { useEffect, useState } from "react";
import logoImage from "../../../assets/images/navbar-logo.png";
import { styles } from "./styles";

const LINKS = ["樂理知識", "調性網路", "關於我們"];

export default function NavBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY]);

  return (
    <header style={{ ...styles.bar, ...(isVisible ? {} : styles.barHidden) }}>
      <div style={styles.logo}>
        <img src={logoImage} alt="OnomaRise Logo" style={styles.logoImg} />
      </div>

      <div style={styles.right}>
        <nav style={styles.nav}>
          {LINKS.map((link) => (
            <button
              key={link}
              style={styles.navLink}
              onMouseEnter={(event) => { event.currentTarget.style.color = "#CE97ED"; }}
              onMouseLeave={(event) => { event.currentTarget.style.color = "#8e8ca3"; }}
            >
              {link}
            </button>
          ))}
        </nav>

        <button aria-label="Toggle menu" style={styles.hamburger}>
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
          <span style={styles.hamburgerLine} />
        </button>
      </div>
    </header>
  );
}
