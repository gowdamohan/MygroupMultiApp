import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, RefreshCw, Search, CheckCheck, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

interface Conversation {
  id: number;
  subject: string;
  channel_type: 'admin' | 'accounts' | 'technical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  partner?: { first_name: string; last_name: string; email: string };
}

interface Message {
  id: number;
  message: string;
  sender_type: 'partner' | 'support';
  created_at: string;
}

interface AppSupportChatProps {
  appId: string | undefined;
}

export const AppSupportChat: React.FC<AppSupportChatProps> = ({ appId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, [appId, filter]);
  useEffect(() => { if (selectedConversation) fetchMessages(selectedConversation.id); }, [selectedConversation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (appId) params.append('app_id', appId);
      if (filter !== 'all') params.append('status', filter);
      const response = await axios.get(`${API_BASE_URL}/support/admin/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally { setLoading(false); }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/support/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setMessages(response.data.data?.messages || response.data.data || []);
    } catch (error) { console.error('Error fetching messages:', error); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/support/conversations/${selectedConversation.id}/messages`,
        { message: newMessage, sender_type: 'support' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (error) { console.error('Error sending message:', error); }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedConversation) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE_URL}/support/conversations/${selectedConversation.id}/status`,
        { status }, { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedConversation({ ...selectedConversation, status: status as any });
      fetchConversations();
    } catch (error) { console.error('Error updating status:', error); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-white';
      case 'resolved': return 'bg-blue-500 text-white';
      case 'closed': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const filteredConversations = conversations.filter(conv =>
    !searchQuery || conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${conv.partner?.first_name} ${conv.partner?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (conv: Conversation) => {
    const f = conv.partner?.first_name?.[0] || '';
    const l = conv.partner?.last_name?.[0] || '';
    return (f + l).toUpperCase() || '?';
  };

  return (
    <div className="h-[calc(100vh-150px)] flex rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {/* Left Panel - Conversation List (WhatsApp style) */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] flex-col bg-white border-r border-gray-200`}>
        {/* Header */}
        <div className="bg-[#008069] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Chats</h2>
          <button onClick={fetchConversations} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search or start new chat" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#008069]" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 py-2 flex gap-2 bg-white border-b border-gray-100">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors capitalize ${
                filter === s ? 'bg-[#008069] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008069] mx-auto"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div key={conv.id} onClick={() => setSelectedConversation(conv)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? 'bg-[#f0f2f5]' : ''
                }`}>
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#54656f] font-semibold text-sm">{getInitials(conv)}</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-[15px] truncate">
                      {conv.partner?.first_name} {conv.partner?.last_name}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatTime(conv.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-gray-500 truncate">{conv.subject}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ml-2 ${getStatusColor(conv.status)}`}>
                      {conv.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area (WhatsApp style) */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#008069] px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSelectedConversation(null)} className="md:hidden p-1 rounded-full hover:bg-white/10">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                <span className="text-[#54656f] font-semibold text-sm">{getInitials(selectedConversation)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-[15px] truncate">
                  {selectedConversation.partner?.first_name} {selectedConversation.partner?.last_name}
                </h3>
                <p className="text-green-200 text-xs truncate">{selectedConversation.subject}</p>
              </div>
              <select value={selectedConversation.status} onChange={(e) => handleUpdateStatus(e.target.value)}
                className="px-2 py-1 text-xs bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none cursor-pointer">
                <option value="open" className="text-gray-900">Open</option>
                <option value="in_progress" className="text-gray-900">In Progress</option>
                <option value="resolved" className="text-gray-900">Resolved</option>
                <option value="closed" className="text-gray-900">Closed</option>
              </select>
            </div>

            {/* Messages Area with WhatsApp wallpaper */}
            <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4" style={{
              backgroundColor: '#efeae2',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}>
              {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                <div key={dateKey}>
                  {/* Date Separator */}
                  <div className="flex justify-center my-3">
                    <span className="bg-white/90 text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm font-medium">
                      {formatDate(msgs[0].created_at)}
                    </span>
                  </div>
                  {/* Messages for this date */}
                  {msgs.map((msg) => (
                    <div key={msg.id} className={`flex mb-1 ${msg.sender_type === 'support' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[65%] px-3 py-2 shadow-sm ${
                        msg.sender_type === 'support'
                          ? 'bg-[#d9fdd3] rounded-tl-lg rounded-bl-lg rounded-br-lg'
                          : 'bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg'
                      }`}>
                        <p className="text-[14.2px] text-gray-900 leading-[19px] whitespace-pre-wrap">{msg.message}</p>
                        <div className={`flex items-center gap-1 justify-end mt-1 -mb-0.5`}>
                          <span className="text-[11px] text-gray-500">{formatTime(msg.created_at)}</span>
                          {msg.sender_type === 'support' && (
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-end gap-2">
              <div className="flex-1 bg-white rounded-2xl px-4 py-2 flex items-end shadow-sm">
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Type a message"
                  rows={1}
                  className="flex-1 resize-none text-[15px] text-gray-900 placeholder-gray-500 focus:outline-none max-h-[100px] leading-[20px]"
                  style={{ minHeight: '20px' }}
                />
              </div>
              <button onClick={handleSendMessage}
                className="w-12 h-12 rounded-full bg-[#008069] flex items-center justify-center hover:bg-[#017561] transition-colors flex-shrink-0 shadow-sm">
                <Send className="w-5 h-5 text-white ml-0.5" />
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="text-center">
              <div className="w-[320px] mx-auto mb-8">
                <div className="w-24 h-24 rounded-full bg-[#dfe5e7] flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-[#54656f]" />
                </div>
              </div>
              <h3 className="text-[#41525d] text-3xl font-light mb-3">Support Chat</h3>
              <p className="text-[#667781] text-sm max-w-md mx-auto">
                Select a conversation from the list to start chatting with partners. Messages are end-to-end visible to support team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
