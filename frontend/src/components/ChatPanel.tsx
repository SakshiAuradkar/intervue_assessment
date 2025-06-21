import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Send, MessageCircle, Trash2 } from 'lucide-react';
import { usePollStore } from '../store/pollStore';

interface ChatPanelProps {
  onClose: () => void;
  isTeacher?: boolean;
}

const ChatPanel = ({ onClose, isTeacher }: ChatPanelProps) => {
  const { chatMessages, sendMessage, studentName, clearChat } = usePollStore();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      if (isTeacher) {
        sendMessage(message.trim(), true);
        setMessage('');
      } else if (studentName) {
        sendMessage(message.trim(), false);
        setMessage('');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="w-80 h-96 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Chat</CardTitle>
          </div>
          <div className="flex items-center">
            {isTeacher && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="hover:bg-red-50 text-red-500 hover:text-red-600 mr-2"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    {msg.sender}
                  </span>
                  {msg.isTeacher && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      Teacher
                    </Badge>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className={`p-2 rounded-lg text-sm ${
                  msg.isTeacher 
                    ? 'bg-blue-50 border-l-2 border-blue-500' 
                    : 'bg-gray-50'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={200}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {message.length}/200 characters
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPanel;
