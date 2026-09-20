import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { PlacementResult } from '../data/placementQuiz';
import '../pages/KnowledgePage.css';
import './PlacementResultPage.css';

const STORAGE_KEY = 'onomarise_placement_result';

export default function PlacementResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<PlacementResult | null>(
    (location.state as PlacementResult | undefined) ?? null,
  );

  useEffect(() => {
    if (location.state) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location.state));
      return;
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setResult(JSON.parse(stored) as PlacementResult);
    } else {
      navigate('/home', { replace: true });
    }
  }, [location.state, navigate]);

  if (!result) return null;

  return (
    <div className="placement-result">
      <h1 className="placement-result__title">為你推薦的起點</h1>
      <p className="placement-result__message">{result.message}</p>

      <div className="topics-list placement-result__list">
        {result.recommendedUnits.map((unit, index) => (
          <Link
            key={unit.topicId}
            to={unit.route}
            className="topic-card-link"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="topic-card-content">
              <div className="card-visual-placeholder" style={{ background: unit.gradient }} />
              <div className="card-info">
                <h2 className="topic-title">{unit.title}</h2>
                <p className="topic-description">{unit.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="placement-result__actions">
        <Link to="/knowledge" className="placement-btn placement-btn--primary">瀏覽全部單元</Link>
        <Link to="/home" className="placement-btn placement-btn--secondary">回到首頁</Link>
      </div>
    </div>
  );
}
