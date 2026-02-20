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
import FullScreenLoader from './FullScreenLoader';

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
  const [thinkingSteps, setThinkingSteps] = useState<{ agent: string; step: string; message: string }[]>([]);
  const [lastDemand, setLastDemand] = useState<Partial<ProjectDemand>>({});
  const [agentMemory, setAgentMemory] = useState<AgentMemoryEntry[]>([]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello!\nHow can I assist you with your resource allocation?',
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
      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setProposal(data);
      setAllocationStage('RESULTS');
      setAllocationSource('FORM');
    } catch (e) {
      console.error('Failed to generate allocation', e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed to generate allocation'}` },
      ]);
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
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setIsAgentThinking(true);
    setThinkingSteps([]);

    try {
      let useStream = true;
      let res = await fetch(ENDPOINTS.ALLOCATION.AGENTIC_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentProposal: proposal,
          demand: lastDemand,
          loadingDemand: null,
          conversation: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        useStream = false;
        res = await fetch(ENDPOINTS.ALLOCATION.AGENTIC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            currentProposal: proposal,
            demand: lastDemand,
            loadingDemand: null,
            conversation: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
      }

      if (!res.ok) {
        throw new Error('Agent failed to process request');
      }

      if (!useStream || !res.body) {
        const data = await res.json();
        setThinkingSteps(data.thinkingSteps || []);
        setProposal(data.proposal ?? null);
        setAllocationStage('RESULTS');
        setAllocationSource('AI');
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message || "I've processed your request." }]);
        if (proposal && data.proposal) {
          setAgentMemory((prev) => [...prev, {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            userMessage: message,
            intent: { intentType: 'UNKNOWN' },
            changeSummary: data.message || '',
            beforeProposal: proposal,
            afterProposal: data.proposal,
          }]);
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: { proposal?: AllocationProposal; message?: string } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const block of events) {
          let eventType = '';
          let dataStr = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr = line.slice(6);
          }
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (eventType === 'thinking') {
              setThinkingSteps((prev) => [
                ...prev,
                { agent: data.agent || 'agent', step: data.step || '', message: data.message || '' },
              ]);
            } else if (eventType === 'result') {
              finalResult = data;
            } else if (eventType === 'error') {
              throw new Error(data.error || 'Unknown error');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (finalResult) {
        setProposal(finalResult.proposal ?? null);
        setAllocationStage('RESULTS');
        setAllocationSource('AI');
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: finalResult!.message || "I've processed your request." },
        ]);

        if (proposal && finalResult.proposal) {
          const memoryEntry: AgentMemoryEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            userMessage: message,
            intent: { intentType: 'UNKNOWN' },
            changeSummary: finalResult.message || '',
            beforeProposal: proposal,
            afterProposal: finalResult.proposal,
          };
          setAgentMemory((prev) => [...prev, memoryEntry]);
        }
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
      setThinkingSteps([]);
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
    setAgentMemory([]);
  };

  const undoLastChange = () => {
    setAgentMemory((prev) => {
      if (prev.length === 0) return prev;
      const lastEntry = prev.at(-1);
      if (!lastEntry) return prev;
      setProposal(lastEntry.beforeProposal);
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
    <div className="fixed inset-0 flex flex-col bg-gray-100 z-0 pt-16 pl-[216px]">
      {/* Full Screen Loader Overlay */}
      {isGenerating && <FullScreenLoader />}

      {/* Two-column layout */}
      <div className="flex-1 flex gap-6 p-6 lg:p-8 overflow-hidden">
        {/* Left: Main form / results area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="space-y-6">
            {/* Header with Title and Toggle */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Project Allocation
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Define requirements and let AI suggest the best team.
                </p>
              </div>
              <div className="flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setDemandMode('simple')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    demandMode === 'simple'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Simple Demand
                </button>
                <button
                  type="button"
                  onClick={() => setDemandMode('loading')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    demandMode === 'loading'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Loading Table
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="min-h-[calc(100vh-200px)] relative">
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

        {/* Right: AI Chat panel (always visible) */}
        <div className="w-96 shrink-0 hidden lg:flex flex-col">
          <AIAssistantPanel
            messages={messages}
            onSendMessage={handleChatInstruction}
            isThinking={isAgentThinking}
            thinkingSteps={thinkingSteps}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
