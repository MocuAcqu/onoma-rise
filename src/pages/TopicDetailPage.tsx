import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiClipboard, FiEye, FiHeart } from 'react-icons/fi';
import axios from 'axios';
import { knowledgeTopics } from './knowledgeData';
import './TopicDetailPage.css';

const TopicDetailPage = () => {
  const { topicId } = useParams();
  const currentUsername = localStorage.getItem('user');

  const currentTopic = knowledgeTopics.find(topic => topic.id === topicId);

  const [chapterStats, setChapterStats] = useState<Record<string, { views: number, likes: number, hasLiked: boolean }>>({});

  useEffect(() => {
    if (!currentTopic) return;

    const fetchAllStats = async () => {
      const statsObj: Record<string, { views: number, likes: number, hasLiked: boolean }> = {};
      
      await Promise.all(
        currentTopic.chapters.map(async (chapter) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/chapters/${chapter.id}`);
            statsObj[chapter.id] = {
              views: res.data.views,
              likes: res.data.likes,
              hasLiked: currentUsername ? res.data.likedBy.includes(currentUsername) : false
            };
          } catch (err) {
            console.error(`無法獲取 ${chapter.id} 的數據`, err);
            statsObj[chapter.id] = { views: 0, likes: 0, hasLiked: false };
          }
        })
      );
      
      setChapterStats(statsObj);
    };

    fetchAllStats();
  }, [currentTopic, currentUsername]);

  const handleCardLike = async (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUsername) {
      alert("請先登入才能按讚喔！");
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/chapters/${chapterId}/like`, {
        username: currentUsername 
      });
      
      setChapterStats(prev => ({
        ...prev,
        [chapterId]: {
          ...prev[chapterId],
          likes: res.data.likes,
          hasLiked: res.data.hasLiked
        }
      }));
    } catch (err) {
      console.error("按讚失敗", err);
    }
  };

  if (!currentTopic) {
    return <div className="topic-not-found">主題不存在</div>;
  }

  return (
    <div className="topic-detail-container">
      <div className="topic-header">
        <h1 className="topic-main-title">
          {currentTopic.title}
        </h1>
      </div>

      <div className="breadcrumbs-container">
        <p className="breadcrumbs">
        <Link to="/knowledge">樂理知識</Link> &gt; {currentTopic.title}
        </p>
      </div>

      <div className="chapters-grid">
        {currentTopic.chapters.map((chapter, index) => {
          const stats = chapterStats[chapter.id] || { views: 0, likes: 0, hasLiked: false };

          return (
            <Link 
              to={chapter.route} 
              key={chapter.id} 
              className="chapter-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="chapter-visual-placeholder"></div>
              <div className="chapter-content">
                <h3 className="chapter-title">{chapter.title}</h3>
                
                <div className="chapter-stats">
                  <div className="stat-item">
                    <FiEye />
                    <span>{stats.views}</span>
                  </div>
                  
                  <button 
                    className="stat-item"
                    onClick={(e) => handleCardLike(e, chapter.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      color: stats.hasLiked ? '#ef4444' : 'inherit', 
                      padding: 0,
                      fontFamily: 'inherit'
                    }}
                  >
                    <FiHeart fill={stats.hasLiked ? '#ef4444' : 'none'} />
                    <span>{stats.likes}</span>
                  </button>
                </div>

              </div>
            </Link>
          );
        })}
      </div>

      <Link to={`/knowledge/${currentTopic.id}/quiz`} className="topic-quiz-button">
        <FiClipboard /> 測驗題目
      </Link>
    </div>
  );
};

export default TopicDetailPage;