import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mail,
  Compass,
  Send,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Calendar
} from 'lucide-react';
import './CopilotPanel.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Recommendation {
  title: string;
  description: string;
  actionType: string;
  actionPayload: any;
}

interface CopilotPanelProps {
  authToken: string;
  apiBaseUrl: string;
  onApplyScheduleBlock: (payload: any) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  authToken,
  apiBaseUrl,
  onApplyScheduleBlock
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'email' | 'recs'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your AI Copilot. How can I help optimize your workspace today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Email State
  const [emailPrompt, setEmailPrompt] = useState('');
  const [emailCategory, setEmailCategory] = useState('reply');
  const [emailTone, setEmailTone] = useState('professional');
  const [emailResult, setEmailResult] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  useEffect(() => {
    if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch Recommendations
  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await fetch(`${apiBaseUrl}/copilot/recommendations`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error("Failed fetching recommendations", err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recs') {
      fetchRecommendations();
    }
  }, [activeTab]);

  // Stream Chat Handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isStreaming) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsStreaming(true);

    try {
      const response = await fetch(`${apiBaseUrl}/copilot/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        throw new Error("Chat stream request failed");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream reader");

      let assistantResponse = "";
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                assistantResponse += parsed.text;
                // Update the last assistant message
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantResponse
                  };
                  return updated;
                });
              }
            } catch (err) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error drafting my reply.' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Generate Email Handler
  const handleGenerateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPrompt.trim() || isGeneratingEmail) return;

    setIsGeneratingEmail(true);
    setEmailResult(null);
    try {
      const res = await fetch(`${apiBaseUrl}/copilot/email/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          prompt: emailPrompt,
          category: emailCategory,
          tone: emailTone
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEmailResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const copyEmailToClipboard = () => {
    if (!emailResult) return;
    const text = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <aside className="copilot-panel glass-panel" data-testid="copilot-panel">
      <div className="copilot-header">
        <Zap className="copilot-header-icon" size={16} />
        <span className="copilot-header-title glowing-text">Productivity Copilot</span>
      </div>

      {/* Tabs */}
      <div className="copilot-tabs">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail size={16} />
          <span>Email Draft</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'recs' ? 'active' : ''}`}
          onClick={() => setActiveTab('recs')}
        >
          <Compass size={16} />
          <span>Advice</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="copilot-content">
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="messages-list">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-bubble ${msg.role}`}>
                  <div className="message-content">{msg.content || <span className="typing-cursor"></span>}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendChat}>
              <input
                type="text"
                placeholder="Ask Copilot something..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isStreaming}
              />
              <button type="submit" className="chat-send-btn" disabled={isStreaming || !chatInput.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="email-generator-container">
            <form onSubmit={handleGenerateEmail} className="email-form">
              <label>Draft Description</label>
              <textarea
                placeholder="e.g. Tell HR I need sick leave for dentist visit tomorrow morning"
                value={emailPrompt}
                onChange={e => setEmailPrompt(e.target.value)}
                required
              />

              <div className="form-row">
                <div className="form-col">
                  <label>Category</label>
                  <select value={emailCategory} onChange={e => setEmailCategory(e.target.value)}>
                    <option value="reply">Reply</option>
                    <option value="professional">Professional</option>
                    <option value="leave_application">Leave Request</option>
                    <option value="client_proposal">Client Proposal</option>
                    <option value="follow_up">Follow Up</option>
                  </select>
                </div>

                <div className="form-col">
                  <label>Tone</label>
                  <select value={emailTone} onChange={e => setEmailTone(e.target.value)}>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isGeneratingEmail}>
                {isGeneratingEmail ? 'Writing Draft...' : 'Compose Email'}
              </button>
            </form>

            {emailResult && (
              <div className="email-result-card glass-card">
                <div className="result-header">
                  <span>Draft Output</span>
                  <button className="copy-btn" onClick={copyEmailToClipboard} title="Copy Code">
                    {isCopied ? <Check size={14} className="copied" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="email-subject"><strong>Subject:</strong> {emailResult.subject}</div>
                <div className="email-body">{emailResult.body}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recs' && (
          <div className="recs-container">
            <div className="recs-header">
              <span>Dynamic Schedules Optimization</span>
              <button className="refresh-btn" onClick={fetchRecommendations} disabled={isLoadingRecs}>
                <RefreshCw size={14} className={isLoadingRecs ? 'spin' : ''} />
              </button>
            </div>

            {isLoadingRecs ? (
              <div className="recs-loading">Analyzing workspace metrics...</div>
            ) : recommendations.length === 0 ? (
              <div className="recs-empty">Your calendar schedule is fully optimized for focus. No burnout triggers found.</div>
            ) : (
              <div className="recs-list">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="rec-card glass-card">
                    <div className="rec-icon-wrapper">
                      <Calendar size={18} />
                    </div>
                    <div className="rec-details">
                      <div className="rec-title">{rec.title}</div>
                      <div className="rec-desc">{rec.description}</div>
                      {rec.actionType === 'schedule_block' && (
                        <button
                          className="btn-primary rec-action-btn"
                          onClick={() => onApplyScheduleBlock(rec.actionPayload)}
                        >
                          Schedule Block
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
