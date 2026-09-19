import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  placementQuestions,
  DONT_KNOW_OPTION_ID,
  buildPlacementResult,
  type PlacementAnswer,
  type PlacementResult,
} from '../data/placementQuiz';
import './PlacementQuizOverlay.css';
import mainLogoImage from '../assets/images/main-logo.png';

type Props = {
  onSkip: () => void;
  onComplete: (result: PlacementResult) => void;
};

// logo 用 absolute 定位釘住，不佔用置中用的 flex 排版空間（這樣下面的內容
// 才能用整個畫面高度置中，不會被 logo 往下擠）。但 logo 本身要看起來也不會
// 貼在最上面，而是落在「畫面最上緣」跟「內容區塊上緣」之間的正中央，
// 所以這裡量測內容區塊實際的 offsetTop，動態算出 logo 該放的位置。
function useLogoTop(
  containerClassName: string,
  bodyRef: React.RefObject<HTMLDivElement | null>,
  logoRef: React.RefObject<HTMLImageElement | null>,
  deps: React.DependencyList,
) {
  const [logoTop, setLogoTop] = useState(0);

  useLayoutEffect(() => {
    const recompute = () => {
      if (!bodyRef.current || !logoRef.current) return;
      const bodyTop = bodyRef.current.offsetTop;
      const logoHeight = logoRef.current.offsetHeight;
      // 不要把結果夾到 >= 0：當 logo 比上方可用空間還高時，置中本來就需要
      // logo 頂端略為超出畫面（overlay 本身還有 padding 當緩衝），這樣至少
      // 比強制貼齊最上緣（結果反而更不置中）來得好。
      setLogoTop(bodyTop / 2 - logoHeight / 2);
    };

    recompute();
    // 圖片如果在 recompute() 當下還沒載入完成，offsetHeight 量到的高度會不準；
    // 監聽 load 事件之外，也用 rAF 補跑一次，涵蓋圖片其實已經 complete
    // （這種情況下 load 事件不會再觸發）的狀況。
    const raf = requestAnimationFrame(recompute);
    logoRef.current?.addEventListener('load', recompute);
    window.addEventListener('resize', recompute);
    return () => {
      cancelAnimationFrame(raf);
      logoRef.current?.removeEventListener('load', recompute);
      window.removeEventListener('resize', recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerClassName, ...deps]);

  return logoTop;
}

type CenteredStepProps = {
  className: string;
  children: ReactNode;
  deps: React.DependencyList;
};

// 前測畫面共用的排版：logo 置中在「畫面上緣」與「內容區塊」之間，
// 內容區塊則在整個畫面的正中央——intro 畫面跟題目畫面都用同一套排版。
function CenteredStep({ className, children, deps }: CenteredStepProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const logoTop = useLogoTop(className, bodyRef, logoRef, deps);

  return (
    <div className={className}>
      <img
        ref={logoRef}
        src={mainLogoImage}
        alt="OnomaRise"
        className={`${className}__logo`}
        style={{ top: logoTop }}
      />
      <div ref={bodyRef} className={`${className}__body`}>
        {children}
      </div>
    </div>
  );
}

export default function PlacementQuizOverlay({ onSkip, onComplete }: Props) {
  const [step, setStep] = useState<'intro' | number>('intro');
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);

  const totalQuestions = placementQuestions.length;

  const handleAnswer = (optionId: string) => {
    const questionIndex = step as number;
    const question = placementQuestions[questionIndex];

    const nextAnswers = [
      ...answers,
      {
        questionId: question.id,
        topicId: question.topicId,
        optionId,
        isCorrect: optionId === question.correctOptionId,
      },
    ];
    setAnswers(nextAnswers);

    if (questionIndex + 1 < totalQuestions) {
      setStep(questionIndex + 1);
    } else {
      onComplete(buildPlacementResult(nextAnswers));
    }
  };

  return (
    <div className="placement-overlay">
      <div className="placement-overlay__panel">
        {step === 'intro' ? (
          <CenteredStep key="intro" className="placement-intro" deps={[]}>
            <h1 className="placement-intro__title">回答幾個小問題 讓我們更了解你</h1>
            <p className="placement-intro__desc">1分鐘，我們會根據回答推薦適合你的內容</p>
            <button className="placement-btn placement-btn--primary" onClick={() => setStep(0)}>
              開始回答問題
            </button>
            <button className="placement-skip" onClick={onSkip}>跳過</button>
          </CenteredStep>
        ) : (
          <CenteredStep key="question" className="placement-question" deps={[step]}>
            <p className="placement-question__progress">{step + 1}/{totalQuestions}</p>
            <p className="placement-question__category">{placementQuestions[step].category}</p>
            <h2 className="placement-question__text">{placementQuestions[step].question}</h2>

            <div className="placement-options">
              {placementQuestions[step].options.map((option, optionIndex) => (
                <button
                  key={option.id}
                  className={`placement-btn placement-btn--option placement-btn--option-${optionIndex}`}
                  onClick={() => handleAnswer(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button className="placement-skip" onClick={() => handleAnswer(DONT_KNOW_OPTION_ID)}>
              不知道
            </button>
          </CenteredStep>
        )}
      </div>
    </div>
  );
}
