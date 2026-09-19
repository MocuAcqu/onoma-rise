import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { PlacementResult } from '../data/placementQuiz';
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

      <div className="placement-result__list">
        {result.recommendedUnits.map((unit) => (
          <Link key={unit.topicId} to={`/knowledge/${unit.topicId}`} className="placement-result__item">
            <div className="placement-result__item-thumb" />
            <div className="placement-result__item-body">
              <h2>{unit.title}</h2>
              <p>{unit.description}</p>
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
