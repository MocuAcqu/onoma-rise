import './AboutPage.css';

const teamMembers = [
  { name: '組員一', role: 'xxx' },
  { name: '組員二', role: 'xxx' },
  { name: '組員三', role: 'xxx' },
  { name: '組員四', role: 'xxx' },
  { name: '組員五', role: 'xxx' },
];

const timeline = [
  { date: '2025.8.4', event: '團隊組成' },
  { date: '2025.9', event: '共識會' },
];

const tools = [
  'React', 'TypeScript', 'Vite', 'Tone.js', 'VexFlow', 'MongoDB', 'Express',
];

const AboutPage = () => {
  return (
    <div className="about-page">

      <div className="about-header">
        <h1 className="about-main-title">關於我們</h1>
        <p className="about-subtitle">about us</p>
      </div>

      <section className="about-section">
        <h2 className="about-section-title">專題理念</h2>
        <div className="about-text-block">
          <p>
            待補充
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">團隊成員</h2>
        <div className="team-grid">
          {teamMembers.map((member, i) => (
            <div className="team-card" key={i}>
              <div className="team-avatar" />
              <p className="team-name">{member.name}</p>
              <p className="team-role">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">製作歷程</h2>
        <div className="timeline">
          {timeline.map((item, i) => (
            <div className="timeline-item" key={i}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <p className="timeline-event">{item.event}</p>
                <p className="timeline-date">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">未來展望</h2>
        <div className="future-layout">
          <div className="future-text">
            <p>
              待補充
            </p>
          </div>
          <div className="future-card" />
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">技術與工具</h2>
        <div className="tools-grid">
          {tools.map((tool, i) => (
            <div className="tool-tag" key={i}>{tool}</div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
