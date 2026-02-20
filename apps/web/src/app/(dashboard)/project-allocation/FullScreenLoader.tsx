'use client';

import React, { useState, useEffect } from 'react';

export interface LoaderThinkingStep {
  agent: string;
  step: string;
  message: string;
}

const LOADING_MESSAGES = [
  'Analyzing project requirements...',
  'Scanning employee database...',
  'Evaluating skills and availability...',
  'Optimizing team composition...',
  'Balancing workload distribution...',
  'Finalizing allocation proposal...',
];

interface FullScreenLoaderProps {
  thinkingSteps?: LoaderThinkingStep[];
}

export default function FullScreenLoader({ thinkingSteps = [] }: FullScreenLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative flex flex-col items-center p-8 bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Animated AI Brain/Spinner */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent animate-spin"></div>
          <div className="absolute inset-4 rounded-full border-4 border-t-transparent border-r-cyan-500 border-b-transparent border-l-cyan-500 animate-spin-reverse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-600 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Text Content or Agent Logs */}
        <div className="text-center space-y-2 w-full min-h-0 flex flex-col">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 shrink-0">
            AI is thinking
          </h3>
          {thinkingSteps.length > 0 ? (
            <div className="space-y-1.5 overflow-y-auto max-h-48 text-left mt-2 pr-1">
              {thinkingSteps.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start text-xs text-amber-800 bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-100"
                >
                  <span className="font-mono font-medium text-amber-600 shrink-0">
                    {s.agent}
                  </span>
                  <span className="text-amber-700 break-words">{s.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-6 overflow-hidden">
              <p className="text-gray-500 animate-fade-in-up" key={messageIndex}>
                {LOADING_MESSAGES[messageIndex]}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-100 rounded-full mt-4 overflow-hidden shrink-0">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-progress origin-left w-full"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-progress {
          animation: progress 2s infinite linear;
        }
      `}</style>
    </div>
  );
}
