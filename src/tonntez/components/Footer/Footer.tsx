import footerLogo from "../../../assets/images/footer-logo.png";
import { styles } from "./styles";

export default function Footer() {
  return (
    <footer style={styles.bar}>
      <div style={styles.content}>
        <div style={styles.center}>
          <img src={footerLogo} alt="Logo" style={styles.logoImg} />
          <span style={styles.text}>© 2026 OnomaRise.</span>
          <button style={styles.link}>term</button>
          <button style={styles.link}>about us</button>
        </div>
      </div>
    </footer>
  );
}
