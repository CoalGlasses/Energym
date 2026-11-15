import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { OwnerAlertSettings, TrialLead, TrialLeadStatus } from '../utils/leadsStore';
import { SiteEditorPanel } from './SiteEditorPanel';

interface ChannelStatus {
  emailAlerts: boolean;
  ownerEmail: string;
  phonePush: boolean;
  ntfyTopic: string;
  phoneWhatsapp: boolean;
  whatsappPhone: string;
}

interface OwnerPortalModalProps {
  open: boolean;
  onClose: () => void;
}

const SESSION_STORAGE_KEY = 'energym_owner_passcode';
const DEFAULT_SUGGESTED_CHANNEL = 'energym-indore-877096';
const CALLMEBOT_BOT_PHONE = '+34 644 26 33 77';
const CALLMEBOT_ACTIVATION_TEXT = 'I allow callmebot to send me messages';

const STATUS_OPTIONS: { value: TrialLeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'visited', label: 'Visited' },
];

type FilterTab = 'all' | TrialLeadStatus;
type PortalView = 'leads' | 'alerts' | 'editor';

function formatLeadTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OwnerPortalModal({ open, onClose }: OwnerPortalModalProps) {
  const [passcodeInput, setPasscodeInput] = useState('');
  const [activePasscode, setActivePasscode] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeView, setActiveView] = useState<PortalView>('leads');
  const [leads, setLeads] = useState<TrialLead[]>([]);
  const [channels, setChannels] = useState<ChannelStatus | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);

  // Owner alert settings state (zero .env variables needed)
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('918770964099');
  const [callmebotApiKey, setCallmebotApiKey] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<'channel' | 'callmebot' | null>(null);

  const fetchPortalData = useCallback(async (passcode: string, quiet = false) => {
    if (!quiet) {
      setIsLoadingLeads(true);
    }
    setLeadsError(null);
    try {
      const [leadsRes, settingsRes] = await Promise.all([
        fetch('/api/trial-leads', {
          headers: { 'x-owner-passcode': passcode },
        }),
        fetch('/api/owner/alert-settings', {
          headers: { 'x-owner-passcode': passcode },
        }),
      ]);

      if (leadsRes.status === 401 || settingsRes.status === 401) {
        setActivePasscode('');
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        } catch {
          // Ignore storage errors
        }
        setAuthError('Session expired or passcode changed. Please sign in again.');
        return;
      }

      const leadsData = await leadsRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));

      if (!leadsRes.ok || !leadsData?.ok) {
        setLeadsError(
          typeof leadsData?.error === 'string'
            ? leadsData.error
            : 'Unable to load bookings right now.'
        );
        return;
      }

      setLeads(Array.isArray(leadsData.leads) ? (leadsData.leads as TrialLead[]) : []);
      if (leadsData.channels) {
        setChannels(leadsData.channels as ChannelStatus);
      }

      if (!quiet && settingsRes.ok && settingsData?.ok && settingsData?.settings) {
        const loaded = settingsData.settings as OwnerAlertSettings;
        setOwnerEmail(loaded.ownerEmail || '');
        setNtfyTopic(loaded.ntfyTopic || '');
        if (loaded.whatsappPhone) {
          setWhatsappPhone(loaded.whatsappPhone);
        }
        setCallmebotApiKey(loaded.callmebotApiKey || '');
      }
    } catch {
      if (!quiet) {
        setLeadsError('Network error while loading bookings.');
      }
    } finally {
      if (!quiet) {
        setIsLoadingLeads(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open || !activePasscode) return;
    void fetchPortalData(activePasscode);
  }, [open, activePasscode, fetchPortalData]);

  // Auto-refresh bookings every 15s while Owner Portal is open on Bookings tab
  useEffect(() => {
    if (!open || !activePasscode || activeView !== 'leads') return;
    const timer = window.setInterval(() => {
      void fetchPortalData(activePasscode, true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [open, activePasscode, activeView, fetchPortalData]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    const trimmed = passcodeInput.trim();
    if (!trimmed) {
      setAuthError('Please enter your owner passcode.');
      return;
    }

    setIsAuthenticating(true);
    try {
      const response = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setAuthError(
          typeof data?.error === 'string' ? data.error : 'Incorrect owner passcode.'
        );
        return;
      }

      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, trimmed);
      } catch {
        // Ignore storage errors
      }
      setActivePasscode(trimmed);
      setPasscodeInput('');
      if (data.channels) {
        setChannels(data.channels as ChannelStatus);
      }
    } catch {
      setAuthError('Network error while verifying passcode.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = () => {
    setActivePasscode('');
    setLeads([]);
    setAuthError(null);
    setLeadsError(null);
    setSettingsNotice(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: TrialLeadStatus) => {
    setBusyLeadId(leadId);
    setLeadsError(null);
    try {
      const response = await fetch(`/api/trial-leads/${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok || !data?.lead) {
        setLeadsError(typeof data?.error === 'string' ? data.error : 'Failed to update status.');
        return;
      }

      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? (data.lead as TrialLead) : lead))
      );
    } catch {
      setLeadsError('Network error while updating status.');
    } finally {
      setBusyLeadId(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    setBusyLeadId(leadId);
    setLeadsError(null);
    try {
      const response = await fetch(`/api/trial-leads/${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
        headers: {
          'x-owner-passcode': activePasscode,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setLeadsError(typeof data?.error === 'string' ? data.error : 'Failed to delete booking.');
        return;
      }

      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    } catch {
      setLeadsError('Network error while deleting booking.');
    } finally {
      setBusyLeadId(null);
    }
  };

  const saveAlertSettings = async (overrideNtfyTopic?: string): Promise<boolean> => {
    setIsSavingSettings(true);
    setSettingsNotice(null);
    try {
      const response = await fetch('/api/owner/alert-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          ownerEmail,
          ntfyTopic: overrideNtfyTopic !== undefined ? overrideNtfyTopic : ntfyTopic,
          whatsappPhone,
          callmebotApiKey,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setSettingsNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not save settings.',
        });
        return false;
      }

      if (data.channels) {
        setChannels(data.channels as ChannelStatus);
      }
      if (typeof data.settings?.ownerEmail === 'string') {
        setOwnerEmail(data.settings.ownerEmail);
      }
      if (typeof data.settings?.ntfyTopic === 'string') {
        setNtfyTopic(data.settings.ntfyTopic);
      }
      if (data.settings?.whatsappPhone) {
        setWhatsappPhone(data.settings.whatsappPhone);
      }
      setSettingsNotice({
        type: 'success',
        text: 'Settings saved! New trial bookings will automatically notify your configured channels.',
      });
      return true;
    } catch {
      setSettingsNotice({
        type: 'error',
        text: 'Network error while saving settings.',
      });
      return false;
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAndTestEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await saveAlertSettings();
    if (!saved) return;

    if (!ownerEmail.trim()) {
      return;
    }

    setIsTestingAlert(true);
    try {
      const response = await fetch('/api/owner/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          mode: 'email',
          ownerEmail,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setSettingsNotice({
          type: 'error',
          text:
            typeof data?.error === 'string'
              ? data.error
              : 'Saved, but could not send the test email right now.',
        });
        return;
      }

      setSettingsNotice({
        type: 'success',
        text:
          typeof data?.message === 'string'
            ? data.message
            : `Test email sent to ${ownerEmail.trim()}!`,
      });
    } catch {
      setSettingsNotice({
        type: 'error',
        text: 'Settings saved, but email test failed due to a network error.',
      });
    } finally {
      setIsTestingAlert(false);
    }
  };

  const handleTestNtfy = async () => {
    const topicToUse = ntfyTopic.trim() || DEFAULT_SUGGESTED_CHANNEL;
    const saved = await saveAlertSettings(topicToUse);
    if (!saved) return;

    setIsTestingAlert(true);
    try {
      const response = await fetch('/api/owner/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          mode: 'ntfy',
          ntfyTopic: topicToUse,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setSettingsNotice({
          type: 'error',
          text:
            typeof data?.error === 'string'
              ? data.error
              : 'Saved, but test notification could not be sent.',
        });
        return;
      }

      setSettingsNotice({
        type: 'success',
        text: `Test notification sent to "${topicToUse}"! Check your ntfy app now.`,
      });
    } catch {
      setSettingsNotice({
        type: 'error',
        text: 'Settings saved, but test failed due to a network error.',
      });
    } finally {
      setIsTestingAlert(false);
    }
  };

  const handleTestWhatsApp = async () => {
    const saved = await saveAlertSettings();
    if (!saved) return;

    setIsTestingAlert(true);
    try {
      const response = await fetch('/api/owner/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': activePasscode,
        },
        body: JSON.stringify({
          mode: 'whatsapp',
          whatsappPhone,
          callmebotApiKey,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        setSettingsNotice({
          type: 'error',
          text:
            typeof data?.error === 'string'
              ? data.error
              : 'Could not send test WhatsApp message.',
        });
        return;
      }

      setSettingsNotice({
        type: 'success',
        text:
          typeof data?.message === 'string'
            ? `${data.message} Check your WhatsApp now.`
            : 'Test WhatsApp message sent!',
      });
    } catch {
      setSettingsNotice({
        type: 'error',
        text: 'Network error while sending WhatsApp test.',
      });
    } finally {
      setIsTestingAlert(false);
    }
  };

  const handleCopyText = async (text: string, target: 'channel' | 'callmebot') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(target);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard errors in restricted contexts
    }
  };

  const filteredLeads =
    filter === 'all' ? leads : leads.filter((lead) => lead.status === filter);

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    visited: leads.filter((l) => l.status === 'visited').length,
  };

  const activeChannelSummary = channels?.emailAlerts
    ? `Email Alerts Active (${channels.ownerEmail})`
    : channels?.phonePush
      ? `Phone Push Active (${channels.ntfyTopic})`
      : channels?.phoneWhatsapp
        ? `WhatsApp Alerts Active (+${channels.whatsappPhone})`
        : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Owner Leads Portal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#1A1A1A] border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
            <h2 className="text-base font-semibold text-white truncate">
              Owner Leads Portal
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activePasscode && (
              <>
                <button
                  type="button"
                  onClick={() => void fetchPortalData(activePasscode)}
                  disabled={isLoadingLeads}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-medium text-[#A3A3A3] hover:text-white hover:border-[#22C55E] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoadingLeads ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-medium text-[#A3A3A3] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close owner portal"
              className="w-8 h-8 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#22C55E] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {!activePasscode ? (
            <form onSubmit={handleLogin} className="max-w-sm mx-auto py-6 space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-white">Sign in to view trial leads</h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  Every 1-day free trial booking is saved automatically here and can be emailed directly to the owner&apos;s inbox.
                </p>
              </div>

              <div>
                <label
                  htmlFor="owner-passcode"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Owner Passcode
                </label>
                <input
                  id="owner-passcode"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter passcode"
                  value={passcodeInput}
                  onChange={(e) => {
                    setPasscodeInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none transition-colors"
                />
                {authError && (
                  <p className="mt-2 text-xs font-medium text-white flex items-center gap-1.5">
                    <span aria-hidden="true" className="text-[#22C55E]">
                      !
                    </span>
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#22C55E] text-[#0A0A0A] font-semibold text-sm hover:bg-[#16A34A] disabled:opacity-70 transition-colors whitespace-nowrap cursor-pointer"
              >
                {isAuthenticating ? 'Verifying...' : 'Unlock Leads'}
              </button>
            </form>
          ) : (
            <>
              {/* Top Navigation Tabs + Alert Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2A]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('leads')}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                      activeView === 'leads'
                        ? 'bg-[#22C55E] text-[#0A0A0A] border-[#22C55E]'
                        : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
                    }`}
                  >
                    Trial Bookings ({counts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('alerts')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                      activeView === 'alerts'
                        ? 'bg-[#22C55E] text-[#0A0A0A] border-[#22C55E]'
                        : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Owner Alerts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('editor')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                      activeView === 'editor'
                        ? 'bg-[#22C55E] text-[#0A0A0A] border-[#22C55E]'
                        : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Photos &amp; Trainers</span>
                  </button>
                </div>

                {channels && (
                  <button
                    type="button"
                    onClick={() => setActiveView('alerts')}
                    className="text-xs text-left sm:text-right cursor-pointer hover:underline"
                  >
                    {activeChannelSummary ? (
                      <span className="text-[#22C55E] font-medium">{activeChannelSummary}</span>
                    ) : (
                      <span className="text-[#A3A3A3] hover:text-white">
                        Alerts: <span className="text-[#22C55E]">Set owner email</span>
                      </span>
                    )}
                  </button>
                )}
              </div>

              {activeView === 'leads' ? (
                <>
                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { key: 'all', label: 'All' },
                        { key: 'new', label: 'New' },
                        { key: 'contacted', label: 'Contacted' },
                        { key: 'visited', label: 'Visited' },
                      ] as const
                    ).map((tab) => {
                      const isActive = filter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                            isActive
                              ? 'bg-[#1A1A1A] text-white border-[#22C55E]'
                              : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
                          }`}
                        >
                          {tab.label} ({counts[tab.key]})
                        </button>
                      );
                    })}
                  </div>

                  {leadsError && (
                    <div
                      role="alert"
                      className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-xs font-medium text-white flex items-center gap-2"
                    >
                      <span aria-hidden="true" className="text-[#22C55E]">
                        !
                      </span>
                      <span>{leadsError}</span>
                    </div>
                  )}

                  {isLoadingLeads && leads.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[#A3A3A3]">
                      Loading trial bookings...
                    </p>
                  ) : filteredLeads.length === 0 ? (
                    <div className="py-10 text-center rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 space-y-1">
                      <p className="text-sm font-medium text-white">No bookings found</p>
                      <p className="text-xs text-[#A3A3A3]">
                        {filter === 'all'
                          ? 'New 1-day free trial submissions will appear here automatically.'
                          : `No bookings currently marked as "${filter}".`}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {filteredLeads.map((lead) => {
                        const isBusy = busyLeadId === lead.id;
                        return (
                          <li
                            key={lead.id}
                            className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-sm font-semibold text-white">
                                  {lead.name}
                                </span>
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-[#22C55E] hover:underline tabular-nums"
                                >
                                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{lead.phone}</span>
                                </a>
                              </div>

                              <p className="text-xs text-[#A3A3A3]">
                                <span className="text-white">{lead.goal}</span>
                                {' · '}
                                <span>{lead.preferredTime}</span>
                              </p>

                              <p className="text-[11px] text-[#A3A3A3] tabular-nums">
                                Booked {formatLeadTimestamp(lead.createdAt)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <label className="sr-only" htmlFor={`lead-status-${lead.id}`}>
                                Lead status for {lead.name}
                              </label>
                              <select
                                id={`lead-status-${lead.id}`}
                                value={lead.status}
                                disabled={isBusy}
                                onChange={(e) =>
                                  void handleStatusChange(
                                    lead.id,
                                    e.target.value as TrialLeadStatus
                                  )
                                }
                                className="rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-white focus:border-[#22C55E] focus:outline-none cursor-pointer"
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleDeleteLead(lead.id)}
                                aria-label={`Delete booking for ${lead.name}`}
                                className="w-8 h-8 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#22C55E] disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : activeView === 'alerts' ? (
                <form onSubmit={handleSaveAndTestEmail} className="space-y-4">
                  {/* Primary: Direct Owner Email Alerts (No Extra Apps) */}
                  <div className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4 sm:p-5 space-y-4">
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white">
                          Send Trial Details Directly to Owner&apos;s Email
                        </h3>
                        <p className="text-xs text-[#A3A3A3] leading-relaxed">
                          No extra apps, accounts, or keys needed. Enter the owner&apos;s email address below and click <span className="text-white">Save &amp; Send Test Email</span>.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="owner-email-input"
                        className="block text-xs font-medium text-white mb-2"
                      >
                        Owner Email Address
                      </label>
                      <input
                        id="owner-email-input"
                        type="email"
                        placeholder="e.g. energym.indore@gmail.com"
                        value={ownerEmail}
                        onChange={(e) => {
                          setOwnerEmail(e.target.value);
                          if (settingsNotice) setSettingsNotice(null);
                        }}
                        className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3.5 py-2.5 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
                      />
                      <p className="mt-2 text-[11px] text-[#A3A3A3] leading-relaxed">
                        First time only: after clicking <span className="text-white">Save &amp; Send Test Email</span>, open that inbox and click the one-time <span className="text-white">Activate Form</span> link from FormSubmit. Every trial booking after that arrives in your email automatically.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={isSavingSettings || isTestingAlert}
                        onClick={() => void saveAlertSettings()}
                        className="px-4 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-semibold text-white hover:border-[#22C55E] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isSavingSettings ? 'Saving...' : 'Save Email'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSettings || isTestingAlert || !ownerEmail.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#22C55E] text-[#0A0A0A] text-xs font-semibold hover:bg-[#16A34A] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {isTestingAlert ? 'Sending...' : 'Save & Send Test Email'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {settingsNotice && (
                    <div
                      role="status"
                      className={`rounded-md bg-[#1A1A1A] border px-4 py-3 text-xs font-medium text-white flex items-start gap-2 ${
                        settingsNotice.type === 'success'
                          ? 'border-[#22C55E]'
                          : 'border-[#2A2A2A]'
                      }`}
                    >
                      {settingsNotice.type === 'success' ? (
                        <CheckCircle2
                          className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <span aria-hidden="true" className="text-[#22C55E] font-bold">
                          !
                        </span>
                      )}
                      <span>{settingsNotice.text}</span>
                    </div>
                  )}

                  {/* Optional Alternative 1: Instant Phone Push via ntfy */}
                  <details className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                    <summary className="text-xs font-semibold text-[#A3A3A3] hover:text-white cursor-pointer select-none">
                      Optional: Instant Phone Push Notification (via free ntfy app)
                    </summary>

                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-[#A3A3A3] leading-relaxed">
                        Want a phone buzz in 1 second with a <span className="text-white">Call Visitor</span> button? Install{' '}
                        <a
                          href={`https://ntfy.sh/${encodeURIComponent(ntfyTopic || DEFAULT_SUGGESTED_CHANNEL)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#22C55E] hover:underline inline-flex items-center gap-1"
                        >
                          <span>ntfy</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>{' '}
                        and subscribe to this private channel name:
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="owner-ntfy-topic"
                          type="text"
                          placeholder={DEFAULT_SUGGESTED_CHANNEL}
                          value={ntfyTopic}
                          onChange={(e) => {
                            setNtfyTopic(e.target.value);
                            if (settingsNotice) setSettingsNotice(null);
                          }}
                          className="flex-1 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopyText(ntfyTopic || DEFAULT_SUGGESTED_CHANNEL, 'channel')
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-medium text-[#A3A3A3] hover:text-white cursor-pointer whitespace-nowrap"
                        >
                          {copiedId === 'channel' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copy Name</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isSavingSettings || isTestingAlert}
                          onClick={() => void handleTestNtfy()}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-medium text-white hover:border-[#22C55E] cursor-pointer whitespace-nowrap"
                        >
                          Save &amp; Test Push
                        </button>
                      </div>
                    </div>
                  </details>

                  {/* Optional Alternative 2: WhatsApp Bot via CallMeBot */}
                  <details className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4">
                    <summary className="text-xs font-semibold text-[#A3A3A3] hover:text-white cursor-pointer select-none">
                      Optional: WhatsApp Bot via CallMeBot (if CallMeBot replies later)
                    </summary>

                    <div className="mt-4 space-y-4">
                      <p className="text-xs text-[#A3A3A3] leading-relaxed">
                        If CallMeBot ({CALLMEBOT_BOT_PHONE}) replies later to{' '}
                        <code className="text-white">{CALLMEBOT_ACTIVATION_TEXT}</code>, paste your code here:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="owner-whatsapp-phone"
                            className="block text-xs font-medium text-white mb-1.5"
                          >
                            Owner WhatsApp Number
                          </label>
                          <input
                            id="owner-whatsapp-phone"
                            type="tel"
                            placeholder="918770964099"
                            value={whatsappPhone}
                            onChange={(e) => {
                              setWhatsappPhone(e.target.value);
                              if (settingsNotice) setSettingsNotice(null);
                            }}
                            className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white focus:border-[#22C55E] focus:outline-none tabular-nums"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="owner-callmebot-key"
                            className="block text-xs font-medium text-white mb-1.5"
                          >
                            CallMeBot Code (if received)
                          </label>
                          <input
                            id="owner-callmebot-key"
                            type="text"
                            placeholder="e.g. 123456"
                            value={callmebotApiKey}
                            onChange={(e) => {
                              setCallmebotApiKey(e.target.value);
                              if (settingsNotice) setSettingsNotice(null);
                            }}
                            className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white focus:border-[#22C55E] focus:outline-none tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopyText(CALLMEBOT_ACTIVATION_TEXT, 'callmebot')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-medium text-[#A3A3A3] hover:text-white cursor-pointer"
                        >
                          {copiedId === 'callmebot' ? 'Copied Message' : 'Copy Activation Text'}
                        </button>
                        <button
                          type="button"
                          disabled={isSavingSettings || isTestingAlert}
                          onClick={() => void handleTestWhatsApp()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-medium text-white hover:border-[#22C55E] cursor-pointer"
                        >
                          Test WhatsApp Code
                        </button>
                      </div>
                    </div>
                  </details>
                </form>
              ) : (
                <SiteEditorPanel passcode={activePasscode} open={open} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
