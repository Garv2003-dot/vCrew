'use client';

import React, { useState } from 'react';
import {
  ProjectDemand,
  AllocationProposal,
  AgentMemoryEntry,
} from '@repo/types';
import { ENDPOINTS } from '../../../config/endpoints';
import AIAssistantPanel, { ChatMessage } from './AIAssistantPanel';
import ProjectRequirementsForm from './ProjectRequirementsForm';
import ProposedTeamPanel from './ProposedTeamPanel';

export default function ProjectAllocationPage() {
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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Project Allocation
          </h1>
          <p className="text-sm text-gray-500">
            Define requirements and let AI suggest the best team.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 h-[calc(100vh-140px)]">
        {/* Left Column: Dynamic Content with Transition */}
        <div className="h-full overflow-hidden relative">
          <div
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              allocationStage === 'FORM'
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <ProjectRequirementsForm
              onSubmit={handleGenerate}
              isLoading={isGenerating}
              initialValues={lastDemand}
            />
          </div>

          <div
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              allocationStage === 'RESULTS'
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0 pointer-events-none'
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

        {/* Right Column: AI Assistant (Persistent) */}
        <div className="h-full overflow-hidden">
          <AIAssistantPanel
            messages={messages}
            onSendMessage={handleChatInstruction}
            isThinking={isAgentThinking}
          />
        </div>
      </div>
    </div>
  );
}
