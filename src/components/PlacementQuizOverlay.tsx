import { useState } from 'react';
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
          <div className="placement-intro">
            <img src={mainLogoImage} alt="OnomaRise" className="placement-intro__logo" />
            <h1 className="placement-intro__title">回答幾個小問題 讓我們更了解你</h1>
            <p className="placement-intro__desc">1分鐘，我們會根據回答推薦適合你的內容</p>
            <button className="placement-btn placement-btn--primary" onClick={() => setStep(0)}>
              開始回答問題
            </button>
            <button className="placement-skip" onClick={onSkip}>跳過</button>
          </div>
        ) : (
          <div className="placement-question">
            <img src={mainLogoImage} alt="OnomaRise" className="placement-question__logo" />
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
          </div>
        )}
      </div>
    </div>
  );
}
