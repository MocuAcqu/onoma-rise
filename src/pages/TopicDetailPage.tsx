import { Link, useParams } from 'react-router-dom';
import { FiClipboard, FiEye, FiHeart } from 'react-icons/fi';
import { knowledgeTopics } from './knowledgeData';
import './TopicDetailPage.css';

const TopicDetailPage = () => {
  const { topicId } = useParams();

  const currentTopic = knowledgeTopics.find(topic => topic.id === topicId);

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
        {currentTopic.chapters.map((chapter, index) => (
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
                  <span>000</span>
                </div>
                <div className="stat-item">
                  <FiHeart />
                  <span>000</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link to={`/knowledge/${currentTopic.id}/quiz`} className="topic-quiz-button">
        <FiClipboard /> 測驗題目
      </Link>
    </div>
  );
};

export default TopicDetailPage;
