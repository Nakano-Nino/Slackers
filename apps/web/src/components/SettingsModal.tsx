'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Upload,
  ImageIcon,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  KeyRound,
  Briefcase,
  ExternalLink,
  Bell,
  BellOff,
  Clock,
  Hash,
  Laptop,
  Smartphone,
  Trash2,
  Globe,
  Copy,
  Check,
  Download,
  ShieldCheck,
  FileKey,
  RefreshCw,
  Webhook as WebhookIcon,
  Cpu,
  GitBranch,
  Play,
  Terminal,
  Code,
  Plus,
  ToggleLeft,
  ToggleRight,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { AutomationRule, Channel, MuteTarget, User, UserSession, Webhook, WebhookLog, WebhookType } from '../types';
import { api } from '../lib/api';
import { DEVELOPER_ROLES, getUserRoleBadge } from '../lib/roles';
import { E2EEService } from '../lib/e2ee';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onProfileUpdated: (updatedUser: User, passwordChanged?: boolean) => void;
  mutedTargets?: MuteTarget[];
  onUnmuteTarget?: (targetType: 'channel' | 'dm', targetId: string) => Promise<void>;
}

const AVATAR_PRESETS = [
  { id: '1', label: 'Architect', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Manager', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Backend', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=250&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Security', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Frontend', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
  { id: '6', label: 'DevOps', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80' },
  { id: '7', label: 'Designer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80' },
  { id: '8', label: 'QA Tester', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80' },
  { id: '9', label: 'Auditor', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
  { id: '10', label: 'Full Stack', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80' },
  { id: '11', label: 'Mobile', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80' },
  { id: '12', label: 'Data/AI', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80' },
];

type SettingsTab = 'profile' | 'avatar' | 'security' | 'sessions' | 'notifications' | 'integrations';

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  mutedTargets = [],
  onUnmuteTarget,
}: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [developerRole, setDeveloperRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Multi-device sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDeveloperRole(currentUser.developerRole || 'backend_developer');
      setAvatar(currentUser.avatar || '');
      setCustomAvatarUrl('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordChangedSuccess(false);
      setUploadedFileName(null);
      setUploadingImage(false);
      setIsDragging(false);
      setError(null);
      setSuccessMessage(null);
    }
  }, [currentUser, isOpen]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err) {
      console.warn('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions' && isOpen) {
      fetchSessions();
    }
  }, [activeTab, isOpen]);

  // Security Tab E2EE Extensions
  const [userFingerprint, setUserFingerprint] = useState<string>('');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [verifiedPeers, setVerifiedPeers] = useState<Record<string, { fingerprint: string; verifiedAt: string }>>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string>('');
  const [copiedRecoveryKey, setCopiedRecoveryKey] = useState(false);
  const [exportingVault, setExportingVault] = useState(false);
  const [vaultExportSuccess, setVaultExportSuccess] = useState(false);
  const [importBackupJson, setImportBackupJson] = useState('');
  const [importRecoveryKey, setImportRecoveryKey] = useState('');
  const [importingVault, setImportingVault] = useState(false);
  const [vaultRestoreSuccess, setVaultRestoreSuccess] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'security' && isOpen && currentUser) {
      const pubKey =
        currentUser.publicKey ||
        (typeof window !== 'undefined' ? localStorage.getItem(`slackers_e2ee_pub_${currentUser.id}`) : '') ||
        '';
      if (pubKey) {
        E2EEService.computeKeyFingerprint(pubKey).then(setUserFingerprint).catch(console.warn);
      }
      setVerifiedPeers(E2EEService.getVerifiedPeers(currentUser.id));
      api.getUsers().then(setAllUsers).catch(console.warn);
    }
  }, [activeTab, isOpen, currentUser]);

  const handleGenerateRecoveryKey = () => {
    const key = E2EEService.generateRecoveryKey();
    setGeneratedRecoveryKey(key);
    setVaultExportSuccess(false);
    setVaultError(null);
  };

  const handleExportVault = async () => {
    if (!currentUser || !generatedRecoveryKey) return;
    setExportingVault(true);
    setVaultError(null);
    try {
      const keypair = await E2EEService.getOrCreateUserKeyPair(currentUser.id);
      const backupJson = await E2EEService.exportRecoveryVault(
        keypair.privateKey,
        keypair.publicKeyJwk,
        generatedRecoveryKey
      );
      // Trigger download of JSON backup file
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slackers-e2ee-backup-${currentUser.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setVaultExportSuccess(true);
    } catch (err: unknown) {
      setVaultError(err instanceof Error ? err.message : 'Failed to export key vault');
    } finally {
      setExportingVault(false);
    }
  };

  const handleImportVault = async () => {
    if (!currentUser || !importBackupJson.trim() || !importRecoveryKey.trim()) return;
    setImportingVault(true);
    setVaultError(null);
    setVaultRestoreSuccess(false);
    try {
      const restored = await E2EEService.importRecoveryVault(
        importBackupJson.trim(),
        importRecoveryKey.trim()
      );
      // Cache restored keys in local storage
      const privJwk = await window.crypto.subtle.exportKey('jwk', restored.privateKey);
      localStorage.setItem(`slackers_e2ee_priv_${currentUser.id}`, JSON.stringify(privJwk));
      localStorage.setItem(`slackers_e2ee_pub_${currentUser.id}`, restored.publicKeyJwk);

      setVaultRestoreSuccess(true);
      setImportBackupJson('');
      setImportRecoveryKey('');
    } catch (err: unknown) {
      setVaultError(err instanceof Error ? err.message : 'Failed to restore key vault. Check recovery key.');
    } finally {
      setImportingVault(false);
    }
  };

  const handleRevokePeer = (peerId: string) => {
    if (!currentUser) return;
    E2EEService.markPeerAsUnverified(currentUser.id, peerId);
    setVerifiedPeers(E2EEService.getVerifiedPeers(currentUser.id));
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await api.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSuccessMessage('Device session revoked successfully');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // ==========================================
  // Integrations & Automation State
  // ==========================================
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [selectedLogsWebhookId, setSelectedLogsWebhookId] = useState<string | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [pingingWebhookId, setPingingWebhookId] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<{ id: string; message: string; isError?: boolean } | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [copiedCurlId, setCopiedCurlId] = useState<string | null>(null);

  // New webhook form modal
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhChannelId, setNewWhChannelId] = useState('');
  const [newWhType, setNewWhType] = useState<WebhookType>('GENERIC');
  const [newWhSecret, setNewWhSecret] = useState('');
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  // Load integrations data
  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    try {
      const [whList, rulesList, chList] = await Promise.all([
        api.getWebhooks(),
        api.getAutomationRules(),
        api.getChannels(),
      ]);
      setWebhooks(whList);
      setAutomationRules(rulesList);
      setChannels(chList);
      if (chList.length > 0 && !newWhChannelId) {
        setNewWhChannelId(chList[0].id);
      }
    } catch (err) {
      console.warn('Failed to load integrations:', err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'integrations' && isOpen) {
      fetchIntegrations();
    }
  }, [activeTab, isOpen]);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName.trim() || !newWhChannelId) return;
    setCreatingWebhook(true);
    try {
      const created = await api.createWebhook({
        name: newWhName.trim(),
        channelId: newWhChannelId,
        type: newWhType,
        secret: newWhSecret.trim() || undefined,
      });
      setWebhooks((prev) => [created, ...prev]);
      setShowCreateWebhook(false);
      setNewWhName('');
      setNewWhSecret('');
    } catch (err) {
      console.warn('Failed to create webhook:', err);
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await api.deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      if (selectedLogsWebhookId === id) setSelectedLogsWebhookId(null);
    } catch (err) {
      console.warn('Failed to delete webhook:', err);
    }
  };

  const handleSendTestPing = async (wh: Webhook) => {
    setPingingWebhookId(wh.id);
    setPingStatus(null);
    try {
      const res = await api.sendTestPing(wh.id);
      setPingStatus({ id: wh.id, message: res.message || 'Test ping delivered!' });
    } catch (err: unknown) {
      setPingStatus({
        id: wh.id,
        message: err instanceof Error ? err.message : 'Delivery failed',
        isError: true,
      });
    } finally {
      setPingingWebhookId(null);
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const updated = await api.updateAutomationRule(rule.id, { isActive: !rule.isActive });
      setAutomationRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      console.warn('Failed to toggle rule:', err);
    }
  };

  const handleViewLogs = async (webhookId: string) => {
    if (selectedLogsWebhookId === webhookId) {
      setSelectedLogsWebhookId(null);
      return;
    }
    setSelectedLogsWebhookId(webhookId);
    setLoadingLogs(true);
    try {
      const logs = await api.getWebhookLogs(webhookId);
      setWebhookLogs(logs);
    } catch (err) {
      console.warn('Failed to load logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setLoadingSessions(true);
    try {
      const count = await api.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setSuccessMessage(`Revoked ${count} other active session(s)`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke other sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  const activeMutes = mutedTargets.filter(
    (m) => m.mutedUntil === null || new Date(m.mutedUntil).getTime() > Date.now()
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (!email.trim()) {
      setError('Email cannot be empty');
      return;
    }

    // Password validation if attempting to change password
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Please enter your current password to set a new password');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const canChangeDeveloperRole = currentUser.role === 'admin' || currentUser.role === 'manager';

      let finalAvatar = avatar.trim();
      if (finalAvatar.startsWith('data:')) {
        try {
          const uploadRes = await api.uploadAvatar(finalAvatar);
          finalAvatar = uploadRes.avatarUrl;
          setAvatar(finalAvatar);
        } catch (uploadErr) {
          console.warn('Avatar upload fallback notice:', uploadErr);
        }
      }

      const payload: {
        name: string;
        email: string;
        avatar: string;
        developerRole?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: name.trim(),
        email: email.trim(),
        avatar: finalAvatar,
      };

      if (canChangeDeveloperRole) {
        payload.developerRole = developerRole.trim();
      }

      if (newPassword && currentPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const wasPasswordChanged = Boolean(newPassword && currentPassword);

      const res = await api.updateProfile(payload);

      // If password changed, re-encrypt the local E2EE private key with the new password
      if (newPassword) {
        try {
          const userKeyPair = await E2EEService.getOrCreateUserKeyPair(currentUser.id, currentPassword);
          const pubJwk = await window.crypto.subtle.exportKey('jwk', userKeyPair.publicKey);
          const vault = await E2EEService.encryptPrivateKeyWithPassword(
            userKeyPair.privateKey,
            JSON.stringify(pubJwk),
            newPassword
          );
          await api.saveKeyVault(vault);
        } catch (e2eeErr) {
          console.warn('E2EE key vault update notice:', e2eeErr);
        }
      }

      onProfileUpdated(res.user, wasPasswordChanged);
      if (wasPasswordChanged) {
        setPasswordChangedSuccess(true);
        setSuccessMessage('Password changed and profile updated successfully!');
      } else {
        setSuccessMessage('Profile updated successfully!');
      }
      setUploadedFileName(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomAvatar = () => {
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      setSuccessMessage('Custom avatar preview updated');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleProcessImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, or GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image exceeds maximum size limit of 5 MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        setAvatar(optimizedDataUrl);
        setUploadedFileName(file.name);
        setSuccessMessage(`Photo "${file.name}" loaded! Click "Save Changes" or "Upload & Save Now" to apply.`);
        setTimeout(() => setSuccessMessage(null), 3500);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAndSaveImmediately = async () => {
    if (!avatar || !avatar.startsWith('data:')) return;
    setUploadingImage(true);
    setError(null);
    try {
      const res = await api.uploadAvatar(avatar);
      setAvatar(res.avatarUrl);
      setUploadedFileName(null);
      setSuccessMessage('Profile picture uploaded and saved successfully!');
      onProfileUpdated(res.user);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const currentRoleBadge = getUserRoleBadge({ role: currentUser.role, developerRole });
  const canChangeDeveloperRole = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-100/70 dark:bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatar || currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50 shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                Account & Profile Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Manage your credentials, engineering title, and avatar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-neutral-800 px-6 bg-slate-50 dark:bg-neutral-950/50 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'avatar'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Profile Picture
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Password & Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Devices & Sessions</span>
            {sessions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                {sessions.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <BellOff className="w-4 h-4" />
            <span>Muted Alerts</span>
            {activeMutes.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                {activeMutes.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <WebhookIcon className="w-4 h-4" />
            <span>Integrations & Automation</span>
            {webhooks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                {webhooks.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@slackers.dev"
                    required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">
                  Used for sign-in and encrypted Direct Message identification.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <span>Engineering Role / Specialization</span>
                    {!canChangeDeveloperRole && (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </label>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${currentRoleBadge.class}`}>
                    {currentRoleBadge.label}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Briefcase className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500" />
                  <select
                    value={developerRole}
                    onChange={(e) => setDeveloperRole(e.target.value)}
                    disabled={!canChangeDeveloperRole}
                    className={`w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-neutral-100 focus:outline-none transition ${
                      canChangeDeveloperRole
                        ? 'focus:border-indigo-500 cursor-pointer'
                        : 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-neutral-900 select-none'
                    }`}
                  >
                    {DEVELOPER_ROLES.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-neutral-100">
                        {r.label} — {r.description}
                      </option>
                    ))}
                  </select>
                </div>
                {!canChangeDeveloperRole && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Assigned by Workspace Admin or Manager. Normal members cannot modify their engineering role.</span>
                  </p>
                )}
              </div>

              {/* System Authorization Role Banner */}
              <div className="p-3 bg-slate-100 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                      System Permission Authority
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {currentUser.role === 'admin'
                        ? 'Administrator (Full project, channel & task authority)'
                        : currentUser.role === 'manager'
                        ? 'Engineering Manager (Task scope & board assignment authority)'
                        : currentUser.role === 'viewer'
                        ? 'Viewer (Read-only access)'
                        : 'Team Member (E2EE Chat, Tasks, Bugs & Comments)'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Profile Picture (Avatar) */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {/* Current Preview Card */}
              <div className="p-4 bg-slate-100 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800/80 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to choose a photo from your computer"
                  >
                    <img
                      src={avatar || currentUser.avatar}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md group-hover:opacity-85 transition"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                      Live Avatar Preview
                      {avatar && avatar !== currentUser.avatar && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-medium">
                          Unsaved
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                      Click the preview, drop a photo, or choose from developer presets below.
                    </p>
                  </div>
                </div>

                {avatar !== currentUser.avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar(currentUser.avatar || '');
                      setUploadedFileName(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 underline shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Upload Custom Image (Drag & Drop + File Picker) */}
              <div className="p-4 bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    Upload Image from Device
                  </label>
                  {uploadedFileName && (
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium truncate max-w-[200px]">
                      {uploadedFileName}
                    </span>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                      : 'border-slate-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-neutral-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-500">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                      Click to choose an image <span className="font-normal text-slate-500 dark:text-neutral-400">or drag and drop</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                      PNG, JPG, WebP, or GIF (up to 5 MB) · Auto-cropped to square 512×512
                    </p>
                  </div>
                </div>

                {avatar && avatar.startsWith('data:') && (
                  <div className="flex items-center justify-between pt-1 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Image loaded and ready to save</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadAndSaveImmediately}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                    >
                      {uploadingImage ? 'Saving...' : 'Upload & Save Now'}
                    </button>
                  </div>
                )}
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Curated Developer Avatar Presets
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatar(preset.url);
                          setUploadedFileName(null);
                        }}
                        className={`group relative flex flex-col items-center p-2 rounded-xl border transition ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/10'
                            : 'bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 hover:border-indigo-400'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-neutral-400 mt-1.5 truncate max-w-full">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Input */}
              <div className="pt-2 border-t border-slate-200 dark:border-neutral-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Or Use Custom Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyCustomAvatar();
                      setUploadedFileName(null);
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Password & Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {passwordChangedSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <div>
                    <span className="font-semibold">Password Changed Successfully!</span> Your account password has been updated and your E2EE key vault re-encrypted.
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-semibold">Zero-Knowledge E2EE Key Vault Protection:</span>{' '}
                  Changing your password will automatically re-encrypt your private key vault using PBKDF2 (100,000 rounds) so your encrypted chat history remains accessible across all your devices.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500 pointer-events-none" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none transition p-0.5 rounded"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none transition p-0.5 rounded"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-400 dark:text-neutral-500 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full bg-white dark:bg-neutral-950 border border-slate-300 dark:border-neutral-800 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none transition p-0.5 rounded"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Cryptographic Identity & Public Key Fingerprint */}
              <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                      Cryptographic Identity Fingerprint
                    </h4>
                  </div>
                  {userFingerprint && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(userFingerprint);
                        setCopiedFingerprint(true);
                        setTimeout(() => setCopiedFingerprint(false), 2000);
                      }}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {copiedFingerprint ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Fingerprint</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Your ECDH P-256 public identity key fingerprint is used by teammates to verify your end-to-end encrypted connection.
                </p>
                <div className="p-2.5 bg-slate-100 dark:bg-neutral-950 rounded-lg border border-slate-200 dark:border-neutral-800 font-mono text-xs text-slate-800 dark:text-neutral-200 break-all select-all">
                  {userFingerprint || 'Calculating identity fingerprint...'}
                </div>
              </div>

              {/* Section 3: Cross-Signed Verified Teammates */}
              <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                      Cross-Signed Verified Contacts
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                    {Object.keys(verifiedPeers).length} Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Contacts whose 60-digit safety numbers you have verified out-of-band. You will be warned immediately if their keys ever change.
                </p>

                {Object.keys(verifiedPeers).length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400">
                    No verified contacts yet. Open a direct message and click the shield badge to compare safety numbers.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(verifiedPeers).map(([peerId, data]) => {
                      const peerUser = allUsers.find((u) => u.id === peerId);
                      return (
                        <div
                          key={peerId}
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={peerUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                              alt={peerUser?.name || 'Contact'}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-neutral-100 truncate">
                                {peerUser?.name || peerId}
                              </p>
                              <code className="font-mono text-[10px] text-slate-500 dark:text-neutral-400 truncate block">
                                {data.fingerprint}
                              </code>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRevokePeer(peerId)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              title="Revoke verification"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 4: Emergency Key Backup & Recovery Vault */}
              <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <FileKey className="w-4 h-4 text-amber-500 shrink-0" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                    Emergency Vault Backup & Recovery (Megolm / PIN Standard)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Generate an independent 128-bit emergency recovery key to export a cryptographically sealed backup of your private key vault. You can use this to recover your conversation history even if your password is reset.
                </p>

                {vaultError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{vaultError}</span>
                  </div>
                )}

                {vaultExportSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Vault backup exported successfully! Store your recovery key in a secure location.</span>
                  </div>
                )}

                {vaultRestoreSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Key vault restored and activated on this device!</span>
                  </div>
                )}

                {/* Sub-panel: Export */}
                <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                      Export Encrypted Key Vault
                    </span>
                    {!generatedRecoveryKey ? (
                      <button
                        type="button"
                        onClick={handleGenerateRecoveryKey}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                      >
                        Generate Recovery Key
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleExportVault}
                        disabled={exportingVault}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{exportingVault ? 'Exporting...' : 'Download Vault (.json)'}</span>
                      </button>
                    )}
                  </div>

                  {generatedRecoveryKey && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 dark:text-neutral-400">Emergency Recovery Key:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedRecoveryKey);
                            setCopiedRecoveryKey(true);
                            setTimeout(() => setCopiedRecoveryKey(false), 2000);
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedRecoveryKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedRecoveryKey ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg font-mono text-xs font-bold text-amber-900 dark:text-amber-200 text-center tracking-widest select-all">
                        {generatedRecoveryKey}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-500 italic">
                        ⚠️ Write down or securely store this recovery key. It is required to decrypt the exported backup.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sub-panel: Restore */}
                <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800/80 space-y-2.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 block">
                    Restore Vault from Emergency Backup
                  </span>
                  <input
                    type="text"
                    value={importRecoveryKey}
                    onChange={(e) => setImportRecoveryKey(e.target.value)}
                    placeholder="Enter Recovery Key (SLK-XXXX-...)"
                    className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <textarea
                    value={importBackupJson}
                    onChange={(e) => setImportBackupJson(e.target.value)}
                    placeholder="Paste exported backup JSON bundle here..."
                    rows={2}
                    className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleImportVault}
                    disabled={importingVault || !importRecoveryKey.trim() || !importBackupJson.trim()}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white disabled:opacity-40 transition cursor-pointer"
                  >
                    {importingVault ? 'Restoring Vault...' : 'Restore & Activate Vault'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Muted Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                    Muted Notifications
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Channels and direct messages you have turned off notifications for
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  {activeMutes.length} Muted
                </span>
              </div>

              {activeMutes.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                    No muted notifications
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1 max-w-sm mx-auto">
                    You will receive all messages and channel notifications normally. You can mute any channel or direct message from the conversation header.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {activeMutes.map((mute) => (
                    <div
                      key={mute.id}
                      className="p-3 bg-slate-50 dark:bg-neutral-950/60 border border-slate-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                          {mute.targetType === 'channel' ? (
                            <Hash className="w-4 h-4" />
                          ) : (
                            <UserIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100 truncate">
                            {mute.targetName || mute.targetId}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-neutral-500 shrink-0" />
                            <span>
                              {mute.mutedUntil
                                ? `Muted until ${new Date(mute.mutedUntil).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })} at ${new Date(mute.mutedUntil).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : 'Muted indefinitely (Forever)'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (onUnmuteTarget) {
                            await onUnmuteTarget(mute.targetType, mute.targetId);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg border border-indigo-200 dark:border-indigo-500/30 transition shrink-0"
                      >
                        Unmute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Devices & Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-500" />
                    <span>Logged-In Devices & Active Sessions</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    View all browsers and devices currently authenticated to your account.
                  </p>
                </div>
                {sessions.filter((s) => !s.isCurrent).length > 0 && (
                  <button
                    type="button"
                    onClick={handleRevokeOtherSessions}
                    disabled={loadingSessions}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
                  >
                    Revoke Other Sessions
                  </button>
                )}
              </div>

              {loadingSessions ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-neutral-400">
                  <Laptop className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm">No active sessions detected.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((sess) => {
                    const isMobile =
                      sess.deviceName.toLowerCase().includes('iphone') ||
                      sess.deviceName.toLowerCase().includes('android') ||
                      sess.deviceName.toLowerCase().includes('mobile');
                    return (
                      <div
                        key={sess.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                          sess.isCurrent
                            ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                            : 'bg-white dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              sess.isCurrent
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                            }`}
                          >
                            {isMobile ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Laptop className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100 truncate">
                                {sess.deviceName}
                              </p>
                              {sess.isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  This Device
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Globe className="w-3 h-3 text-slate-400" />
                                {sess.ipAddress}
                              </span>
                              <span>•</span>
                              <span>
                                {sess.isCurrent
                                  ? 'Active now'
                                  : `Last active ${new Date(sess.lastActiveAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`}
                              </span>
                            </p>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            disabled={revokingSessionId === sess.id}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/30 transition shrink-0 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {revokingSessionId === sess.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Developer Integrations & Automation Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header section with Create Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <WebhookIcon className="w-4 h-4 text-emerald-500" />
                    <span>Developer Integrations & Automation</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Trigger CI/CD pipelines, connect GitHub & GitLab webhooks, and automate Kanban workflows.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateWebhook(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Webhook</span>
                </button>
              </div>

              {/* Status Alert from Ping */}
              {pingStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                    pingStatus.isError
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pingStatus.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{pingStatus.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPingStatus(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Create Webhook Inline Form / Modal */}
              {showCreateWebhook && (
                <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-emerald-500/30 rounded-xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Configure New Webhook Endpoint</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowCreateWebhook(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                        Webhook Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GitHub Actions CI, Sentry Alerts"
                        value={newWhName}
                        onChange={(e) => setNewWhName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                        Post into Channel
                      </label>
                      <select
                        value={newWhChannelId}
                        onChange={(e) => setNewWhChannelId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {channels.map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.name} {c.isPrivate ? '(Private)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                        Integration Type
                      </label>
                      <select
                        value={newWhType}
                        onChange={(e) => setNewWhType(e.target.value as WebhookType)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="GENERIC">Generic Incoming (Slack & Discord compatible)</option>
                        <option value="GITHUB">GitHub Webhook (push, pull_request, HMAC)</option>
                        <option value="GITLAB">GitLab Webhook (push, merge_request, pipeline)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                        HMAC Secret Key (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-generated if left blank"
                        value={newWhSecret}
                        onChange={(e) => setNewWhSecret(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateWebhook(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateWebhook}
                      disabled={creatingWebhook || !newWhName.trim()}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{creatingWebhook ? 'Generating...' : 'Save & Generate Token'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Incoming Webhooks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configured Webhooks ({webhooks.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={fetchIntegrations}
                    className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingIntegrations ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-neutral-400 animate-pulse">
                    Loading integrations & automation rules...
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl text-center">
                    <WebhookIcon className="w-8 h-8 mx-auto text-slate-400 dark:text-neutral-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                      No webhooks configured yet
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                      Create an incoming webhook to receive CI/CD alerts and code updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map((wh) => {
                      const endpointPath =
                        wh.type === 'GITHUB'
                          ? `/api/webhooks/github/${wh.token}`
                          : wh.type === 'GITLAB'
                          ? `/api/webhooks/gitlab/${wh.token}`
                          : `/api/webhooks/incoming/${wh.token}`;
                      const fullUrl = `http://localhost:5001${endpointPath}`;
                      const curlCmd = `curl -X POST "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text": "🚀 Hello from ${wh.name}!"}'`;

                      return (
                        <div
                          key={wh.id}
                          className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3"
                        >
                          {/* Top row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {wh.avatar ? (
                                <img
                                  src={wh.avatar}
                                  alt={wh.name}
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-neutral-700"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                                  {wh.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                                    {wh.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    {wh.type}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                                    #{wh.channelName || wh.channelId}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  Created {new Date(wh.createdAt).toLocaleDateString()} by {wh.creatorName}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleSendTestPing(wh)}
                                disabled={pingingWebhookId === wh.id}
                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>{pingingWebhookId === wh.id ? 'Sending...' : 'Test Ping'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleViewLogs(wh.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center gap-1 ${
                                  selectedLogsWebhookId === wh.id
                                    ? 'bg-slate-700 text-white border-slate-600'
                                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-750'
                                }`}
                              >
                                <Activity className="w-3 h-3" />
                                <span>Logs</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteWebhook(wh.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 transition"
                                title="Delete Webhook"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* URL Field */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-slate-600 dark:text-neutral-400">
                                Webhook Ingest URL
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(fullUrl);
                                  setCopiedUrlId(wh.id);
                                  setTimeout(() => setCopiedUrlId(null), 2000);
                                }}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                {copiedUrlId === wh.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Copied URL!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy URL</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="px-2.5 py-1.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] break-all select-all flex items-center justify-between gap-2 border border-slate-800">
                              <span>{fullUrl}</span>
                            </div>
                          </div>

                          {/* Copy Curl Snippet */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                              {wh.secret ? `HMAC Secret: ${wh.secret.substring(0, 10)}...` : 'No secret required (token-authenticated)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(curlCmd);
                                setCopiedCurlId(wh.id);
                                setTimeout(() => setCopiedCurlId(null), 2000);
                              }}
                              className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1"
                            >
                              {copiedCurlId === wh.id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copied Curl!</span>
                                </>
                              ) : (
                                <>
                                  <Code className="w-3 h-3" />
                                  <span>Copy Sample curl</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Collapsible Delivery Logs */}
                          {selectedLogsWebhookId === wh.id && (
                            <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                                  Recent Delivery Audit Logs
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Showing last {webhookLogs.length} attempts
                                </span>
                              </div>

                              {loadingLogs ? (
                                <div className="text-[11px] text-slate-400 py-2">Loading logs...</div>
                              ) : webhookLogs.length === 0 ? (
                                <div className="text-[11px] text-slate-400 py-2 italic">
                                  No delivery attempts logged yet. Send a test ping!
                                </div>
                              ) : (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                  {webhookLogs.map((log) => (
                                    <div
                                      key={log.id}
                                      className="p-2 bg-white dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-750 text-[10px] flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-1.5 py-0.2 rounded font-bold ${
                                            log.status === 200
                                              ? 'bg-emerald-500/20 text-emerald-600'
                                              : 'bg-rose-500/20 text-rose-600'
                                          }`}
                                        >
                                          {log.status}
                                        </span>
                                        <span className="font-mono text-slate-700 dark:text-neutral-300">
                                          {log.event}
                                        </span>
                                        {log.error && (
                                          <span className="text-rose-500 font-mono">
                                            ({log.error})
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-400">
                                        <span>{log.durationMs}ms</span>
                                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Automation Rules Section */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Workflow Automation Rules Engine ({automationRules.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                    Event-driven rules triggering encrypted channel alerts and Kanban card status transitions.
                  </p>
                </div>

                <div className="space-y-2">
                  {automationRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                            {rule.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {rule.trigger}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                          {rule.actions.postMessage ? `Posts alert to #${rule.actions.postMessage.channelId || 'general'}` : ''}
                          {rule.actions.assignTo ? ` • Auto-assigns to ${rule.actions.assignTo}` : ''}
                          {rule.actions.updateStatus ? ` • Moves card to ${rule.actions.updateStatus}` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule)}
                        className={`p-1 transition ${
                          rule.isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-neutral-600'
                        }`}
                        title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 transition"
            >
              Cancel
            </button>

            {activeTab !== 'notifications' && activeTab !== 'sessions' && activeTab !== 'integrations' ? (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                {loading ? 'Saving Changes...' : 'Save Settings'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
