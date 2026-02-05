import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input } from '@repo/ui';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isThinking: boolean;
}

export default function AIAssistantPanel({
  messages,
  onSendMessage,
  isThinking,
}: AIAssistantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!inputValue.trim() || isThinking) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <Card title="AI Assistant" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 border rounded-md bg-gray-50 max-h-[calc(100vh-250px)]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-[85%] text-sm shadow-sm ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white self-end ml-auto rounded-br-none'
                : 'bg-white border text-gray-800 self-start mr-auto rounded-bl-none'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isThinking && (
          <div className="bg-white border text-gray-800 self-start mr-auto rounded-bl-none p-3 rounded-lg max-w-[85%] text-sm shadow-sm flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Ask AI related to allocation..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isThinking}
          />
        </div>
        <Button
          onClick={handleSend}
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isThinking}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}
