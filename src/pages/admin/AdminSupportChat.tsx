import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  ArrowLeft,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';
import { ADMIN_SUPPORT_APP_ID } from '../../config/supportChat.config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Conversation {
  id: number;
  subject: string;
  /** Backend aliases channel_type → channel for the admin list endpoint */
  channel_type: string;
  channel: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  last_message_at: string;
  /** Backend aliases partner → user for the admin list endpoint */
  user?: Partner;
  partner?: Partner;
  app_id?: number;
}

interface MessageSender {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Message {
  id: number;
  message: string;
  /** DB ENUM: 'partner' = incoming (left); 'admin' | 'accounts' | 'technical' | 'system' = outgoing (right) */
  sender_type: 'partner' | 'admin' | 'accounts' | 'technical' | 'system';
  sender_id: number;
  created_at: string;
  sender?: MessageSender;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';
type ChannelFilter = 'all' | 'admin' | 'accounts' | 'technical';

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_MS = 4000;

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatTime = (s: string) =>
  new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (s: string) => {
  const d = new Date(s);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatSidebarTime = (s: string) => {
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getInitials = (p?: Partner) =>
  p ? `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() : '?';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
  };
  return map[status] ?? 'bg-gray-100 text-gray-500';
};

const channelBadge = (ch: string) => {
  const map: Record<string, string> = {
    admin: 'bg-violet-100 text-violet-700',
    accounts: 'bg-orange-100 text-orange-700',
    technical: 'bg-sky-100 text-sky-700',
  };
  return map[ch] ?? 'bg-gray-100 text-gray-500';
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminSupportChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [search, setSearch] = useState('');
  const [convError, setConvError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  // ── Data loaders ────────────────────────────────────────────────────────────

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingConvs(true);
      setConvError('');
      try {
        const params = new URLSearchParams({ app_id: String(ADMIN_SUPPORT_APP_ID) });
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (channelFilter !== 'all') params.append('channel', channelFilter);

        const res = await axios.get(
          `${API_BASE_URL}/support/admin/conversations?${params}`,
          { headers: authHeaders() }
        );
        if (res.data.success) setConversations(res.data.data ?? []);
      } catch {
        if (!silent) setConvError('Unable to load conversations. Please refresh.');
      } finally {
        if (!silent) setLoadingConvs(false);
      }
    },
    [statusFilter, channelFilter]
  );

  const loadMessages = useCallback(async (convId: number, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/support/conversations/${convId}/messages`,
        { headers: authHeaders() }
      );
      if (res.data.success) {
        // getMessages returns { data: { messages: [...], total, page, totalPages } }
        setMessages(res.data.data?.messages ?? res.data.data ?? []);
      }
    } catch {
      /* silent fail on poll */
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }, []);

