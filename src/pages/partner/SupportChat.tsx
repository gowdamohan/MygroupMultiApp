import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Clock, Plus, Headphones, Calculator, Settings } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

interface Message {
  id: number;
  message: string;
  sender_id: number;
  sender_type: 'partner' | 'admin' | 'accounts' | 'technical';
  created_at: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface Conversation {
  id: number;
  channel_type: 'admin' | 'accounts' | 'technical';
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  last_message_at: string;
}

type ChannelType = 'admin' | 'accounts' | 'technical';

export const SupportChat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatChannel, setNewChatChannel] = useState<ChannelType>('admin');
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/support/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'partner' }
      });
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/support/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessages(response.data.data.messages);
        // Mark as read
        await axios.post(`${API_BASE_URL}/support/conversations/${conversationId}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/support/conversations/${selectedConversation.id}/messages`,
        { message: inputMessage, sender_type: 'partner' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data]);
        setInputMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!newChatSubject.trim() || !newChatMessage.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/support/conversations`,
        {
          channel_type: newChatChannel,
          subject: newChatSubject,
          initial_message: newChatMessage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setShowNewChat(false);
        setNewChatSubject('');
        setNewChatMessage('');
        fetchConversations();
        setSelectedConversation(response.data.data);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const getChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case 'admin': return <Headphones className="w-4 h-4" />;
      case 'accounts': return <Calculator className="w-4 h-4" />;
      case 'technical': return <Settings className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: ChannelType) => {
    switch (channel) {
      case 'admin': return 'bg-blue-100 text-blue-700';
      case 'accounts': return 'bg-green-100 text-green-700';
      case 'technical': return 'bg-purple-100 text-purple-700';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Support Chat</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {(['admin', 'accounts', 'technical'] as ChannelType[]).map(channel => (
              <span key={channel} className={`px-2 py-1 text-xs rounded-full ${getChannelColor(channel)}`}>
                {channel}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getChannelIcon(conv.channel_type)}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getChannelColor(conv.channel_type)}`}>
                    {conv.channel_type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    conv.status === 'open' ? 'bg-green-100 text-green-700' :
                    conv.status === 'resolved' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {conv.status}
                  </span>
                </div>
                <p className="font-medium text-sm truncate">{conv.subject}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(conv.last_message_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                {getChannelIcon(selectedConversation.channel_type)}
                <span className="font-semibold">{selectedConversation.subject}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                const isOwnMessage = msg.sender_type === 'partner';
                return (
                  <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-4 py-2`}>
                      {!isOwnMessage && msg.sender && (
                        <p className="text-xs font-medium mb-1">
                          {msg.sender.first_name} ({msg.sender_type})
                        </p>
                      )}
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Start New Conversation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={newChatChannel}
                  onChange={(e) => setNewChatChannel(e.target.value as ChannelType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="admin">Admin Support</option>
                  <option value="accounts">Accounts</option>
                  <option value="technical">Technical Support</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  placeholder="Brief subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConversation}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

