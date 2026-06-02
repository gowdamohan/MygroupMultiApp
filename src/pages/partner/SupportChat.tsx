import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, Headphones, Calculator, Settings, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import {
  type SupportChannelType,
  SUPPORT_CHANNEL_OPTIONS,
  ADMIN_SUPPORT_APP_ID,
  SUPPORT_CHANNEL_APP_IDS,
  isPartnerApproved,
} from '../../config/supportChat.config';

interface ChatMessage {
  id: number;
  message: string;
  sender_type: string;
  created_at: string;
  is_own?: boolean;
  direction?: 'in' | 'out';
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface ChatSession {
  conversation_id: number;
  channel_type: SupportChannelType;
  app_id: number;
  status: string;
  channel_label: string;
  messages: ChatMessage[];
}

interface SupportChatProps {
  registrationStatus?: string;
}

const POLL_INTERVAL_MS = 4000;

const getChannelIcon = (channel: SupportChannelType) => {
  switch (channel) {
    case 'accounts':
      return <Calculator className="w-4 h-4" />;
    case 'technical':
      return <Settings className="w-4 h-4" />;
    default:
      return <Headphones className="w-4 h-4" />;
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const SupportChat: React.FC<SupportChatProps> = ({
  registrationStatus: registrationStatusProp,
}) => {
  const [registrationStatus, setRegistrationStatus] = useState(
    registrationStatusProp || 'pending'
  );
  const approved = isPartnerApproved(registrationStatus);

  const [channelType, setChannelType] = useState<SupportChannelType>('admin');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const appId = approved ? SUPPORT_CHANNEL_APP_IDS[channelType] : ADMIN_SUPPORT_APP_ID;
  const activeChannel = approved ? channelType : 'admin';
  const channelLabel =
    SUPPORT_CHANNEL_OPTIONS.find((c) => c.value === activeChannel)?.label || 'Admin Support';

  useEffect(() => {
    if (registrationStatusProp) {
      setRegistrationStatus(registrationStatusProp);
    }
  }, [registrationStatusProp]);

  useEffect(() => {
    if (!registrationStatusProp) {
      const fetchProfile = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await axios.get(`${API_BASE_URL}/partner/user-profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success && response.data.data.registration_status) {
            setRegistrationStatus(response.data.data.registration_status);
          }
        } catch {
          /* profile optional */
        }
      };
      fetchProfile();
    }
  }, [registrationStatusProp]);

  const loadMessages = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/chat-messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          channel_type: activeChannel,
          app_id: appId,
        },
      });
      if (response.data.success) {
        setSession(response.data.data);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      if (!silent) setError('Unable to load messages. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeChannel, appId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => loadMessages(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/admin/chat-messages`,
        {
          message: inputMessage.trim(),
          channel_type: activeChannel,
          app_id: appId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setInputMessage('');
        await loadMessages(true);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleChannelChange = (value: SupportChannelType) => {
    if (!approved) return;
    setChannelType(value);
  };

  const messages = session?.messages || [];
  const groupedMessages = messages.reduce(
    (groups: Record<string, ChatMessage[]>, msg) => {
      const dateKey = new Date(msg.created_at).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
      return groups;
    },
    {}
  );

  const statusLabel = session?.status?.replace('_', ' ') || 'open';

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[720px] rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-violet-600 px-4 py-3 flex flex-wrap items-center gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
            {getChannelIcon(activeChannel)}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-base truncate">{channelLabel}</h2>
            <p className="text-violet-200 text-xs capitalize">
              Status: {statusLabel}
              {!approved && ' · Pending approval'}
            </p>
          </div>
        </div>

        {approved ? (
          <div className="flex items-center gap-2">
            <label htmlFor="channel-type" className="text-violet-100 text-xs whitespace-nowrap">
              Channel Type
            </label>
            <select
              id="channel-type"
              value={channelType}
              onChange={(e) => handleChannelChange(e.target.value as SupportChannelType)}
              className="text-sm bg-white/15 text-white border border-white/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
            >
              {SUPPORT_CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
            Admin Support only
          </span>
        )}
      </div>

      {!approved && (
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Your account is not yet approved. You can message Admin Support only until your
            registration is approved.
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-sm border-b border-red-100">{error}</div>
      )}

      {/* Scrollable messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4"
        style={{
          backgroundColor: '#efeae2',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
            <MessageCircle className="w-14 h-14 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <div className="flex justify-center my-3">
                <span className="bg-white/90 text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm font-medium">
                  {formatDateLabel(msgs[0].created_at)}
                </span>
              </div>
              {msgs.map((msg) => {
                const isOwn =
                  msg.is_own === true ||
                  msg.direction === 'out' ||
                  msg.sender_type === 'partner';
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative max-w-[78%] sm:max-w-[65%] px-3 py-2 shadow-sm rounded-lg ${
                        isOwn
                          ? 'bg-[#8b5cf6] text-white rounded-tl-lg rounded-bl-lg rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-tr-lg rounded-bl-lg rounded-br-lg'
                      }`}
                    >
                      {!isOwn && msg.sender && (
                        <p className="text-[11px] font-semibold text-gray-600 mb-0.5">
                          {msg.sender.first_name} {msg.sender.last_name}
                        </p>
                      )}
                      <p className="text-[14px] leading-[19px] whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <div className="flex justify-end mt-0.5">
                        <span
                          className={`text-[10px] ${isOwn ? 'text-violet-200' : 'text-gray-500'}`}
                        >
                          {formatTime(msg.created_at)}
                        </span>
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

      {/* Fixed input bar */}
      <form
        onSubmit={handleSendMessage}
        className="sticky bottom-0 bg-[#f0f2f5] px-3 sm:px-4 py-3 border-t border-gray-200 flex items-end gap-2"
      >
        <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="w-full text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !inputMessage.trim()}
          className="w-12 h-12 rounded-full bg-[#8b5cf6] flex items-center justify-center hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
          aria-label="Send message"
        >
          <Send className="w-5 h-5 text-white ml-0.5" />
        </button>
      </form>
    </div>
  );
};