  const markRead = useCallback(async (convId: number) => {
    try {
      await axios.post(
        `${API_BASE_URL}/support/conversations/${convId}/read`,
        {},
        { headers: authHeaders() }
      );
    } catch {
      /* non-critical */
    }
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Poll conversation list
  useEffect(() => {
    const t = setInterval(() => loadConversations(true), POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // Load messages + mark read when a conversation is opened
  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    loadMessages(selected.id);
    markRead(selected.id);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll messages for the active conversation
  useEffect(() => {
    if (!selected) return;
    const t = setInterval(() => loadMessages(selected.id, true), POLL_MS);
    return () => clearInterval(t);
  }, [selected?.id, loadMessages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    try {
      await axios.post(
        `${API_BASE_URL}/support/conversations/${selected.id}/messages`,
        { message: input.trim(), sender_type: 'admin' },
        { headers: authHeaders() }
      );
      setInput('');
      await loadMessages(selected.id, true);
    } catch {
      /* show nothing — message stays in input */
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selected) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/support/conversations/${selected.id}/status`,
        { status },
        { headers: authHeaders() }
      );
      setSelected(prev => (prev ? { ...prev, status: status as Conversation['status'] } : null));
      loadConversations(true);
    } catch {
      /* non-critical */
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const filteredConvs = conversations.filter(conv => {
    if (!search) return true;
    const q = search.toLowerCase();
    const p = conv.user ?? conv.partner;
    return (
      conv.subject?.toLowerCase().includes(q) ||
      p?.first_name?.toLowerCase().includes(q) ||
      p?.last_name?.toLowerCase().includes(q) ||
      p?.email?.toLowerCase().includes(q)
    );
  });

  const groupedMsgs = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const k = new Date(msg.created_at).toDateString();
    if (!acc[k]) acc[k] = [];
    acc[k].push(msg);
    return acc;
  }, {});

  const activePartner = selected?.user ?? selected?.partner;
  const activeChannel = selected?.channel ?? selected?.channel_type ?? '';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-140px)] max-h-[820px] rounded-xl overflow-hidden shadow-lg border border-gray-200">

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <div
        className={`${
          selected ? 'hidden md:flex' : 'flex'
        } w-full md:w-[360px] flex-col bg-white border-r border-gray-200 flex-shrink-0`}
      >
        {/* Header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold text-base">Support Chat</h2>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
              App #{ADMIN_SUPPORT_APP_ID}
            </span>
          </div>
          <button
            onClick={() => loadConversations()}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Status filters */}
        <div className="px-3 py-2 flex gap-1.5 flex-wrap border-b border-gray-100 bg-white flex-shrink-0">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-0.5 text-xs rounded-full font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-[#075E54] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Channel filters */}
        <div className="px-3 py-2 flex gap-1.5 border-b border-gray-100 bg-white flex-shrink-0">
          {(['all', 'admin', 'accounts', 'technical'] as const).map(c => (
            <button
              key={c}
              onClick={() => setChannelFilter(c)}
              className={`px-2.5 py-0.5 text-xs rounded-full font-medium transition-colors ${
                channelFilter === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {convError}
            </div>
          )}

          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#075E54]" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 text-gray-200" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const p = conv.user ?? conv.partner;
              const ch = conv.channel ?? conv.channel_type;
              const isActive = selected?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    isActive ? 'bg-[#f0f2f5]' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#54656f] font-semibold text-sm">{getInitials(p)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-gray-900 text-[15px] truncate">
                        {p ? `${p.first_name} ${p.last_name}` : 'Unknown Partner'}
                      </span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                        {formatSidebarTime(conv.last_message_at ?? conv.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs text-gray-500 truncate">{conv.subject}</span>
                      <div className="flex gap-1 flex-shrink-0 ml-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${channelBadge(ch)}`}>
                          {ch}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusBadge(conv.status)}`}>
                          {conv.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════ CHAT AREA ═══════════════ */}
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {selected ? (
          <>
            {/* Chat header */}
            <div className="bg-[#075E54] px-4 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
              <button
                onClick={() => setSelected(null)}
                className="md:hidden p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                <span className="text-[#54656f] font-semibold text-sm">{getInitials(activePartner)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[15px] leading-tight truncate">
                  {activePartner
                    ? `${activePartner.first_name} ${activePartner.last_name}`
                    : selected.subject}
                </p>
                <p className="text-green-200 text-xs truncate">
                  {activePartner?.email ?? selected.subject}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {activeChannel && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${channelBadge(activeChannel)}`}>
                    {activeChannel}
                  </span>
                )}
                <select
                  value={selected.status}
                  onChange={e => handleStatusUpdate(e.target.value)}
                  className="text-xs bg-white/15 text-white border border-white/30 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="open" className="text-gray-900">Open</option>
                  <option value="in_progress" className="text-gray-900">In Progress</option>
                  <option value="resolved" className="text-gray-900">Resolved</option>
                  <option value="closed" className="text-gray-900">Closed</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 md:px-10 py-4"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075E54]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-3 text-gray-200" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start by sending a reply below</p>
                </div>
              ) : (
                Object.entries(groupedMsgs).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    {/* Date separator */}
                    <div className="flex justify-center my-3">
                      <span className="bg-white/90 text-gray-500 text-xs px-3 py-1 rounded-lg shadow-sm font-medium">
                        {formatDateLabel(msgs[0].created_at)}
                      </span>
                    </div>

                    {msgs.map(msg => {
                      // Any sender who isn't a partner is on the admin/support side → right
                      const isAdmin = msg.sender_type !== 'partner';

                      return (
                        <div
                          key={msg.id}
                          className={`flex mb-1.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`relative max-w-[70%] px-3 py-2 shadow-sm rounded-lg ${
                              isAdmin
                                ? 'bg-[#8b5cf6] text-white rounded-tl-lg rounded-bl-lg rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-tr-lg rounded-br-lg rounded-bl-sm'
                            }`}
                          >
                            {/* Sender name — only for incoming partner messages */}
                            {!isAdmin && msg.sender && (
                              <p className="text-[11px] font-semibold text-violet-600 mb-0.5">
                                {msg.sender.first_name} {msg.sender.last_name}
                              </p>
                            )}

                            <p className="text-[14px] leading-[19px] whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>

                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span
                                className={`text-[10px] ${
                                  isAdmin ? 'text-violet-200' : 'text-gray-400'
                                }`}
                              >
                                {formatTime(msg.created_at)}
                              </span>
                              {isAdmin && (
                                <CheckCheck className="w-3.5 h-3.5 text-violet-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form
              onSubmit={handleSend}
              className="bg-[#f0f2f5] px-3 sm:px-4 py-3 flex items-end gap-2 border-t border-gray-200 flex-shrink-0"
            >
              <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a reply..."
                  disabled={sending}
                  className="w-full text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="w-12 h-12 rounded-full bg-[#075E54] flex items-center justify-center hover:bg-[#065045] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 text-white ml-0.5" />
              </button>
            </form>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="text-center max-w-sm px-6">
              <div className="w-24 h-24 rounded-full bg-[#dfe5e7] flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-12 h-12 text-[#54656f]" />
              </div>
              <h3 className="text-[#41525d] text-2xl font-light mb-2">Support Chat</h3>
              <p className="text-[#667781] text-sm leading-relaxed">
                Select a conversation from the sidebar to view messages and reply to partners.
                All conversations are filtered to App #{ADMIN_SUPPORT_APP_ID}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
