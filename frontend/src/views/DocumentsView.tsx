import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Award,
  RefreshCw,
  HelpCircle,
  HelpCircle as CardsIcon
} from 'lucide-react';
import './DocumentsView.css';

interface Document {
  id: string;
  title: string;
  wordCount: number;
}

interface Flashcard {
  front: string;
  back: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface DocumentsViewProps {
  authToken: string;
  apiBaseUrl: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  authToken,
  apiBaseUrl
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [rawText, setRawText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  
  // Analytics outcomes
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz' | 'rag'>('summary');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // RAG State
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswers, setRagAnswers] = useState<any[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/documents`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDocId) {
          setSelectedDocId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [authToken]);

  // Upload/Submit Text
  const handleUploadText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || !docTitle.trim() || isUploading) return;

    setIsUploading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/documents/upload-text`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: docTitle.trim(),
          text: rawText.trim()
        })
      });
      if (res.ok) {
        setRawText('');
        setDocTitle('');
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger Analytics (Summary, Flashcards, Quiz)
  const handleAnalyze = async (analysisType: 'summary' | 'flashcards' | 'quiz') => {
    if (!selectedDocId || isAnalyzing) return;

    setIsAnalyzing(true);
    if (analysisType === 'summary') setSummary('');
    if (analysisType === 'flashcards') setFlashcards([]);
    if (analysisType === 'quiz') {
      setQuizQuestions([]);
      setSelectedAnswers({});
      setShowQuizResults(false);
    }

    try {
      const res = await fetch(`${apiBaseUrl}/documents/${selectedDocId}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: analysisType })
      });

      if (res.ok) {
        const data = await res.json();
        if (analysisType === 'summary') {
          setSummary(data.summary || 'Summary could not be compiled.');
          setActiveTab('summary');
        } else if (analysisType === 'flashcards') {
          setFlashcards(data.flashcards || []);
          setCurrentCardIndex(0);
          setIsFlipped(false);
          setActiveTab('flashcards');
        } else if (analysisType === 'quiz') {
          setQuizQuestions(data.quiz || []);
          setActiveTab('quiz');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Execute RAG Context search
  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim() || isSearchingRag) return;

    setIsSearchingRag(true);
    setRagAnswers([]);
    try {
      const res = await fetch(`${apiBaseUrl}/documents/search?query=${encodeURIComponent(ragQuery)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRagAnswers(data.results || []);
        setActiveTab('rag');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingRag(false);
    }
  };

  // Flashcards control
  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(prev => (prev + 1) % flashcards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  // Quiz helper
  const handleAnswerSelect = (qIdx: number, option: string) => {
    if (showQuizResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const calculateQuizScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="documents-view">
      <div className="documents-grid-split">
        
        {/* Left Side: Document Manager / Uploader */}
        <div className="document-manager-panel glass-card">
          <h3 className="section-title">Study Library</h3>

          <div className="doc-selector-block">
            <label>Select Workspace Document</label>
            <select
              value={selectedDocId}
              onChange={e => setSelectedDocId(e.target.value)}
              className="form-input doc-select"
            >
              <option value="" disabled>-- Choose Document --</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.wordCount} words)
                </option>
              ))}
            </select>
          </div>

          {selectedDocId && (
            <div className="analysis-buttons-grid">
              <button
                className="btn-secondary analysis-btn"
                onClick={() => handleAnalyze('summary')}
                disabled={isAnalyzing}
              >
                Summarize
              </button>
              <button
                className="btn-secondary analysis-btn"
                onClick={() => handleAnalyze('flashcards')}
                disabled={isAnalyzing}
              >
                Generate Flashcards
              </button>
              <button
                className="btn-secondary analysis-btn"
                onClick={() => handleAnalyze('quiz')}
                disabled={isAnalyzing}
              >
                Generate Quiz
              </button>
            </div>
          )}

          <div className="divider-line"></div>

          <form onSubmit={handleUploadText} className="uploader-form">
            <span className="details-subheading">Submit Reference Material</span>
            <div className="field-group">
              <input
                type="text"
                placeholder="Topic Title (e.g. DBMS Normalization)"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="field-group">
              <textarea
                placeholder="Paste study material text content here..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                required
                className="form-input doc-textarea"
              />
            </div>
            <button type="submit" className="btn-primary upload-doc-btn" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Save reference'}
            </button>
          </form>
        </div>

        {/* Right Side: Interactive AI Study Tools */}
        <div className="document-tools-panel glass-card">
          <div className="tools-tabs">
            <button
              className={`tool-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`tool-tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveTab('flashcards')}
            >
              Flashcards
            </button>
            <button
              className={`tool-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              Practice Quiz
            </button>
            <button
              className={`tool-tab-btn ${activeTab === 'rag' ? 'active' : ''}`}
              onClick={() => setActiveTab('rag')}
            >
              Ask PDF (RAG)
            </button>
          </div>

          <div className="tool-content-area">
            {isAnalyzing && (
              <div className="analysis-progress-state">
                <RefreshCw size={28} className="spin progress-icon" />
                <p>Generating intelligent study assets...</p>
                <span>Analyzing text semantics and formatting outputs.</span>
              </div>
            )}

            {!isAnalyzing && activeTab === 'summary' && (
              <div className="summary-tab-content">
                {summary ? (
                  <div className="doc-summary-output">{summary}</div>
                ) : (
                  <div className="tool-tab-placeholder">
                    <FileText size={32} className="place-icon" />
                    <p>No summary compiled. Select a document on the left and click "Summarize".</p>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && activeTab === 'flashcards' && (
              <div className="flashcards-tab-content">
                {flashcards.length > 0 ? (
                  <div className="flashcard-playground">
                    <div
                      className={`flashcard-scene ${isFlipped ? 'flipped' : ''}`}
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <div className="flashcard-body">
                        <div className="flashcard-face flashcard-front glass-card">
                          <span className="card-lbl">Question</span>
                          <div className="card-question-text">{flashcards[currentCardIndex].front}</div>
                          <span className="card-hint">Click card to reveal answer</span>
                        </div>
                        <div className="flashcard-face flashcard-back glass-card">
                          <span className="card-lbl">Answer</span>
                          <div className="card-answer-text">{flashcards[currentCardIndex].back}</div>
                          <span className="card-hint">Click card to view front</span>
                        </div>
                      </div>
                    </div>
                    <div className="flashcard-controls">
                      <button className="btn-secondary card-control-btn" onClick={prevCard}>Previous</button>
                      <span className="card-counter">{currentCardIndex + 1} / {flashcards.length}</span>
                      <button className="btn-secondary card-control-btn" onClick={nextCard}>Next</button>
                    </div>
                  </div>
                ) : (
                  <div className="tool-tab-placeholder">
                    <CardsIcon size={32} className="place-icon" />
                    <p>No flashcards generated. Select a document and click "Generate Flashcards".</p>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && activeTab === 'quiz' && (
              <div className="quiz-tab-content">
                {quizQuestions.length > 0 ? (
                  <div className="quiz-container">
                    <div className="questions-list">
                      {quizQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="quiz-question-card glass-card">
                          <div className="question-title">
                            <HelpCircle size={16} className="q-icon" />
                            <span>{qIdx + 1}. {q.question}</span>
                          </div>
                          <div className="options-grid">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[qIdx] === opt;
                              const isCorrect = opt === q.correctAnswer;
                              let optionClass = '';
                              if (showQuizResults) {
                                if (isCorrect) optionClass = 'correct';
                                else if (isSelected) optionClass = 'incorrect';
                              } else if (isSelected) {
                                optionClass = 'selected';
                              }
                              return (
                                <button
                                  key={optIdx}
                                  className={`option-btn ${optionClass}`}
                                  onClick={() => handleAnswerSelect(qIdx, opt)}
                                  disabled={showQuizResults}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {showQuizResults && (
                            <div className="question-explanation">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {!showQuizResults ? (
                      <button
                        className="btn-primary submit-quiz-btn"
                        onClick={() => setShowQuizResults(true)}
                        disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                      >
                        Submit Quiz Answers
                      </button>
                    ) : (
                      <div className="quiz-score-badge glass-card">
                        <Award className="award-icon" />
                        <div className="score-details">
                          <span className="score-num">{calculateQuizScore()} / {quizQuestions.length}</span>
                          <span className="score-lbl">Correct Answers</span>
                        </div>
                        <button
                          className="btn-secondary reset-quiz-btn"
                          onClick={() => {
                            setSelectedAnswers({});
                            setShowQuizResults(false);
                          }}
                        >
                          Retry Quiz
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="tool-tab-placeholder">
                    <Award size={32} className="place-icon" />
                    <p>No practice quiz built. Select a document and click "Generate Quiz".</p>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && activeTab === 'rag' && (
              <div className="rag-tab-content">
                <form onSubmit={handleRagSearch} className="rag-search-form">
                  <div className="search-input-group">
                    <Search className="search-icon-rag" size={16} />
                    <input
                      type="text"
                      placeholder="Ask the AI about your reference documents..."
                      value={ragQuery}
                      onChange={e => setRagQuery(e.target.value)}
                      className="form-input rag-query-input"
                    />
                    <button type="submit" className="btn-primary rag-submit-btn" disabled={isSearchingRag}>
                      {isSearchingRag ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </form>

                {isSearchingRag && (
                  <div className="rag-searching-state">Searching across vector database heuristics...</div>
                )}

                <div className="rag-results-list">
                  {ragAnswers.map((ans, idx) => (
                    <div key={idx} className="rag-result-card glass-card">
                      <div className="rag-source-title">{ans.documentTitle}</div>
                      <p className="rag-chunk-text">"...{ans.text}..."</p>
                      <div className="rag-match-score">Match confidence: {(ans.score * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                  {ragAnswers.length === 0 && !isSearchingRag && (
                    <div className="rag-results-empty">Ask a search term to find semantic chunks from saved documents.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
