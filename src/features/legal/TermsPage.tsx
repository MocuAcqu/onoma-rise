import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CONTACT_EMAIL,
  LAST_UPDATED,
  legalDocuments,
  type LegalDocument,
} from './legalContent';
import './TermsPage.css';

// 把文字中的聯絡信箱轉成可點擊的 mailto 連結
const withEmailLink = (text: string): ReactNode => {
  const parts = text.split(CONTACT_EMAIL);
  if (parts.length === 1) return text;
  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a key={index} href={`mailto:${CONTACT_EMAIL}`} className="legal-email">
            {CONTACT_EMAIL}
          </a>,
          part,
        ],
  );
};

const TermsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('tab') === 'privacy' ? 'privacy' : 'terms';
  const activeDocument: LegalDocument =
    legalDocuments.find((doc) => doc.id === activeId) ?? legalDocuments[0];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeId]);

  const switchTab = (id: LegalDocument['id']) => {
    setSearchParams(id === 'terms' ? {} : { tab: id }, { replace: true });
  };

  return (
    <div className="legal-page">
      <header className="legal-header">
        <h1 className="legal-title">條款與隱私</h1>
        <p className="legal-subtitle">terms &amp; privacy</p>
      </header>

      <div className="legal-tabs" role="tablist" aria-label="條款類別">
        {legalDocuments.map((doc) => (
          <button
            key={doc.id}
            type="button"
            role="tab"
            id={`legal-tab-${doc.id}`}
            aria-selected={doc.id === activeId}
            aria-controls="legal-panel"
            className={`legal-tab${doc.id === activeId ? ' is-active' : ''}`}
            onClick={() => switchTab(doc.id)}
          >
            {doc.label}
          </button>
        ))}
      </div>

      <section
        id="legal-panel"
        role="tabpanel"
        aria-labelledby={`legal-tab-${activeId}`}
        className="legal-panel"
      >
        <p className="legal-updated">最後更新日期：{LAST_UPDATED}</p>
        <p className="legal-intro">{activeDocument.intro}</p>

        <h2 className="legal-heading">重點摘要</h2>
        <div className="legal-summary-grid">
          {activeDocument.summaries.map((summary) => (
            <div className="legal-summary-card" key={summary.title}>
              <h3>{summary.title}</h3>
              <p>{withEmailLink(summary.text)}</p>
            </div>
          ))}
        </div>

        <h2 className="legal-heading">完整{activeDocument.label}</h2>
        <ol className="legal-sections">
          {activeDocument.sections.map((section) => (
            <li className="legal-section" id={section.id} key={section.id}>
              <h3 className="legal-section-title">{section.title}</h3>
              {section.lead && <p>{withEmailLink(section.lead)}</p>}
              {section.items && (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{withEmailLink(item)}</li>
                  ))}
                </ul>
              )}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{withEmailLink(paragraph)}</p>
              ))}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default TermsPage;
