import './AboutPage.css';
import member1 from '../assets/images/about/member1.jpg';
import member2 from '../assets/images/about/member2.jpg';
import member3 from '../assets/images/about/member3.jpg';
import member4 from '../assets/images/about/member4.jpg';
import member5 from '../assets/images/about/member5.jpg';
// 照片放在 src/assets/images/team/ 資料夾
// 命名規則：member1.jpg、member2.jpg ... 以此類推
// 加入照片後將 null 替換為 import 的圖片變數
const teamMembers = [
  { name: '邱鈺婷', 
    photo: member1,
    role1: '團隊分工與會議領導',
    role2: '主架構與樂理知識功能全端開發與設計',
    role3: 'Github 與 MongoDB 維護與管理',
    email: 'a0901422997@gmail.com'
  },
  { name: '李孟潔', 
    photo: member2,
    role1: '調性網路設計發想',
    role2: '音樂辨識功能開發',
    role3: '音樂辨識功能測試與校正',
    email: 'marianna20041221@gmail.com'
  },
  { name: '盧姵帆', 
    photo: member3,
    role1: '調性網路功能開發與設計',
    role2: '調性網路與辨識功能整合',
    role3: '辨識功能協作開發',
    email: 'phoebelu0724@gmail.com'
  },
  { name: '李佳璇', 
    photo: member4,
    role1: '品牌logo美術設計',
    role2: 'logo轉場動畫編排',
    role3: '互動角色動畫設計',
    email: '0626poke@gmail.com'
  },
  { name: '呂雨璇', 
    photo: member5,
    role1: 'UI/UX 設計',
    role2: '吉祥物設計',
    role3: '前端程式協作開發',
    email: 'lyx2299@gmail.com'
  },
];

// type:'internal' | 'project'
const timeline = [
  { date: '2025.8.4',  event: '團隊組成',       type: 'internal' },
  { date: '2025.9',    event: '共識會',         type: 'internal' },
  { date: '2026.2.3',  event: '第三次組內會議',   type: 'internal'  },
  { date: '2026.2.9',  event: '第一次專題會議',   type: 'project'   },
  { date: '2026.2.27', event: '第四次組內會議',   type: 'internal'  },
  { date: '2026.3.6',  event: '第二次專題會議',   type: 'project'   },
  { date: '2026.3.13', event: '第五次組內會議',   type: 'internal'  },
  { date: '2026.3.20', event: '第三次專題會議',   type: 'project'   },
  { date: '2026.4.10', event: '第六次組內會議',   type: 'internal'   },
  { date: '2026.4.24', event: '第七次組內會議',   type: 'internal'   },
  { date: '2026.5.1',  event: '第八次組內會議',   type: 'internal'   },
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
              {member.photo
                ? <img src={member.photo} alt={member.name} className="team-photo" />
                : <div className="team-photo team-photo-placeholder" />
              }
              <p className="team-name">{member.name}</p>
              <p className="team-role">{member.role1}</p>
              <p className="team-role">{member.role2}</p>
              <p className="team-role">{member.role3}</p>
              <p></p>
              <p className="team-role">{member.email}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2 className="about-section-title">製作歷程</h2>
        <div className="timeline-legend">
          <span className="legend-item legend-project">教授參與</span>
        </div>
        <div className="timeline">
          {timeline.map((item, i) => (
            <div className="timeline-item" key={i}>
              <div className={`timeline-dot timeline-dot--${item.type}`} />
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
