import React, { useState } from 'react';
import { Video, CheckSquare, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import './MeetingsView.css';

interface ActionItem {
  title: string;
  assignee?: string;
  estimatedMinutes?: number;
}

interface MeetingsViewProps {
  authToken: string;
  apiBaseUrl: string;
  onRefreshTelemetry: () => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  authToken,
  apiBaseUrl,
  onRefreshTelemetry
}) => {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Results State
  const [summary, setSummary] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [isAddingTasks, setIsAddingTasks] = useState(false);
  const [tasksAddedCount, setTasksAddedCount] = useState(0);

  // Drag & Drop mock audio upload
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const handleProcessTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim() || isProcessing) return;

    setIsProcessing(true);
    setHasProcessed(false);
    setActionItems([]);
    setDecisions([]);
    setSummary('');
    setTasksAddedCount(0);

    try {
      const res = await fetch(`${apiBaseUrl}/meetings/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transcript: transcript.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || 'Summary could not be determined.');
        setActionItems(data.actionItems || []);
        setDecisions(data.decisions || []);
        setHasProcessed(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
        setAudioFile(file);
        // Pre-populate transcript with a mock for the audio file
        setTranscript(`[Audio File Transcribed: ${file.name}]\n\nSarah: We need to finalize the API schemas for Phase 2 by tomorrow. Let's make sure the Firestore and mock repositories are fully covered.\nAlex: I can take care of the Firestore setup. It will take me about 60 minutes.\nSarah: Great, and I'll review and test the JWT auth flows which should take around 45 minutes.\nAlex: Sounds good. We also decided to use standard OAuth2 headers for the local API. Let's make sure that's implemented.`);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setAudioFile(file);
      setTranscript(`[Audio File Transcribed: ${file.name}]\n\nSarah: We need to finalize the API schemas for Phase 2 by tomorrow. Let's make sure the Firestore and mock repositories are fully covered.\nAlex: I can take care of the Firestore setup. It will take me about 60 minutes.\nSarah: Great, and I'll review and test the JWT auth flows which should take around 45 minutes.\nAlex: Sounds good. We also decided to use standard OAuth2 headers for the local API. Let's make sure that's implemented.`);
    }
  };

  // Bulk convert action items to actual tasks
  const handleConvertActionItems = async () => {
    if (actionItems.length === 0 || isAddingTasks) return;
    setIsAddingTasks(true);

    try {
      let added = 0;
      for (const item of actionItems) {
        const res = await fetch(`${apiBaseUrl}/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: item.title,
            description: `Extracted from meeting action items. Assignee: ${item.assignee || 'Unassigned'}`,
            priority: 'high',
            estimatedMinutes: item.estimatedMinutes || 30,
            category: 'Meeting Outcomes',
            tags: ['meeting-action']
          })
        });
        if (res.ok) {
          added++;
        }
      }
      setTasksAddedCount(added);
      onRefreshTelemetry();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingTasks(false);
    }
  };

  return (
    <div className="meetings-view">
      <div className="meetings-split-layout">
        {/* Input Column */}
        <div className="meetings-input-panel glass-card">
          <h3 className="section-title">Meeting Scribe</h3>
          
          <div
            className={`audio-dropzone ${isDragging ? 'dragging' : ''} ${audioFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Video className="dropzone-icon" size={32} />
            {audioFile ? (
              <div className="file-info">
                <span className="file-name">{audioFile.name}</span>
                <span className="file-size">({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                <button className="remove-file-btn" onClick={() => { setAudioFile(null); setTranscript(''); }}>Remove</button>
              </div>
            ) : (
              <div className="dropzone-text">
                <p>Drag and drop meeting audio (MP3, WAV) here</p>
                <span>or</span>
                <label className="file-select-label">
                  Browse Files
                  <input type="file" accept="audio/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>

          <form onSubmit={handleProcessTranscript} className="transcript-form">
            <div className="field-group">
              <label>Transcript or Notes</label>
              <textarea
                placeholder="Paste meeting transcript lines or summary notes here..."
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                required
                className="form-input transcript-textarea"
              />
            </div>

            <button type="submit" className="btn-primary process-btn" disabled={isProcessing || !transcript.trim()}>
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Scribing Outcomes...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Extract Decisions & Action Items</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="meetings-results-panel glass-card">
          <h3 className="section-title">AI Summary & Action Items</h3>

          {!hasProcessed && !isProcessing && (
            <div className="results-placeholder">
              <AlertCircle size={24} className="info-icon" />
              <p>Submit a transcript or upload an audio recording to extract structure and actions items automatically.</p>
            </div>
          )}

          {isProcessing && (
            <div className="results-loading">
              <RefreshCw size={36} className="spin loading-spinner" />
              <p>Analyzing conversation text...</p>
              <span>Identifying decision points and allocating task minutes.</span>
            </div>
          )}

          {hasProcessed && (
            <div className="scribe-results-content">
              {/* Summary */}
              <div className="result-section">
                <span className="result-section-lbl">Brief Summary</span>
                <div className="summary-bubble glass-card">{summary}</div>
              </div>

              {/* Decisions */}
              <div className="result-section">
                <span className="result-section-lbl">Decisions Made</span>
                <ul className="decisions-list">
                  {decisions.map((dec, idx) => (
                    <li key={idx} className="decision-item">{dec}</li>
                  ))}
                  {decisions.length === 0 && <li className="empty-lbl">No explicit decisions resolved.</li>}
                </ul>
              </div>

              {/* Action Items */}
              <div className="result-section">
                <div className="action-items-header">
                  <span className="result-section-lbl">Action Items</span>
                  {actionItems.length > 0 && tasksAddedCount === 0 && (
                    <button
                      className="btn-primary convert-btn"
                      onClick={handleConvertActionItems}
                      disabled={isAddingTasks}
                    >
                      <CheckSquare size={12} />
                      <span>{isAddingTasks ? 'Creating...' : 'Sync Tasks'}</span>
                    </button>
                  )}
                </div>

                {tasksAddedCount > 0 && (
                  <div className="success-banner">
                    Successfully synced {tasksAddedCount} action items to your workspace Task Backlog!
                  </div>
                )}

                <div className="action-items-list">
                  {actionItems.map((item, idx) => (
                    <div key={idx} className="action-item-card glass-card">
                      <div className="action-title">{item.title}</div>
                      <div className="action-meta">
                        {item.assignee && <span className="assignee-badge">Assignee: {item.assignee}</span>}
                        {item.estimatedMinutes && <span className="est-badge">{item.estimatedMinutes} mins</span>}
                      </div>
                    </div>
                  ))}
                  {actionItems.length === 0 && <div className="empty-lbl">No action items identified.</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
