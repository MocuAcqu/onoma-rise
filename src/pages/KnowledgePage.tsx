import { Link } from 'react-router-dom';
import { knowledgeTopics } from './knowledgeData';
import './KnowledgePage.css';

const KnowledgePage = () => {
  return (
    <div className="knowledge-page-container">
      <div className="knowledge-header">
        <h1 className="knowledge-title">樂理知識</h1>
        <p className="knowledge-subtitle">Music theory knowledge</p>
      </div>

      <div className="topics-list">
        {knowledgeTopics.map((topic, index) => (
          <Link 
            to={topic.route} 
            className="topic-card-link"
            key={topic.id}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="topic-card-content">
              <div className="card-visual-placeholder" style={{ background: topic.gradient }}></div>
              <div className="card-info">
                <h2 className="topic-title">
                  {topic.title}
                </h2>
                <p className="topic-description">{topic.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default KnowledgePage;