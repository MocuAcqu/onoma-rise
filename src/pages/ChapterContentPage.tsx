import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { IoCaretBack, IoCaretForward, IoHeartOutline, IoHeart, IoEyeOutline } from 'react-icons/io5'; 
import { knowledgeTopics } from './knowledgeData';
import axios from 'axios';
import './ChapterContentPage.css';

import PitchNamePage1 from '../components/interactive/PitchName/PitchNamePage1';
import PitchNamePage2 from '../components/interactive/PitchName/PitchNamePage2';
import PitchNamePage3 from '../components/interactive/PitchName/PitchNamePage3';
import PitchNamePage4 from '../components/interactive/PitchName/PitchNamePage4';
import SolfegePage1 from '../components/interactive/Solfege/SolfegePage1';
import SolfegePage2 from '../components/interactive/Solfege/SolfegePage2';
import SolfegePage3 from '../components/interactive/Solfege/SolfegePage3';
import AccidentalsPage1 from '../components/interactive/Accidentals/AccidentalsPage1';
import AccidentalsPage2 from '../components/interactive/Accidentals/AccidentalsPage2';
import AccidentalsPage3 from '../components/interactive/Accidentals/AccidentalsPage3';
import SoundFormationPage1 from '../components/interactive/SoundFormation/SoundFormationPage1';
import SoundFormationPage2 from '../components/interactive/SoundFormation/SoundFormationPage2';
import SoundFormationPage3 from '../components/interactive/SoundFormation/SoundFormationPage3';
import SoundFormationPage4 from '../components/interactive/SoundFormation/SoundFormationPage4';
import EqualTemperamentPage1 from '../components/interactive/EqualTemperament/EqualTemperamentPage1';
import EqualTemperamentPage2 from '../components/interactive/EqualTemperament/EqualTemperamentPage2';
import EqualTemperamentPage3 from '../components/interactive/EqualTemperament/EqualTemperamentPage3';
import EqualTemperamentPage4 from '../components/interactive/EqualTemperament/EqualTemperamentPage4';
import PitchClassSetPage1 from '../components/interactive/PitchClassSet/pitchClassSetPage1';
import PitchClassSetPage2 from '../components/interactive/PitchClassSet/pitchClassSetPage2';
import PitchClassSetPage3 from '../components/interactive/PitchClassSet/pitchClassSetPage3';
import PitchClassSetPage4 from '../components/interactive/PitchClassSet/pitchClassSetPage4';
import IntervalPage1 from '../components/interactive/Interval/IntervalDefinitionPage1';
import IntervalPage2 from '../components/interactive/Interval/IntervalDefinitionPage2';
import IntervalPage3 from '../components/interactive/Interval/IntervalDefinitionPage3';
import IntervalPage4 from '../components/interactive/Interval/IntervalDefinitionPage4';
import QualityPage1 from '../components/interactive/Quality/QualityPage1';
import QualityPage2 from '../components/interactive/Quality/QualityPage2';
import QualityPage3 from '../components/interactive/Quality/QualityPage3';
import ScalePage1 from '../components/interactive/Scale/ScalePage1';
import ScalePage2 from '../components/interactive/Scale/ScalePage2';
import ScalePage3 from '../components/interactive/Scale/ScalePage3';
import { TypePage1, TypePage2, TypePage3, TypePage4, TypePage5, TypePage6, TypePage7 } from '../components/interactive/ScaleTypes/ScaleTypesPages';
import TriadsPage1 from '../components/interactive/Triads/TriadsPage1';
import TriadsPage2 from '../components/interactive/Triads/TriadsPage2';
import TriadsPage3 from '../components/interactive/Triads/TriadsPage3';
import SeventhChordsPage1 from '../components/interactive/SeventhChords/SeventhChordsPage1';
import SeventhChordsPage2 from '../components/interactive/SeventhChords/SeventhChordsPage2';
import ChordSymbolsPage1 from '../components/interactive/ChordSymbols/ChordSymbolsPage1';
import ChordSymbolsPage2 from '../components/interactive/ChordSymbols/ChordSymbolsPage2';
import ChordSymbolsPage3 from '../components/interactive/ChordSymbols/ChordSymbolsPage3';
import TonnetzPage1 from '../components/interactive/Tonnetz/TonnetzPage1';
import TonnetzPage2 from '../components/interactive/Tonnetz/TonnetzPage2';
import TonnetzPage3 from '../components/interactive/Tonnetz/TonnetzPage3';
import TonnetzPage4 from '../components/interactive/Tonnetz/TonnetzPage4';
import CircleOfFifthsPage1 from '../components/interactive/Tools/CircleOfFifthsPage1';
import ChromaticCirclePage1 from '../components/interactive/Tools/ChromaticCirclePage1';
import CircleOfFifthsInteractive from '../components/interactive/Tools/CircleOfFifthsInteractive';
import ChromaticCircleInteractive from '../components/interactive/Tools/ChromaticCircleInteractive';
import CircleComparisonPage from '../components/interactive/Tools/CircleComparisonPage';

