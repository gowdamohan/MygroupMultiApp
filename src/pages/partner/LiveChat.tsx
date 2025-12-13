import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Clock } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

export const LiveChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Hello! Welcome to partner support. How can I help you today?',
      sender: 'support',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulate support response
    setIsTyping(true);
    setTimeout(() => {
      const supportMessage: Message = {
        id: messages.length + 2,
        text: 'Thank you for your message. A support representative will respond shortly.',
        sender: 'support',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, supportMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Chat</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-4xl h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-primary-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Partner Support</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg p-3`}
              >
                <p className="text-sm">{message.text}</p>
                <div
                  className={`flex items-center gap-1 mt-1 text-xs ${
                    message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}
                >
                  <Clock size={12} />
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={20} />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Our support team is available Monday to Friday, 9 AM - 6 PM. 
          Messages sent outside business hours will be responded to on the next business day.
        </p>
      </div>
    </div>
  );
};

