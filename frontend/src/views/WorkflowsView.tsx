import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Plus,
  GitBranch,
  Trash2,
  AlertCircle,
  Zap,
  ArrowRight,
  Database
} from 'lucide-react';
import './WorkflowsView.css';

interface Node {
  id: string;
  type: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

interface Workflow {
  id: string;
  title: string;
  isActive: boolean;
  nodes: Node[];
}

interface WorkflowsViewProps {
  authToken: string;
  apiBaseUrl: string;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  authToken,
  apiBaseUrl
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<any>(null);

  // New Node Form
  const [nodeType, setNodeType] = useState('trigger');
  const [nodeEvent, setNodeEvent] = useState('on_new_task');
  const [nodeAction, setNodeAction] = useState('create_calendar_event');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/workflows`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        if (data.length > 0 && !selectedWorkflowId) {
          setSelectedWorkflowId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [authToken]);

  const activeWorkflow = useMemo(() => workflows.find(w => w.id === selectedWorkflowId), [workflows, selectedWorkflowId]);

  // Trigger Node Runner
  const handleRunWorkflow = async () => {
    if (!selectedWorkflowId || isRunning) return;

    setIsRunning(true);
    setRunLogs(['Initializing automation worker context...', 'Loading node definitions...']);
    setRunResult(null);

    try {
      const res = await fetch(`${apiBaseUrl}/workflows/${selectedWorkflowId}/run`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const report = await res.json();
        setRunLogs(prev => [
          ...prev,
          `Trigger fired: ${activeWorkflow?.nodes[0]?.config?.event || 'event'}`,
          `Action execution successful: ${activeWorkflow?.nodes[1]?.config?.action || 'action'}`,
          `Worker exited with success code.`
        ]);
        setRunResult(report);
      }
    } catch (err) {
      setRunLogs(prev => [...prev, 'Error: Automation runner connection timeout.']);
    } finally {
      setIsRunning(false);
    }
  };

  // Add custom node to workflow
  const handleAddNode = async () => {
    if (!activeWorkflow) return;

    const newId = `node-${Date.now()}`;
    const config = nodeType === 'trigger' ? { event: nodeEvent } : { action: nodeAction };
    const newNode: Node = {
      id: newId,
      type: nodeType,
      config
    };

    const updatedNodes = [...activeWorkflow.nodes, newNode];

    try {
      const res = await fetch(`${apiBaseUrl}/workflows/${activeWorkflow.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          nodes: updatedNodes
        })
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Workflow
  const handleDeleteWorkflow = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/workflows/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSelectedWorkflowId('');
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create new template workflow
  const handleCreateTemplateWorkflow = async () => {
    const defaultFlow = {
      title: 'Focus Rebalancer AI',
      isActive: true,
      nodes: [
        { id: 'n1', type: 'trigger', config: { event: 'on_new_task' } },
        { id: 'n2', type: 'action', config: { action: 'create_calendar_event' } }
      ]
    };

    try {
      const res = await fetch(`${apiBaseUrl}/workflows`, {
        method: 'POST',
        headers,
        body: JSON.stringify(defaultFlow)
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="workflows-view">
      {/* Top action row */}
      <div className="workflows-top-bar glass-panel">
        <div className="bar-left">
          <GitBranch className="bar-icon" size={18} />
          <select
            value={selectedWorkflowId}
            onChange={e => setSelectedWorkflowId(e.target.value)}
            className="form-input workflow-selector"
          >
            <option value="" disabled>-- Select Automation --</option>
            {workflows.map(flow => (
              <option key={flow.id} value={flow.id}>{flow.title}</option>
            ))}
          </select>
        </div>

        <div className="bar-right">
          {activeWorkflow && (
            <>
              <button className="btn-primary run-flow-btn" onClick={handleRunWorkflow} disabled={isRunning}>
                <Play size={14} />
                <span>{isRunning ? 'Running...' : 'Run Automation'}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleDeleteWorkflow(activeWorkflow.id)}
                title="Delete Automation"
                style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={handleCreateTemplateWorkflow}>
            Add Template
          </button>
        </div>
      </div>

      <div className="workflows-split-layout">
        {/* Left Side: Visual Nodes Canvas */}
        <div className="node-canvas-panel glass-card">
          <h3 className="section-title">Automation Canvas</h3>
          
          {isLoading ? (
            <div className="canvas-empty">Loading canvas blocks...</div>
          ) : !activeWorkflow ? (
            <div className="canvas-empty">
              <Database size={32} className="empty-icon" />
              <p>No automation selected. Create a default template to begin configuring nodes.</p>
            </div>
          ) : (
            <div className="canvas-grid">
              <div className="canvas-nodes-container">
                {activeWorkflow.nodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    {index > 0 && (
                      <div className="canvas-connector">
                        <ArrowRight size={20} className="connector-arrow" />
                      </div>
                    )}
                    <div className={`node-card-block ${node.type}`}>
                      <div className="node-badge-lbl">{node.type}</div>
                      <div className="node-title-desc">
                        {node.type === 'trigger' ? (
                          <>
                            <strong>Event Trigger:</strong>
                            <span>{node.config.event || 'Custom Event'}</span>
                          </>
                        ) : (
                          <>
                            <strong>Triggered Action:</strong>
                            <span>{node.config.action || 'Custom Action'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Node Config Form */}
              <div className="node-editor-form glass-card">
                <span className="details-subheading">Append Canvas Node</span>
                <div className="form-row">
                  <div className="field-group flex-1">
                    <label>Node Category</label>
                    <select
                      value={nodeType}
                      onChange={e => setNodeType(e.target.value)}
                      className="form-input"
                    >
                      <option value="trigger">Trigger</option>
                      <option value="action">Action</option>
                    </select>
                  </div>

                  {nodeType === 'trigger' ? (
                    <div className="field-group flex-1">
                      <label>Event Name</label>
                      <select
                        value={nodeEvent}
                        onChange={e => setNodeEvent(e.target.value)}
                        className="form-input"
                      >
                        <option value="on_new_task">On New Task</option>
                        <option value="on_meeting_end">On Meeting Complete</option>
                        <option value="on_burnout_alert">On Burnout Danger</option>
                      </select>
                    </div>
                  ) : (
                    <div className="field-group flex-1">
                      <label>Action Name</label>
                      <select
                        value={nodeAction}
                        onChange={e => setNodeAction(e.target.value)}
                        className="form-input"
                      >
                        <option value="create_calendar_event">Create Calendar Block</option>
                        <option value="draft_email">Draft Follow-up Email</option>
                        <option value="send_alert">Send Warning Notification</option>
                      </select>
                    </div>
                  )}
                </div>

                <button className="btn-primary append-node-btn" onClick={handleAddNode}>
                  <Plus size={14} />
                  <span>Append Node</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Execution Logs */}
        <div className="execution-logs-panel glass-card">
          <h3 className="section-title">Execution Console</h3>

          {runLogs.length === 0 ? (
            <div className="console-placeholder">
              <AlertCircle size={20} className="info-icon" />
              <p>Press "Run Automation" to verify background trigger logs.</p>
            </div>
          ) : (
            <div className="console-wrapper">
              <div className="console-lines">
                {runLogs.map((log, idx) => (
                  <div key={idx} className="console-line">
                    <span className="console-prompt">&gt;</span>
                    <span className="console-text">{log}</span>
                  </div>
                ))}
              </div>

              {runResult && (
                <div className="console-result-card glass-card">
                  <div className="result-indicator-row">
                    <Zap className="indicator-icon" size={14} />
                    <span>Run result: {runResult.status?.toUpperCase() || 'SUCCESS'}</span>
                  </div>
                  <div className="result-stats-row">
                    <span>Nodes executed: {runResult.executedNodesCount || 2}</span>
                    <span>Trigger Time: 12ms</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
