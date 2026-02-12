'use client';

import React, { useState } from 'react';
import {
  ProjectDemand,
  AllocationProposal,
  AgentMemoryEntry,
  LoadingDemand,
} from '@repo/types';
import { ENDPOINTS } from '../../../config/endpoints';
import AIAssistantPanel, { ChatMessage } from './AIAssistantPanel';
import ProjectRequirementsForm from './ProjectRequirementsForm';
import LoadingForm from './LoadingForm';
import ProposedTeamPanel from './ProposedTeamPanel';

type DemandMode = 'simple' | 'loading';

export default function ProjectAllocationPage() {
  const [demandMode, setDemandMode] = useState<DemandMode>('simple');
  const [allocationStage, setAllocationStage] = useState<'FORM' | 'RESULTS'>(
    'FORM',
  );
  const [allocationSource, setAllocationSource] = useState<'FORM' | 'AI'>(
    'FORM',
  );
  const [proposal, setProposal] = useState<AllocationProposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [lastDemand, setLastDemand] = useState<Partial<ProjectDemand>>({});
  const [agentMemory, setAgentMemory] = useState<AgentMemoryEntry[]>([]);

  // Chat state lifted up
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI allocation assistant. You can ask me to create an allocation or refine an existing one.',
    },
  ]);
  const [chatOpen, setChatOpen] = useState(false);

  const handleGenerate = async (demand: ProjectDemand) => {
    setIsGenerating(true);
    setLastDemand(demand);

    try {
      const res = await fetch(ENDPOINTS.ALLOCATION.DEMAND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demand),
      });
      const data = await res.json();
      setProposal(data);
      setAllocationStage('RESULTS');
      setAllocationSource('FORM');
    } catch (e) {
      console.error('Failed to generate allocation', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadingGenerate = async (loading: LoadingDemand) => {
    setIsGenerating(true);
    setLastDemand(loading as unknown as ProjectDemand);

    try {
      const res = await fetch(ENDPOINTS.ALLOCATION.LOADING_DEMAND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loading),
      });
      const data = await res.json();
      setProposal(data);
      setAllocationStage('RESULTS');
      setAllocationSource('FORM');
    } catch (e) {
      console.error('Failed to generate allocation', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatInstruction = async (message: string) => {
    // 1. Update UI with user message
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsAgentThinking(true);

    try {
      const res = await fetch(ENDPOINTS.ALLOCATION.INSTRUCTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentProposal: proposal,
          demand: lastDemand,
          conversation: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Agent failed to process request');
      }

      const data = await res.json();

      setProposal(data.proposal);
      setAllocationStage('RESULTS');
      setAllocationSource('AI');

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);

      // Add to memory
      if (proposal) {
        // Only record if we had a previous proposal to compare against,
        // or if it's a new creation (previous might be null).
        // For simplicity, let's track every successful AI mutation.
        const memoryEntry: AgentMemoryEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userMessage: message,
          intent: {
            intentType: 'UNKNOWN', // We don't have raw intent here unless API returns it.
            // Ideally API should return the active intent.
            // For now, we'll leave it generic or update API to return it.
            // Let's rely on changeSummary for now.
          },
          changeSummary: data.message,
          beforeProposal: proposal,
          afterProposal: data.proposal,
        };
        setAgentMemory((prev) => [...prev, memoryEntry]);
      }
    } catch (e) {
      console.error('Agent Error:', e);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error processing your request.",
        },
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const handleApprove = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Allocation approved! Proceeding to next steps...',
      },
    ]);
  };

  const handleDiscard = () => {
    setProposal(null);
    setAllocationStage('FORM');
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Allocation discarded/cleared.' },
    ]);
    setAgentMemory([]); // Clear memory on discard
  };

  const undoLastChange = () => {
    setAgentMemory((prev) => {
      if (prev.length === 0) return prev;
      const lastEntry = prev.at(-1);

      if (!lastEntry) return prev;

      // Restore the state BEFORE the last change
      setProposal(lastEntry.beforeProposal);

      // Remove the last memory entry
      return prev.slice(0, -1);
    });

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '🔄 I reverted the last change.',
      },
    ]);
  };

  const handleEditAllocation = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Entering manual edit mode... (Feature coming soon)',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 z-0 pt-14 pl-20">
      {/* Full-screen content */}
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Project Allocation
              </h1>
              <p className="text-sm text-gray-500">
                Define requirements and let AI suggest the best team.
              </p>
            </div>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setDemandMode('simple')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  demandMode === 'simple'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Simple Demand
              </button>
              <button
                type="button"
                onClick={() => setDemandMode('loading')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  demandMode === 'loading'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Loading Table
              </button>
            </div>
          </div>

          {/* Full-width main content */}
          <div className="min-h-[calc(100vh-180px)] relative">
            <div
              className={`transition-opacity duration-500 ease-in-out ${
                allocationStage === 'FORM'
                  ? 'opacity-100'
                  : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            >
              {demandMode === 'loading' ? (
                <LoadingForm
                  onSubmit={handleLoadingGenerate}
                  isLoading={isGenerating}
                />
              ) : (
                <ProjectRequirementsForm
                  onSubmit={handleGenerate}
                  isLoading={isGenerating}
                  initialValues={lastDemand}
                />
              )}
            </div>

            <div
              className={`transition-opacity duration-500 ease-in-out ${
                allocationStage === 'RESULTS'
                  ? 'opacity-100'
                  : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            >
              <ProposedTeamPanel
                proposal={proposal}
                onEditRequirements={() => setAllocationStage('FORM')}
                allocationSource={allocationSource}
                onApprove={handleApprove}
                onDiscard={handleDiscard}
                onEditAllocation={handleEditAllocation}
                onUndo={undoLastChange}
                canUndo={agentMemory.length > 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating chat button - bottom right */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* AI Assistant slide-over */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setChatOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                AI Assistant
              </h2>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                aria-label="Close chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIAssistantPanel
                messages={messages}
                onSendMessage={handleChatInstruction}
                isThinking={isAgentThinking}
                className="h-full border-0 rounded-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