const ChapterContentPage = () => {
  const { topicId, chapterId } = useParams();
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const currentUsername = localStorage.getItem('user'); 

  const { topic, chapter } = useMemo(() => {
    const t = knowledgeTopics.find(t => t.id === topicId);
    const c = t?.chapters.find(c => c.id === chapterId);
    return { topic: t, chapter: c };
  }, [topicId, chapterId]);

  if (!topic || !chapter) {
    return <div className="content-not-found">內容不存在</div>;
  }

  const totalPages = chapter.pages.length;

  useEffect(() => {
    if (!chapterId) return;

    const fetchAndAddView = async () => {
      try {
        const res = await axios.post(`http://localhost:5000/api/chapters/${chapterId}/view`, {
          username: currentUsername
        });
        
        setViews(res.data.views);
        setLikes(res.data.likes);
        
        if (currentUsername) {
          setHasLiked(res.data.likedBy.includes(currentUsername));
        }
      } catch (err) {
        console.error("無法更新章節資料", err);
      }
    };

    fetchAndAddView();
  }, [chapterId, currentUsername]);

  const handleLike = async (e: React.MouseEvent) => {
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
      setLikes(res.data.likes);
      setHasLiked(res.data.hasLiked);
    } catch (err) {
      console.error("按讚失敗", err);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const renderPageContent = () => {
    // 判斷主題
    switch (chapterId) {
      case 'pitch-name':
        switch (currentPageIndex) {
          case 0: return <PitchNamePage1 />;
          case 1: return <PitchNamePage2 />;
          case 2: return <PitchNamePage3 />;
          case 3: return <PitchNamePage4 />;
          default: return <div>頁面不存在</div>;
        }
      
      case 'solfege':
        switch (currentPageIndex) {
          case 0: return <SolfegePage1 />;
          case 1: return <SolfegePage2 />;
          case 2: return <SolfegePage3 />;
          default: return <div>頁面不存在</div>;
        }

      case 'accidentals':
        switch (currentPageIndex) {
          case 0: return <AccidentalsPage1 />;
          case 1: return <AccidentalsPage2 />;
          case 2: return <AccidentalsPage3 />;
          default: return <div>頁面不存在</div>;
        }

      case 'sound-formation':
        switch (currentPageIndex) {
          case 0: return <SoundFormationPage1 />;
          case 1: return <SoundFormationPage2 />; 
          case 2: return <SoundFormationPage3 />; 
          case 3: return <SoundFormationPage4 />;
          default: return <div>頁面不存在</div>;
        }
      
      case 'equalTemperament':
        switch (currentPageIndex) {
          case 0: return <EqualTemperamentPage1 />;
          case 1: return <EqualTemperamentPage2 />; 
          case 2: return <EqualTemperamentPage3 />; 
          case 3: return <EqualTemperamentPage4 />;
          default: return <div>頁面不存在</div>;
      }

      case 'pitch-class-set':
        switch (currentPageIndex) {
          case 0: return <PitchClassSetPage1 />;
          case 1: return <PitchClassSetPage2 />; 
          case 2: return <PitchClassSetPage3 />; 
          case 3: return <PitchClassSetPage4 />;
          default: return <div>頁面不存在</div>;
      }

      case 'interval-definition':
        switch (currentPageIndex) {
          case 0: return <IntervalPage1 />;
          case 1: return <IntervalPage2 />;
          case 2: return <IntervalPage3 />;
          case 3: return <IntervalPage4 />;
          default: return <div>頁面不存在</div>;
      }

      case 'interval-quality':
        switch (currentPageIndex) {
          case 0: return <QualityPage1 />;
          case 1: return <QualityPage2 />;
          case 2: return <QualityPage3 />;
          default: return <div>頁面不存在</div>;
      }

      case 'scale-definition':
        switch (currentPageIndex) {
          case 0: return <ScalePage1 />;
          case 1: return <ScalePage2 />;
          case 2: return <ScalePage3 />;
          default: return <div>頁面不存在</div>;
      }

      case 'scale-types':
      switch (currentPageIndex) {
        case 0: return <TypePage1 />;
        case 1: return <TypePage2 />;
        case 2: return <TypePage3 />;
        case 3: return <TypePage4 />;
        case 4: return <TypePage5 />;
        case 5: return <TypePage6 />;
        case 6: return <TypePage7 />; 
        default: return <div>頁面不存在</div>;
      }

      case 'triads':
        switch (currentPageIndex) {
          case 0: return <TriadsPage1 />;
          case 1: return <TriadsPage2 />;
          case 2: return <TriadsPage3 />;
          default: return <div>頁面不存在</div>;
      }

      case 'seventh-chords':
      switch (currentPageIndex) {
        case 0: return <SeventhChordsPage1 />;
        case 1: return <SeventhChordsPage2 />;
        default: return <div>頁面不存在</div>;
      }

      case 'chord-symbols':
        switch (currentPageIndex) {
          case 0: return <ChordSymbolsPage1 />;
          case 1: return <ChordSymbolsPage2 />;
          case 2: return <ChordSymbolsPage3 />;
          default: return <div>頁面不存在</div>;
      }

      case 'tonnetz':
        switch (currentPageIndex) {
          case 0: return <TonnetzPage1 />;
          case 1: return <TonnetzPage2 />;
          case 2: return <TonnetzPage3 />;
          case 3: return <TonnetzPage4 />;
          default: return <div>頁面不存在</div>;
      }

      case 'circle-of-fifths':
        switch (currentPageIndex) {
          case 0: return <CircleOfFifthsPage1 />;
          case 1: return <CircleComparisonPage focus="fifths" />;
          case 2: return <CircleOfFifthsInteractive />;
          default: return <div>頁面不存在</div>;
      }

      case 'chromatic-circle':
        switch (currentPageIndex) {
          case 0: return <ChromaticCirclePage1 />;
          case 1: return <CircleComparisonPage focus="chromatic" />;
          case 2: return <ChromaticCircleInteractive />;
          default: return <div>頁面不存在</div>;
      }

      default:
        return (
          <div>
            <h2>{chapter?.title}</h2>
            <p>此章節的互動內容正在開發中...</p>
          </div>
        );
    }
  };

  if (!topic || !chapter) {
    return <div className="content-not-found">內容不存在</div>;
  }

  return (
    <div className="chapter-content-container">

      <div className="chapter-header">
        <h1 className="chapter-main-title">{chapter.title}</h1>

        <div className="chapter-stats" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', color: '#666' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IoEyeOutline size={20} /> {views} 觀看
          </span>
          <button 
            onClick={handleLike} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'none', border: 'none', cursor: 'pointer',
              color: hasLiked ? '#ef4444' : '#666', fontSize: '1rem',
              zIndex: 10 
            }}
          >
            {hasLiked ? <IoHeart size={20} /> : <IoHeartOutline size={20} />} {likes} 個讚
          </button>
        </div>
      </div>

      <div className="breadcrumbs-container">
        <p className="breadcrumbs-content">
          <Link to="/knowledge">樂理知識</Link> &gt; 
          <Link to={`/knowledge/${topic.id}`}> {topic.title}</Link> &gt; {chapter.title}
        </p>
      </div>

      <div className="content-area">
        <div className="content-card">
          
          <div className="progress-indicator">
          {chapter.pages.map((_, index) => (
            <React.Fragment key={index}>
              <div 
                className={`progress-dot ${index === currentPageIndex ? 'active' : ''}`}
                onClick={() => setCurrentPageIndex(index)} 
                style={{ cursor: 'pointer' }}
              ></div>
              
              {index < totalPages - 1 && <div className="progress-line"></div>}
            </React.Fragment>
          ))}
        </div>

          {/* 2. 互動內容區域 */}
          <div className="interactive-content">
            {renderPageContent()}
          </div>

          {/* 3. 卡片底部的導覽 */}
          <div className="card-navigation">
            <button 
              className="card-nav-button" 
              onClick={goToPrevPage}
              disabled={currentPageIndex === 0}
            >
              <IoCaretBack /> back
            </button>
            <button 
              className="card-nav-button" 
              onClick={goToNextPage}
              disabled={currentPageIndex === totalPages - 1}
            >
              Next <IoCaretForward />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterContentPage;
