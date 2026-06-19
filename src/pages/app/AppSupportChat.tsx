import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { MessageSquare, Send, RefreshCw, Search, CheckCheck, ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

type BaseFilter = 'all' | 'unread' | 'shortlisted';

interface Partner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  registration_status?: string;
}

interface ChatGroup {
  id: number;
  app_id: number;
  name: string;
  key: string;
  created_at: string;
}

interface Conversation {
  id: number;
  subject: string;
  channel_type: 'admin' | 'accounts' | 'technical';
  channel?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending';
  created_at: string;
  last_message_at?: string | null;
  chat_group?: string | null;
  partner?: Partner;
  user?: Partner;
  unread_count?: number;
}

interface Message {
  id: number;
  message: string;
  sender_type: 'partner' | 'admin' | 'accounts' | 'technical' | 'system';
  created_at: string;
}

interface AppSupportChatProps {
  appId: string | undefined;
}

const POLL_MS = 4000;

const BASE_FILTERS: { id: BaseFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'shortlisted', label: 'Shortlisted' },
];

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatLastMessageDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (partner?: Partner) => {
  const f = partner?.first_name?.[0] || '';
  const l = partner?.last_name?.[0] || '';
  return (f + l).toUpperCase() || '?';
};

export const AppSupportChat: React.FC<AppSupportChatProps> = ({ appId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<number[]>([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const filterOptions = useMemo(
    () => [
      ...BASE_FILTERS,
      ...chatGroups.map(g => ({ id: g.key, label: g.name })),
    ],
    [chatGroups]
  );

  const fetchChatGroups = useCallback(async () => {
    if (!appId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/support/admin/chat-groups`, {
        headers: authHeaders(),
        params: { app_id: appId },
      });
      if (response.data.success) setChatGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching chat groups:', error);
    }
  }, [appId]);

  const fetchConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (appId) params.append('app_id', appId);
      params.append('channel', 'admin');
      if (filter !== 'all') params.append('filter', filter);

      const response = await axios.get(
        `${API_BASE_URL}/support/admin/conversations?${params}`,
        { headers: authHeaders() }
      );
      if (response.data.success) setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [appId, filter]);

  const fetchMessages = useCallback(async (conversationId: number, silent = false) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/support/conversations/${conversationId}/messages`,
        { headers: authHeaders() }
      );
      if (response.data.success) {
        setMessages(response.data.data?.messages || response.data.data || []);
      }
    } catch (error) {
      if (!silent) console.error('Error fetching messages:', error);
    }
  }, []);

  const markRead = useCallback(async (conversationId: number) => {
    try {
      await axios.post(
        `${API_BASE_URL}/support/conversations/${conversationId}/read`,
        {},
        { headers: authHeaders() }
      );
    } catch {
      /* non-critical */
    }
  }, []);

  const fetchPartnersForModal = useCallback(async () => {
    if (!appId) return;
    setLoadingPartners(true);
    setGroupError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/support/admin/partners`, {
        headers: authHeaders(),
        params: { app_id: appId },
      });
      if (response.data.success) setPartners(response.data.data || []);
    } catch {
      setGroupError('Failed to load partners.');
    } finally {
      setLoadingPartners(false);
    }
  }, [appId]);

  useEffect(() => { fetchChatGroups(); }, [fetchChatGroups]);
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    const interval = setInterval(() => fetchConversations(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedConversation.id);
    markRead(selectedConversation.id).then(() => fetchConversations(true));
  }, [selectedConversation?.id, fetchMessages, markRead, fetchConversations]);

  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => fetchMessages(selectedConversation.id, true), POLL_MS);
    return () => clearInterval(interval);
  }, [selectedConversation?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openGroupModal = () => {
    setGroupName('');
    setSelectedPartnerIds([]);
    setPartnerSearch('');
    setGroupError('');
    setShowGroupModal(true);
    fetchPartnersForModal();
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setGroupError('');
  };

  const togglePartnerSelection = (partnerId: number) => {
    setSelectedPartnerIds(prev =>
      prev.includes(partnerId) ? prev.filter(id => id !== partnerId) : [...prev, partnerId]
    );
  };

  const handleCreateGroup = async () => {
    if (!appId) return;
    const name = groupName.trim();
    if (!name) {
      setGroupError('Please enter a group name.');
      return;
    }
    if (selectedPartnerIds.length === 0) {
      setGroupError('Select at least one partner.');
      return;
    }

    setCreatingGroup(true);
    setGroupError('');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/support/admin/chat-groups`,
        {
          app_id: parseInt(appId, 10),
          name,
          partner_ids: selectedPartnerIds,
        },
        { headers: authHeaders() }
      );
      if (response.data.success) {
        const newKey = response.data.data?.key as string;
        await fetchChatGroups();
        await fetchConversations(true);
        if (newKey) setFilter(newKey);
        closeGroupModal();
      } else {
        setGroupError(response.data.message || 'Failed to create group.');
      }
    } catch (err: any) {
      setGroupError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await axios.post(
        `${API_BASE_URL}/support/conversations/${selectedConversation.id}/messages`,
        { message: newMessage, sender_type: 'admin' },
        { headers: authHeaders() }
      );
      setNewMessage('');
      fetchMessages(selectedConversation.id, true);
      fetchConversations(true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedConversation) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/support/conversations/${selectedConversation.id}/status`,
        { status },
        { headers: authHeaders() }
      );
      setSelectedConversation({ ...selectedConversation, status: status as Conversation['status'] });
      fetchConversations(true);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const partner = conv.user ?? conv.partner;
    return (
      conv.subject?.toLowerCase().includes(q) ||
      `${partner?.first_name} ${partner?.last_name}`.toLowerCase().includes(q) ||
      partner?.email?.toLowerCase().includes(q)
    );
  });

  const filteredPartners = partners.filter(p => {
    if (!partnerSearch.trim()) return true;
    const q = partnerSearch.toLowerCase();
    return (
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const activePartner = selectedConversation?.user ?? selectedConversation?.partner;

  return (
    <>
      <div className="h-[calc(100vh-150px)] flex rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] flex-col bg-white border-r border-gray-200`}>
          <div className="bg-mychat px-4 py-3 flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Chats</h2>
            <button
              onClick={() => { fetchConversations(); fetchChatGroups(); }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="px-3 py-2 bg-white border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-mychat"
              />
            </div>
          </div>

          <div className="px-3 py-2 flex items-center gap-2 bg-white border-b border-gray-100 overflow-x-auto">
            <div className="flex gap-2 flex-1 min-w-0">
              {filterOptions.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    filter === id
                      ? 'bg-mychat text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              title="Create New Group"
              className="w-8 h-8 rounded-full bg-violet-100 text-mychat hover:bg-violet-200 flex items-center justify-center flex-shrink-0 transition-colors"
              onClick={openGroupModal}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mychat mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const partner = conv.user ?? conv.partner;
                const lastAt = conv.last_message_at ?? conv.created_at;
                const unread = conv.unread_count ?? 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-mychat font-semibold text-sm">{getInitials(partner)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 text-[15px] truncate">
                          {partner ? `${partner.first_name} ${partner.last_name}` : 'Unknown Partner'}
                        </span>
                        <span className="text-[11px] text-gray-500 flex-shrink-0 text-right leading-tight">
                          {formatLastMessageDateTime(lastAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 gap-2">
                        <p className="text-sm text-gray-500 truncate">{conv.subject}</p>
                        {unread > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-mychat text-white text-[11px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedConversation ? (
            <>
              <div className="bg-mychat px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1 rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-mychat font-semibold text-sm">{getInitials(activePartner)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-[15px] truncate">
                    {activePartner
                      ? `${activePartner.first_name} ${activePartner.last_name}`
                      : selectedConversation.subject}
                  </h3>
                  <p className="text-violet-200 text-xs truncate">
                    {activePartner?.email ?? selectedConversation.subject}
                  </p>
                </div>
                <select
                  value={selectedConversation.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="px-2 py-1 text-xs bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="open" className="text-gray-900">Open</option>
                  <option value="in_progress" className="text-gray-900">In Progress</option>
                  <option value="resolved" className="text-gray-900">Resolved</option>
                  <option value="closed" className="text-gray-900">Closed</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4 bg-gradient-to-b from-violet-50/80 to-gray-50">
                {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <div className="flex justify-center my-3">
                      <span className="bg-white text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm font-medium border border-gray-100">
                        {formatDateLabel(msgs[0].created_at)}
                      </span>
                    </div>
                    {msgs.map((msg) => {
                      const isOutgoing = msg.sender_type !== 'partner';
                      return (
                        <div
                          key={msg.id}
                          className={`flex mb-1.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`relative max-w-[65%] px-3 py-2 shadow-sm rounded-lg ${
                              isOutgoing
                                ? 'bg-violet-100 text-gray-900 rounded-tl-lg rounded-bl-lg rounded-br-sm border border-violet-200/60'
                                : 'bg-white text-gray-900 rounded-tr-lg rounded-br-lg rounded-bl-sm border border-gray-100'
                            }`}
                          >
                            <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                            <div className="flex items-center gap-1 justify-end mt-1 -mb-0.5">
                              <span className={`text-[11px] ${isOutgoing ? 'text-violet-500' : 'text-gray-400'}`}>
                                {formatTime(msg.created_at)}
                              </span>
                              {isOutgoing && <CheckCheck className="w-4 h-4 text-violet-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-gray-50 px-4 py-3 flex items-end gap-2 border-t border-gray-200">
                <div className="flex-1 bg-white rounded-2xl px-4 py-2 flex items-end shadow-sm border border-gray-100">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message"
                    rows={1}
                    className="flex-1 resize-none text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none max-h-[100px] leading-[20px] bg-transparent"
                    style={{ minHeight: '20px' }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  className="w-12 h-12 rounded-full bg-mychat flex items-center justify-center hover:bg-violet-600 transition-colors flex-shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5 text-white ml-0.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-violet-50/50 to-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-mychat" />
                </div>
                <h3 className="text-gray-800 text-3xl font-light mb-3">Support Chat</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Select a conversation from the list to start chatting with partners. Admin channel conversations only.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
              <button
                type="button"
                onClick={closeGroupModal}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Priority Partners"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mychat focus:border-mychat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Partners ({selectedPartnerIds.length} selected)
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Search partners..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-mychat"
                  />
                </div>

                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {loadingPartners ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-mychat" />
                    </div>
                  ) : filteredPartners.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No partners found for this app.</p>
                  ) : (
                    filteredPartners.map(partner => {
                      const checked = selectedPartnerIds.includes(partner.id);
                      return (
                        <label
                          key={partner.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 hover:bg-violet-50/50 ${
                            checked ? 'bg-violet-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePartnerSelection(partner.id)}
                            className="rounded border-gray-300 text-mychat focus:ring-mychat"
                          />
                          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-mychat text-xs font-semibold">{getInitials(partner)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {partner.first_name} {partner.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{partner.email}</p>
                          </div>
                          {partner.registration_status && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize flex-shrink-0">
                              {partner.registration_status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {groupError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{groupError}</p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeGroupModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="px-4 py-2 text-sm font-medium text-white bg-mychat rounded-lg hover:bg-violet-600 disabled:opacity-50 flex items-center gap-2"
              >
                {creatingGroup && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
