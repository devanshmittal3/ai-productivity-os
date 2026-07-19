import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import './TasksView.css';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline?: string;
  estimatedMinutes: number;
  tags: string[];
  category: string;
  subtasks: { id: string; title: string; status: string }[];
}

interface TasksViewProps {
  authToken: string;
  apiBaseUrl: string;
  onRefreshTelemetry: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  authToken,
  apiBaseUrl,
  onRefreshTelemetry
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New manual task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [category, setCategory] = useState('Work');
  const [tagsInput, setTagsInput] = useState('');

  // AI NLP Input state
  const [nlpPrompt, setNlpPrompt] = useState('');
  const [isParsingNlp, setIsParsingNlp] = useState(false);
  const [parsedAiTasks, setParsedAiTasks] = useState<any[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');

  // Expanded task detail subtasks checklist tracker
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [authToken]);

  // Create Manual Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          description,
          priority,
          estimatedMinutes,
          category,
          tags
        })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setTagsInput('');
        fetchTasks();
        onRefreshTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${task.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchTasks();
        onRefreshTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchTasks();
        onRefreshTelemetry();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Subtask Actions
  const handleAddSubtask = async (task: Task) => {
    if (!newSubtaskTitle.trim()) return;
    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      status: 'todo'
    };
    const updatedSubtasks = [...task.subtasks, newSub];

    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${task.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
      if (res.ok) {
        setNewSubtaskTitle('');
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (task: Task, subId: string) => {
    const updatedSubtasks = task.subtasks.map(s => {
      if (s.id === subId) {
        return { ...s, status: s.status === 'completed' ? 'todo' : 'completed' };
      }
      return s;
    });

    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${task.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // NLP AI Parse Handler
  const handleParseNlp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpPrompt.trim() || isParsingNlp) return;

    setIsParsingNlp(true);
    setParsedAiTasks([]);
    setAiReasoning('');
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/parse-nlp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: nlpPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedAiTasks(data.tasks || []);
        setAiReasoning(data.reasoning || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsingNlp(false);
    }
  };

  // Bulk Approve AI parsed tasks
  const handleApproveAiTasks = async () => {
    try {
      for (const t of parsedAiTasks) {
        await fetch(`${apiBaseUrl}/tasks`, {
          method: 'POST',
          headers,
          body: JSON.stringify(t)
        });
      }
      setParsedAiTasks([]);
      setNlpPrompt('');
      fetchTasks();
      onRefreshTelemetry();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="tasks-view">
      {/* NLP Prompt Panel */}
      <div className="nlp-prompt-card glass-panel">
        <div className="nlp-header">
          <Sparkles className="nlp-icon" size={16} />
          <span>AI Task Ingestion</span>
        </div>
        <form onSubmit={handleParseNlp} className="nlp-form">
          <input
            type="text"
            placeholder="e.g. Schedule database mid-term prep for 90 mins next Wednesday. Mark it high priority, tags: dbms, college."
            value={nlpPrompt}
            onChange={e => setNlpPrompt(e.target.value)}
            disabled={isParsingNlp}
            className="form-input nlp-input"
          />
          <button type="submit" className="btn-primary nlp-btn" disabled={isParsingNlp || !nlpPrompt.trim()}>
            {isParsingNlp ? 'Parsing...' : 'Analyze'}
          </button>
        </form>

        {/* AI parsed verify area */}
        {parsedAiTasks.length > 0 && (
          <div className="ai-verification-area glass-card">
            <h4 className="verify-title">AI Extracted Task Proposals</h4>
            {aiReasoning && <p className="ai-reasoning"><strong>AI Reasoning:</strong> {aiReasoning}</p>}
            <div className="proposed-tasks-list">
              {parsedAiTasks.map((pt, idx) => (
                <div key={idx} className="proposed-task-item">
                  <ArrowRight size={14} className="propose-arrow" />
                  <div className="proposed-details">
                    <span className="proposed-task-title">{pt.title} ({pt.estimatedMinutes}m)</span>
                    <span className="proposed-meta">Priority: {pt.priority} | Category: {pt.category}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="verify-actions">
              <button className="btn-secondary" onClick={() => setParsedAiTasks([])}>Discard</button>
              <button className="btn-primary" onClick={handleApproveAiTasks}>Create All Tasks</button>
            </div>
          </div>
        )}
      </div>

      <div className="tasks-layout-split">
        {/* Task List Column */}
        <div className="tasks-list-panel glass-card">
          <h3 className="section-title">Task Backlog</h3>
          
          {isLoading ? (
            <div className="list-loading">Syncing backlog...</div>
          ) : tasks.length === 0 ? (
            <div className="list-empty">No active tasks in your backlog. Create one or prompt AI above!</div>
          ) : (
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task.id} className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                  <div className="task-row">
                    <button className="toggle-status-btn" onClick={() => handleToggleTaskStatus(task)}>
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="checked-icon" size={20} />
                      ) : (
                        <Circle className="unchecked-icon" size={20} />
                      )}
                    </button>
                    
                    <div className="task-info-block" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                      <span className="task-title-text">{task.title}</span>
                      <div className="task-meta-tags">
                        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                        <span className="category-badge">{task.category}</span>
                        {task.estimatedMinutes && (
                          <span className="duration-badge">
                            <Clock size={10} />
                            {task.estimatedMinutes}m
                          </span>
                        )}
                        {task.tags.map((t, i) => (
                          <span key={i} className="tag-badge">#{t}</span>
                        ))}
                      </div>
                    </div>

                    <div className="task-actions">
                      <button className="expand-details-btn" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                        {expandedTaskId === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button className="delete-task-btn" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subtask Checklist Area */}
                  {expandedTaskId === task.id && (
                    <div className="expanded-task-details">
                      {task.description && <p className="task-desc">{task.description}</p>}
                      
                      <div className="subtasks-section">
                        <span className="details-subheading">Checklist</span>
                        <div className="subtasks-list">
                          {task.subtasks?.map(sub => (
                            <div key={sub.id} className="subtask-row">
                              <button className="sub-toggle-btn" onClick={() => handleToggleSubtask(task, sub.id)}>
                                {sub.status === 'completed' ? (
                                  <CheckCircle2 size={16} className="checked-icon" />
                                ) : (
                                  <Circle size={16} className="unchecked-icon" />
                                )}
                              </button>
                              <span className={`subtask-title ${sub.status === 'completed' ? 'done' : ''}`}>{sub.title}</span>
                            </div>
                          ))}
                        </div>

                        <div className="add-subtask-form">
                          <input
                            type="text"
                            placeholder="Add checklist item..."
                            value={newSubtaskTitle}
                            onChange={e => setNewSubtaskTitle(e.target.value)}
                            className="form-input subtask-input"
                          />
                          <button className="add-sub-btn" onClick={() => handleAddSubtask(task)}>
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Creation Column */}
        <div className="task-creator-panel glass-card">
          <h3 className="section-title">New Task</h3>
          <form onSubmit={handleCreateTask} className="creator-form">
            <div className="field-group">
              <label>Task Title</label>
              <input
                type="text"
                placeholder="Database assignment..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="field-group">
              <label>Description</label>
              <textarea
                placeholder="Practice normalization and SQL indexing..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="field-group flex-1">
                <label>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="form-input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="field-group flex-1">
                <label>Minutes</label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                  min={5}
                  max={240}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group flex-1">
                <label>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Work, College"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="field-group flex-1">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="sql, study"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary submit-creator-btn">
              <Plus size={16} />
              <span>Create Task</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
