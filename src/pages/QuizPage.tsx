import axios from 'axios';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { topicQuizzes } from './quizQuestions';
import './QuizPage.css';

export default function QuizPage() {
  const { topicId } = useParams();
  const quiz = topicId ? topicQuizzes[topicId] : undefined;
  const [answers, setAnswers] = useState<number[]>(() => quiz?.questions.map(() => -1) ?? []);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers(quiz?.questions.map(() => -1) ?? []);
    setSubmitted(false);
  }, [topicId, quiz]);

  if (!quiz) return <div className="quiz-not-found">找不到這個測驗。</div>;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (answers.some(answer => answer < 0)) return;
    setSubmitted(true);

    const finalScore = quiz.questions.reduce((total, question, index) => total + Number(answers[index] === question.correctIndex), 0);
    const isPerfect = finalScore === quiz.questions.length;

    const currentUsername = localStorage.getItem('user');
    if (currentUsername) {
      try {
        await axios.post('http://localhost:5000/api/user/progress/quiz', {
          username: currentUsername,
          topicId: topicId,
          passed: isPerfect // 告訴後端這次有沒有全對
        });
      } catch (err) {
        console.error('紀錄測驗進度失敗', err);
      }
    }
  };

  const restartQuiz = () => {
    setAnswers(quiz.questions.map(() => -1));
    setSubmitted(false);
  };

  const score = quiz.questions.reduce((total, question, index) => total + Number(answers[index] === question.correctIndex), 0);

  return (
    <main className="quiz-page">
      <div className="quiz-page__header">
        <p className="quiz-page__eyebrow">測驗題目 · 共 {quiz.questions.length} 題</p>
        <h1>{quiz.title}</h1>
        <p>請完成四題選擇題後送出答案。</p>
      </div>

      <form className="quiz-form" onSubmit={handleSubmit}>
        {quiz.questions.map((question, questionIndex) => {
          const isCorrect = submitted && answers[questionIndex] === question.correctIndex;
          return (
            <section className={`quiz-question ${submitted ? (isCorrect ? 'is-correct' : 'is-incorrect') : ''}`} key={question.id}>
              <div className="quiz-question__title"><span>{questionIndex + 1}</span><h2>{question.question}</h2></div>
              <div className="quiz-options">
                {question.choices.map((choice, choiceIndex) => (
                  <label className={`quiz-option ${answers[questionIndex] === choiceIndex ? 'is-selected' : ''}`} key={choice}>
                    <input type="radio" name={question.id} value={choiceIndex} checked={answers[questionIndex] === choiceIndex} disabled={submitted} onChange={() => setAnswers(current => current.map((answer, index) => index === questionIndex ? choiceIndex : answer))} />
                    <span>{choice}</span>
                  </label>
                ))}
              </div>
              {submitted && <p className={`quiz-result ${isCorrect ? 'is-correct' : 'is-incorrect'}`}>{isCorrect ? '答對' : '答錯'}</p>}
            </section>
          );
        })}

        {submitted ? <div className="quiz-summary"><span>本次答對 {score} / {quiz.questions.length} 題。</span><div className="quiz-summary__actions"><button type="button" onClick={restartQuiz}>重新答題</button><Link to={`/knowledge/${topicId}`}>返回章節列表</Link></div></div> : <button className="quiz-submit" type="submit" disabled={answers.some(answer => answer < 0)}>繳交答案</button>}
      </form>
    </main>
  );
}
