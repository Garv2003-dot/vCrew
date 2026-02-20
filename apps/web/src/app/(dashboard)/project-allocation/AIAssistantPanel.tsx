'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ThinkingStep {
  agent: string;
  step: string;
  message: string;
  timestamp?: string;
}

interface AIAssistantPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isThinking: boolean;
  thinkingSteps?: ThinkingStep[];
  className?: string;
}

const SUGGESTION_CHIPS = [
  'Build a HIPAA-compliant patient engagement mobile app (iOS/Android). Frontend heavy. Need backend engineers, DevOps, QA, security/compliance lead, and a healthcare product manager. Create the team.',
  'Develop a remote patient monitoring platform for US providers. Requires mobile app + clinician dashboard. Need backend, data engineer, cloud architect, QA automation, regulatory consultant, and project manager. Form the team.',
  'Create a healthcare interoperability platform (FHIR-based) integrating with major US EHR systems. Need integration engineers, backend developers, DevOps, QA, solution architect, and technical program manager. Assemble the team.',
  'Build a US healthcare claims processing web application. Need backend engineers, frontend engineers, QA, business analyst with payer experience, compliance specialist, and project manager. Generate the team.',
  'Develop a telehealth platform for US clinics with video, scheduling, and billing. Need mobile engineers, backend engineers, DevOps, QA, UX designer, security engineer, and healthcare product manager. Create the team.',
];

export default function AIAssistantPanel({
  messages,
  onSendMessage,
  isThinking,
  thinkingSteps = [],
  className = '',
}: AIAssistantPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didInitialMount = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!didInitialMount.current) {
      didInitialMount.current = true;
      return;
    }
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = (msg?: string) => {
    const value = msg || inputValue.trim();
    if (!value || isThinking) return;
    onSendMessage(value);
    if (!msg) setInputValue('');
  };

  return (
    <div
      className={`flex flex-col bg-gradient-to-b from-white to-blue-100 rounded-2xl shadow-sm border border-gray-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Agentic AI</h3>
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="4" cy="10" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="16" cy="10" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex gap-2.5 items-start">
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V9a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 9v5.5"
                  />
                </svg>
              </div>
            )}
            <div
              className={`text-sm leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'ml-auto bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm'
                  : 'text-gray-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Suggestion chips - show after assistant message */}
        {messages.length > 0 &&
          messages[messages.length - 1]?.role === 'assistant' &&
          !isThinking && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all text-left max-w-sm whitespace-normal"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

        {isThinking && (
          <div className="space-y-2">
            {thinkingSteps.length > 0 ? (
              <div className="space-y-1.5">
                {thinkingSteps.map((s, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-start text-xs text-amber-800 bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-100"
                  >
                    <span className="font-mono font-medium text-amber-600 shrink-0">
                      {s.agent}
                    </span>
                    <span className="text-amber-700">{s.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V9a2.25 2.25 0 00-2.25-2.25H7.25A2.25 2.25 0 005 9v5.5"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 py-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full pl-4 pr-1.5 py-1.5 border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isThinking}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isThinking || !inputValue.trim()}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
