import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Clock, RefreshCw, X, User } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [appId, filter]);

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
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (appId) params.append('app_id', appId);
      if (filter !== 'all') params.append('status', filter);
      
      const response = await axios.get(`${API_BASE_URL}/support/admin/conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setConversations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
        setMessages(response.data.data?.messages || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/support/conversations/${selectedConversation.id}/messages`, {
        message: newMessage,
        sender_type: 'support'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedConversation) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${API_BASE_URL}/support/conversations/${selectedConversation.id}/status`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedConversation({ ...selectedConversation, status: status as any });
      fetchConversations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="h-[calc(100vh-150px)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Support Chat</h1>
        <button onClick={fetchConversations} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-4 h-[calc(100%-60px)]">
        {/* Conversations List */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="flex gap-2">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)} className={`px-2 py-1 text-xs rounded ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No conversations found</div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">{conv.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(conv.status)}`}>{conv.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">{conv.partner?.first_name} {conv.partner?.last_name}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{new Date(conv.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedConversation.subject}</h3>
                  <p className="text-sm text-gray-500">{selectedConversation.partner?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selectedConversation.status} onChange={(e) => handleUpdateStatus(e.target.value)} className="px-2 py-1 text-sm border rounded">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={() => setSelectedConversation(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'support' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender_type === 'support' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender_type === 'support' ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
