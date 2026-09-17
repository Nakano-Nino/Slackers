'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  FolderKanban,
  MessageSquare,
  MessageSquareShare,
  Send,
  Sparkles,
  Tag,
  Trash2,
  User as UserIcon,
  X,
  Paperclip,
  Download,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  Plus,
  ShieldCheck,
  Check,
  RotateCcw,
  FileEdit,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  Project,
  QAReviewStep,
  QAStepStatus,
  Task,
  TaskAttachment,
  TaskComment,
  TaskPriority,
  TaskStatus,
  User,
  UserRole,
} from '../types';
import { formatUserRole, getUserRoleBadge } from '../lib/roles';
import { encryptFileBlob, decryptFileBlob, formatFileSize } from '../lib/fileCrypto';

function TaskAttachmentCard({
  attachment,
  onDelete,
  canDelete,
}: {
  attachment: TaskAttachment;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');

  useEffect(() => {
    let active = true;
    if (isImage && !blobUrl) {
      setLoading(true);
      api
        .downloadEncryptedFile(attachment.fileId)
        .then(async (buf) => {
          const blob = await decryptFileBlob(
            buf,
            attachment.fileKey,
            attachment.fileIv,
            attachment.mimeType
          );
          if (active) setBlobUrl(URL.createObjectURL(blob));
        })
        .catch(console.error)
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [attachment, isImage, blobUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let url = blobUrl;
      if (!url) {
        const buf = await api.downloadEncryptedFile(attachment.fileId);
        const blob = await decryptFileBlob(
          buf,
          attachment.fileKey,
          attachment.fileIv,
          attachment.mimeType
        );
        url = URL.createObjectURL(blob);
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download file:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        {isImage && blobUrl ? (
          <img
            src={blobUrl}
            alt={attachment.name}
            className="w-9 h-9 rounded object-cover border border-neutral-700 shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-neutral-200 truncate max-w-xs">{attachment.name}</p>
          <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
            <span>{formatFileSize(attachment.size)}</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> E2EE
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-1.5 text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 rounded-lg transition"
          title="Download decrypted file"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
            title="Remove attachment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function getDueDateStatus(dueDateStr?: string): { label: string; className: string; isOverdue: boolean } | null {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Overdue by ${Math.abs(diffDays)}d (${dueDateStr})`,
      className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      isOverdue: true,
    };
  } else if (diffDays === 0) {
    return {
      label: `Due Today (${dueDateStr})`,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      isOverdue: false,
    };
  } else if (diffDays === 1) {
    return {
      label: `Due Tomorrow (${dueDateStr})`,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      isOverdue: false,
    };
  } else if (diffDays <= 3) {
    return {
      label: `Due in ${diffDays}d (${dueDateStr})`,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      isOverdue: false,
    };
  } else {
    return {
      label: `Due in ${diffDays}d (${dueDateStr})`,
      className: 'bg-slate-800/80 text-slate-300 border-slate-700',
      isOverdue: false,
    };
  }
}

interface Props {
  isOpen: boolean;
  task: Task | null;
  currentUser: User | null;
  projects: Project[];
  users: User[];
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskUpdated?: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDiscussInChat: (task: Task) => void;
  onCommentCountChange?: (taskId: string, count: number) => void;
}

const STATUS_LABELS: Record<TaskStatus, { label: string; badge: string }> = {
  backlog: { label: 'Backlog', badge: 'bg-neutral-800 text-neutral-300' },
  todo: { label: 'To Do', badge: 'bg-blue-500/20 text-blue-300' },
  in_progress: { label: 'In Progress', badge: 'bg-amber-500/20 text-amber-300' },
  in_review: { label: 'In Review', badge: 'bg-purple-500/20 text-purple-300' },
  done: { label: 'Done', badge: 'bg-emerald-500/20 text-emerald-300' },
};

const PRIORITY_LABELS: Record<TaskPriority, { label: string; badge: string }> = {
  low: { label: 'Low', badge: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
  medium: { label: 'Medium', badge: 'bg-sky-950/60 text-sky-400 border-sky-800' },
  high: { label: 'High', badge: 'bg-amber-950/60 text-amber-400 border-amber-800' },
  urgent: { label: 'Urgent', badge: 'bg-rose-950/60 text-rose-400 border-rose-800' },
};

export function TaskDetailModal({
  isOpen,
  task,
  currentUser,
  projects,
  users,
  onClose,
  onUpdateStatus,
  onUpdateTask,
  onTaskUpdated,
  onDeleteTask,
  onDiscussInChat,
  onCommentCountChange,
}: Props) {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QA Steps state
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [addingStep, setAddingStep] = useState(false);
  const [editingStepNoteId, setEditingStepNoteId] = useState<string | null>(null);
  const [stepNoteText, setStepNoteText] = useState('');
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const [qaError, setQaError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const activeTask = currentTask || task;

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canInteract = currentUser?.role !== 'viewer';
  const isQAEngineer = currentUser?.developerRole === 'qa_engineer';
  const canTestQA =
    isQAEngineer ||
    canManage ||
    activeTask?.assigneeId === currentUser?.id ||
    activeTask?.creatorId === currentUser?.id;
  const canAddQASteps = isQAEngineer;
  const canDeleteQAStep = isQAEngineer || canManage || activeTask?.creatorId === currentUser?.id;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTask) return;
    setUploadingAttachment(true);
    try {
      const { encryptedBlob, fileKey, fileIv } = await encryptFileBlob(file);
      const uploaded = await api.uploadEncryptedFile(
        encryptedBlob,
        file.name,
        file.type || 'application/octet-stream'
      );
      const newAttachment: TaskAttachment = {
        fileId: uploaded.fileId,
        name: uploaded.originalName,
        size: uploaded.size,
        mimeType: uploaded.mimeType,
        fileKey,
        fileIv,
        uploadedAt: new Date().toISOString(),
        uploadedById: currentUser?.id || 'u-1',
      };
      const updatedAttachments = [...(activeTask.attachments || []), newAttachment];
      await onUpdateTask(activeTask.id, { attachments: updatedAttachments });
      setCurrentTask((prev) => (prev ? { ...prev, attachments: updatedAttachments } : prev));
    } catch (err) {
      console.error('Failed to attach encrypted file:', err);
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = async (fileId: string) => {
    if (!activeTask) return;
    const updated = (activeTask.attachments || []).filter((a) => a.fileId !== fileId);
    await onUpdateTask(activeTask.id, { attachments: updated });
    setCurrentTask((prev) => (prev ? { ...prev, attachments: updated } : prev));
  };

  // Load comments whenever modal opens or task changes
  useEffect(() => {
    if (!isOpen || !task) return;

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const fetched = await api.getTaskComments(task.id);
        setComments(fetched);
      } catch (err) {
        console.error('Failed to load task comments:', err);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [isOpen, task]);

  if (!isOpen || !activeTask) return null;

  const project = projects.find((p) => p.id === activeTask.projectId);
  const statusInfo = STATUS_LABELS[activeTask.status] || STATUS_LABELS.todo;
  const priorityInfo = PRIORITY_LABELS[activeTask.priority] || PRIORITY_LABELS.medium;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setUpdating(true);
    try {
      await onUpdateStatus(activeTask.id, newStatus);
      setCurrentTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } finally {
      setUpdating(false);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    setUpdating(true);
    try {
      await onUpdateTask(activeTask.id, { assigneeId: newAssigneeId || undefined });
      setCurrentTask((prev) =>
        prev
          ? {
              ...prev,
              assigneeId: newAssigneeId || undefined,
              assignee: users.find((u) => u.id === newAssigneeId),
            }
          : prev
      );
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setUpdating(true);
    try {
      await onUpdateTask(activeTask.id, { priority: newPriority });
      setCurrentTask((prev) => (prev ? { ...prev, priority: newPriority } : prev));
    } finally {
      setUpdating(false);
    }
  };

  const handleDueDateChange = async (newDueDate: string) => {
    setUpdating(true);
    try {
      await onUpdateTask(activeTask.id, { dueDate: newDueDate || undefined });
      setCurrentTask((prev) => (prev ? { ...prev, dueDate: newDueDate || undefined } : prev));
    } finally {
      setUpdating(false);
    }
  };

  const handleAddQAStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isQAEngineer) {
      setQaError('Permission denied: Only QA Engineers can add QA review steps.');
      return;
    }
    if (!newStepTitle.trim() || !activeTask || addingStep) return;

    setAddingStep(true);
    setQaError(null);
    try {
      const updated = await api.addQAStep(activeTask.id, {
        title: newStepTitle.trim(),
        description: newStepDescription.trim() || undefined,
      });
      setCurrentTask(updated);
      onTaskUpdated?.(updated);
      setNewStepTitle('');
      setNewStepDescription('');
      setShowAddStepForm(false);
    } catch (err: unknown) {
      setQaError(err instanceof Error ? err.message : 'Failed to add QA review step');
    } finally {
      setAddingStep(false);
    }
  };

  const handleUpdateStepStatus = async (stepId: string, status: QAStepStatus) => {
    if (!activeTask || updatingStepId) return;
    setUpdatingStepId(stepId);
    setQaError(null);
    try {
      const updated = await api.updateQAStep(activeTask.id, stepId, { status });
      setCurrentTask(updated);
      onTaskUpdated?.(updated);
    } catch (err: unknown) {
      setQaError(err instanceof Error ? err.message : 'Failed to update QA step status');
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleSaveStepNote = async (stepId: string) => {
    if (!activeTask || updatingStepId) return;
    setUpdatingStepId(stepId);
    setQaError(null);
    try {
      const updated = await api.updateQAStep(activeTask.id, stepId, { notes: stepNoteText });
      setCurrentTask(updated);
      onTaskUpdated?.(updated);
      setEditingStepNoteId(null);
      setStepNoteText('');
    } catch (err: unknown) {
      setQaError(err instanceof Error ? err.message : 'Failed to save QA step notes');
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!activeTask || updatingStepId) return;
    setUpdatingStepId(stepId);
    setQaError(null);
    try {
      const updated = await api.deleteQAStep(activeTask.id, stepId);
      setCurrentTask(updated);
      onTaskUpdated?.(updated);
    } catch (err: unknown) {
      setQaError(err instanceof Error ? err.message : 'Failed to delete QA review step');
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || submittingComment || !canInteract) return;

    setSubmittingComment(true);
    try {
      const newComment = await api.createTaskComment(activeTask.id, commentInput.trim());
      const updated = [...comments, newComment];
      setComments(updated);
      setCommentInput('');
      onCommentCountChange?.(activeTask.id, updated.length);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteTaskComment(activeTask.id, commentId);
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      onCommentCountChange?.(activeTask.id, updated.length);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-neutral-950 text-indigo-400 border border-neutral-800">
                {project ? `[${project.key}]` : 'TASK'}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.badge}`}>
                {statusInfo.label}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityInfo.badge}`}>
                {priorityInfo.label} Priority
              </span>
              <span className="text-[11px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                {activeTask.storyPoints} pts
              </span>
              {activeTask.dueDate && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    getDueDateStatus(activeTask.dueDate)?.className || ''
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {getDueDateStatus(activeTask.dueDate)?.label || activeTask.dueDate}
                </span>
              )}
              {activeTask.qaVerdict && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    activeTask.qaVerdict === 'passed'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : activeTask.qaVerdict === 'failed'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {activeTask.qaVerdict === 'passed'
                    ? `QA Passed (${(activeTask.qaSteps || []).filter((s) => s.status === 'passed').length}/${(activeTask.qaSteps || []).length})`
                    : activeTask.qaVerdict === 'failed'
                    ? `QA Failed (${(activeTask.qaSteps || []).filter((s) => s.status === 'failed').length} issue)`
                    : `QA Review (${(activeTask.qaSteps || []).filter((s) => s.status === 'passed').length}/${(activeTask.qaSteps || []).length})`}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-neutral-100 leading-snug break-words">
              {activeTask.title}
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onDiscussInChat(activeTask)}
              title="Discuss in Chat"
              className="p-1.5 text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 rounded-lg transition"
            >
              <MessageSquareShare className="w-4 h-4" />
            </button>
            {canManage && (
              <button
                onClick={() => onDeleteTask(activeTask.id)}
                title="Delete Task (Admin/Manager)"
                className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body: Details + Comments */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Main Grid: Description + Attributes Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Description & Acceptance Criteria */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Description & Criteria
                </h4>
                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {activeTask.description || (
                    <span className="text-neutral-500 italic">No description provided for this task.</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {activeTask.tags && activeTask.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-neutral-500" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTask.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-neutral-800/80 text-neutral-300 px-2.5 py-1 rounded-md border border-neutral-700/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* QA Review & Verification Steps */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                        QA Review Steps ({ (activeTask.qaSteps || []).length })
                        {activeTask.qaSteps && activeTask.qaSteps.length > 0 && (
                          <span className="text-[10px] font-semibold font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                            {activeTask.qaSteps.filter((s) => s.status === 'passed').length}/
                            {activeTask.qaSteps.length} passed
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Test verification criteria, acceptance checklists, and QA engineer findings.
                      </p>
                    </div>
                  </div>

                  {canAddQASteps ? (
                    <button
                      type="button"
                      onClick={() => setShowAddStepForm(!showAddStepForm)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddStepForm ? 'Cancel' : 'Add QA Step'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-neutral-500 italic bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                      QA Engineers only
                    </span>
                  )}
                </div>

                {qaError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{qaError}</span>
                  </div>
                )}

                {/* Add Step Form */}
                {showAddStepForm && (
                  <form onSubmit={handleAddQAStep} className="p-3 bg-neutral-900/90 border border-indigo-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">New QA Verification Step</span>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-neutral-500 uppercase mr-1">Templates:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStepTitle('Verify happy path workflow');
                            setNewStepDescription('Test standard expected behavior with valid inputs and permissions.');
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        >
                          + Happy Path
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStepTitle('Verify boundary & edge cases');
                            setNewStepDescription('Test empty inputs, limits, invalid inputs, and network latency.');
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        >
                          + Edge Cases
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStepTitle('Verify security & RBAC authorization');
                            setNewStepDescription('Confirm non-privileged roles cannot tamper with state or bypass E2EE keys.');
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        >
                          + Security
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={newStepTitle}
                        onChange={(e) => setNewStepTitle(e.target.value)}
                        placeholder="e.g. Verify websocket reconnection on mobile network switch"
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <textarea
                        value={newStepDescription}
                        onChange={(e) => setNewStepDescription(e.target.value)}
                        placeholder="Optional details, test instructions, or expected outcome..."
                        rows={2}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddStepForm(false)}
                        className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingStep || !newStepTitle.trim()}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {addingStep ? 'Adding...' : 'Save Step'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Steps List */}
                {(!activeTask.qaSteps || activeTask.qaSteps.length === 0) ? (
                  <div className="p-4 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center">
                    <ShieldCheck className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
                    <p className="text-xs text-neutral-400 font-medium">No QA review steps defined yet</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Add acceptance criteria or verification test cases to track QA sign-off.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeTask.qaSteps.map((step) => (
                      <div
                        key={step.id}
                        className={`p-3 rounded-xl border transition-all ${
                          step.status === 'passed'
                            ? 'bg-emerald-950/20 border-emerald-800/40'
                            : step.status === 'failed'
                            ? 'bg-rose-950/20 border-rose-800/40'
                            : step.status === 'skipped'
                            ? 'bg-neutral-900/30 border-neutral-800 text-neutral-400'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="mt-0.5 shrink-0">
                              {step.status === 'passed' && (
                                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              )}
                              {step.status === 'failed' && (
                                <span className="p-1 rounded-full bg-rose-500/20 text-rose-400 inline-flex">
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                              {step.status === 'skipped' && (
                                <span className="p-1 rounded-full bg-neutral-800 text-neutral-400 inline-flex">
                                  <MinusCircle className="w-4 h-4" />
                                </span>
                              )}
                              {step.status === 'pending' && (
                                <span className="p-1 rounded-full bg-amber-500/20 text-amber-400 inline-flex">
                                  <Clock className="w-4 h-4" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-xs sm:text-sm text-neutral-100 leading-snug">
                                  {step.title}
                                </p>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                    step.status === 'passed'
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      : step.status === 'failed'
                                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                      : step.status === 'skipped'
                                      ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  }`}
                                >
                                  {step.status}
                                </span>
                              </div>

                              {step.description && (
                                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                                  {step.description}
                                </p>
                              )}

                              {/* Tester Attribution */}
                              {step.testedByName && step.testedAt && (
                                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-400">
                                  {step.testedByAvatar ? (
                                    <img
                                      src={step.testedByAvatar}
                                      alt={step.testedByName}
                                      className="w-4 h-4 rounded-full object-cover ring-1 ring-neutral-700"
                                    />
                                  ) : (
                                    <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                                  )}
                                  <span>
                                    Tested by <strong className="text-neutral-200">{step.testedByName}</strong> on{' '}
                                    {new Date(step.testedAt).toLocaleDateString()}{' '}
                                    {new Date(step.testedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}

                              {/* Findings Notes */}
                              {step.notes && editingStepNoteId !== step.id && (
                                <div
                                  className={`mt-2 p-2 rounded-lg text-xs leading-relaxed border ${
                                    step.status === 'failed'
                                      ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                                      : 'bg-neutral-950/80 border-neutral-800 text-neutral-300'
                                  }`}
                                >
                                  <span className="font-semibold block text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
                                    QA Findings / Notes:
                                  </span>
                                  {step.notes}
                                </div>
                              )}

                              {/* Edit note input */}
                              {editingStepNoteId === step.id && (
                                <div className="mt-2.5 p-2 rounded-lg bg-neutral-950 border border-indigo-500/40 space-y-2">
                                  <textarea
                                    value={stepNoteText}
                                    onChange={(e) => setStepNoteText(e.target.value)}
                                    placeholder="Add test findings, error logs, or environment notes..."
                                    rows={2}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingStepNoteId(null)}
                                      className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveStepNote(step.id)}
                                      disabled={updatingStepId === step.id}
                                      className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition disabled:opacity-50"
                                    >
                                      Save Notes
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Pass / Fail / Skip / Reset & Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            {canTestQA && (
                              <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                                <button
                                  type="button"
                                  title="Mark Passed"
                                  disabled={updatingStepId === step.id || step.status === 'passed'}
                                  onClick={() => handleUpdateStepStatus(step.id, 'passed')}
                                  className={`p-1 rounded text-xs transition ${
                                    step.status === 'passed'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Mark Failed"
                                  disabled={updatingStepId === step.id || step.status === 'failed'}
                                  onClick={() => handleUpdateStepStatus(step.id, 'failed')}
                                  className={`p-1 rounded text-xs transition ${
                                    step.status === 'failed'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Mark Skipped"
                                  disabled={updatingStepId === step.id || step.status === 'skipped'}
                                  onClick={() => handleUpdateStepStatus(step.id, 'skipped')}
                                  className={`p-1 rounded text-xs transition ${
                                    step.status === 'skipped'
                                      ? 'bg-neutral-800 text-neutral-200'
                                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                                  }`}
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Reset to Pending"
                                  disabled={updatingStepId === step.id || step.status === 'pending'}
                                  onClick={() => handleUpdateStepStatus(step.id, 'pending')}
                                  className={`p-1 rounded text-xs transition ${
                                    step.status === 'pending'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800'
                                  }`}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {canTestQA && editingStepNoteId !== step.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStepNoteId(step.id);
                                  setStepNoteText(step.notes || '');
                                }}
                                title={step.notes ? 'Edit Notes' : 'Add Notes'}
                                className="p-1.5 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 rounded-lg transition"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {canDeleteQAStep && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStep(step.id)}
                                title="Delete QA Step"
                                disabled={updatingStepId === step.id}
                                className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Encrypted Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    Encrypted Attachments ({(activeTask.attachments || []).length})
                  </h4>

                  {canInteract && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAttachment}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition disabled:opacity-50 font-medium"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>{uploadingAttachment ? 'Encrypting...' : 'Add Attachment'}</span>
                      </button>
                    </>
                  )}
                </div>

                {(!activeTask.attachments || activeTask.attachments.length === 0) ? (
                  <p className="text-xs text-neutral-500 italic bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
                    No attachments uploaded. You can attach encrypted specs, mockups, or logs up to 50MB.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeTask.attachments.map((att) => (
                      <TaskAttachmentCard
                        key={att.fileId}
                        attachment={att}
                        canDelete={canInteract}
                        onDelete={() => handleRemoveAttachment(att.fileId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Metadata & Controls */}
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3.5 h-fit text-xs">
              {/* Project */}
              <div>
                <span className="text-neutral-500 uppercase font-semibold text-[10px] block mb-1">
                  Project
                </span>
                <span className="font-medium text-neutral-200 flex items-center gap-1.5 truncate">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {activeTask.projectName || project?.name || 'Platform Core'}
                </span>
              </div>

              {/* Status Selector */}
              <div>
                <span className="text-neutral-500 uppercase font-semibold text-[10px] block mb-1">
                  Status / Column
                </span>
                <select
                  value={activeTask.status}
                  disabled={!canInteract || updating}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Selector (Admin/Manager) */}
              <div>
                <span className="text-neutral-500 uppercase font-semibold text-[10px] block mb-1">
                  Priority
                </span>
                {canManage ? (
                  <select
                    value={activeTask.priority}
                    disabled={updating}
                    onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                ) : (
                  <span className="font-medium text-neutral-200 capitalize">{activeTask.priority}</span>
                )}
              </div>

              {/* Assignee */}
              <div>
                <span className="text-neutral-500 uppercase font-semibold text-[10px] block mb-1">
                  Assignee
                </span>
                {canManage ? (
                  <select
                    value={activeTask.assigneeId || ''}
                    disabled={updating}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {formatUserRole(u)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {activeTask.assignee ? (
                      <>
                        <img
                          src={activeTask.assignee.avatar}
                          alt={activeTask.assignee.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-medium text-neutral-200">{activeTask.assignee.name}</span>
                      </>
                    ) : (
                      <span className="text-neutral-500 italic">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-neutral-500 uppercase font-semibold text-[10px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    Due Date
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 7 * 86400000);
                          handleDueDateChange(d.toISOString().split('T')[0]);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition"
                      >
                        +1W
                      </button>
                      <span className="text-neutral-600">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 14 * 86400000);
                          handleDueDateChange(d.toISOString().split('T')[0]);
                        }}
                        className="text-neutral-400 hover:text-neutral-200 transition"
                      >
                        +2W
                      </button>
                      {activeTask.dueDate && (
                        <>
                          <span className="text-neutral-600">·</span>
                          <button
                            type="button"
                            onClick={() => handleDueDateChange('')}
                            className="text-neutral-500 hover:text-rose-400 transition"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {canManage ? (
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={activeTask.dueDate || ''}
                      disabled={updating}
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    />
                    {activeTask.dueDate && (
                      <div className="pt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-semibold ${
                            getDueDateStatus(activeTask.dueDate)?.className || ''
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {getDueDateStatus(activeTask.dueDate)?.label || activeTask.dueDate}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {activeTask.dueDate ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-semibold ${
                          getDueDateStatus(activeTask.dueDate)?.className || ''
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {getDueDateStatus(activeTask.dueDate)?.label || activeTask.dueDate}
                      </span>
                    ) : (
                      <span className="text-neutral-500 italic">No due date set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Creator */}
              {activeTask.creator && (
                <div>
                  <span className="text-neutral-500 uppercase font-semibold text-[10px] block mb-1">
                    Created By
                  </span>
                  <div className="flex items-center gap-1.5">
                    <img
                      src={activeTask.creator.avatar}
                      alt={activeTask.creator.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-neutral-300">{activeTask.creator.name}</span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-2 border-t border-neutral-800 space-y-1 text-[11px] text-neutral-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-600" />
                  <span>Created {new Date(activeTask.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Comments Section */}
          <div className="pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Comments & Discussion ({comments.length})</span>
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4">
              {loadingComments ? (
                <div className="py-6 text-center text-xs text-neutral-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-500">
                  No comments yet. Leave a note or feedback below!
                </div>
              ) : (
                comments.map((comment) => {
                  const isAuthor = currentUser?.id === comment.userId;
                  const canDelete = isAuthor || canManage;

                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/90 text-xs group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              comment.user?.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={comment.user?.name || 'User'}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-semibold text-neutral-200">
                            {comment.user?.name || 'Team Member'}
                          </span>
                          {comment.user && (
                            <span className={`text-[8px] uppercase font-bold px-1 py-0.2 rounded border ${getUserRoleBadge(comment.user).class}`}>
                              {getUserRoleBadge(comment.user).shortLabel}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-500">
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete comment"
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 transition p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap pl-7">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Comment Input */}
            {canInteract ? (
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment or note on this task..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentInput.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            ) : (
              <p className="text-xs text-neutral-500 italic text-center py-2">
                Viewer accounts have read-only access and cannot post comments.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
