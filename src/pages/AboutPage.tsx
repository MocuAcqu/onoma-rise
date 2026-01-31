import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-container">
    <div className="about-card">
        <h1 className="about-title">關於 音擬而起</h1>
        <p className="about-tagline">讓音樂創作變得像呼吸一樣自然</p>
        
        <div className="about-content">
        <section>
            <h3>專案願景</h3>
            <p>
            我們致力於打破樂理的門檻，
            讓任何人都能直覺地探索聲音之美，
            用互動的方式視覺化體驗音樂的模樣。
            </p>
        </section>
        
        <section>
            <h3>核心功能</h3>
            <ul className="feature-list">
            <li>✨ <strong>樂理認識:</strong> 透過視覺化、互動，認識樂理</li>
            <li>🎹 <strong>音樂創作:</strong> 操作與創作音樂、讓聲音用不同方式呈現</li>
            <li>🎵 <strong>音樂控制:</strong> 調整音樂參數、使聲音可以被變換</li>
            </ul>
        </section>
        </div>

        <div className="footer-note">
        <p>Designed with ❤️ by Onoma Rise Team</p>
        <p className="version">v0.1.0 2026/01/31</p>
        </div>
    </div>
    </div>
  );
};

export default AboutPage;