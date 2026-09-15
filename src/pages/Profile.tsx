import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { knowledgeTopics } from './knowledgeData';
import { topicQuizzes } from './quizQuestions';
import { FiBook, FiCheckCircle, FiHeart } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem('user');
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (!currentUsername) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/dashboard/${currentUsername}`);
        setDashboardData(res.data);
      } catch (err) {
        console.error('無法獲取儀表板數據', err);
      }
    };
    fetchDashboard();
  }, [currentUsername, navigate]);

  if (!dashboardData) return <div className="loading">載入中...</div>;

  const totalChapters = 16; 
  const totalQuizzes = Object.keys(topicQuizzes).length;
  
  const viewedCount = dashboardData.viewedChapters.length;
  const passedQuizzesCount = dashboardData.quizRecords.filter((q: any) => q.passed).length;
  
  // 計算總體完成度百分比
  const completionRate = Math.round(((viewedCount / totalChapters) * 0.5 + (passedQuizzesCount / totalQuizzes) * 0.5) * 100);

  // 整理喜歡的章節名稱
  const likedChapterTitles = dashboardData.likedChapters.map((chapId: string) => {
    for (const topic of knowledgeTopics) {
      const found = topic.chapters.find(c => c.id === chapId);
      if (found) return { topicTitle: topic.title, title: found.title, route: found.route };
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">{currentUsername?.charAt(0).toUpperCase()}</div>
        <h1>哈囉，{currentUsername}！</h1>
        <h3>音為有你，眾音皆起。</h3>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card completion-card">
          <h2>學習完成度</h2>
          <div 
            className="progress-circle"
            style={{ background: `conic-gradient(var(--color-sunset-pink) ${completionRate}%, #e2e8f0 0deg)` }}
          >
            <span className="percentage">{completionRate > 100 ? 100 : completionRate}%</span>
          </div>
          <ul className="progress-details">
            <li><FiBook /> 閱讀章節: {viewedCount} / {totalChapters}</li>
            <li><FiCheckCircle /> 完成測驗: {passedQuizzesCount} / {totalQuizzes}</li>
            <li className={dashboardData.visitedAbout ? 'completed' : 'uncompleted'}>
              關於我們: {dashboardData.visitedAbout ? '已解鎖' : '未探索'}
            </li>
          </ul>
        </div>

        <div className="dashboard-card quiz-records-card">
          <h2>測驗挑戰紀錄</h2>
          {dashboardData.quizRecords.length === 0 ? (
            <p className="empty-msg">還沒有參加過測驗喔，快去挑戰吧！</p>
          ) : (
            <ul className="quiz-list">
              {dashboardData.quizRecords.map((record: any) => {
                const quizInfo = topicQuizzes[record.topicId];
                return (
                  <li key={record.topicId} className={`quiz-item ${record.passed ? 'passed' : 'failed'}`}>
                    <div className="quiz-info">
                      <h4>{quizInfo?.title || record.topicId}</h4>
                      <p>嘗試次數: {record.attempts} 次</p>
                    </div>
                    <div className="quiz-status">
                      {record.passed ? '恭喜全對' : '再接再厲'}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dashboard-card liked-card">
          <h2><FiHeart color="#ef4444" /> 喜歡的章節</h2>
          {likedChapterTitles.length === 0 ? (
            <p className="empty-msg">還沒有喜歡的章節，去樂理知識逛逛吧！</p>
          ) : (
            <ul className="liked-list">
              {likedChapterTitles.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link to={item.route} className="liked-link">
                    <span className="topic-tag">{item.topicTitle}</span>
                    <span className="chap-title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;