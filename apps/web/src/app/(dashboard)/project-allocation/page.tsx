'use client';

import React, { useState, useEffect, useRef } from 'react';
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

/** Only one of these is active at a time: Roles (add rows or multiline), Loading table, or Free text (chat). */
type DemandMode = 'roles' | 'loading' | 'freetext';

export default function ProjectAllocationPage() {
  const [demandMode, setDemandMode] = useState<DemandMode>('roles');
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
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const mainContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mainContentRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

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
    setThinkingSteps([]);
    try {
      const res = await fetch(ENDPOINTS.ALLOCATION.DEMAND_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demand),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalProposal: AllocationProposal | null = null;

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
              finalProposal = data.proposal ?? null;
            } else if (eventType === 'error') {
              throw new Error(data.error || 'Stream error');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (finalProposal) {
        setProposal(finalProposal);
        setAllocationStage('RESULTS');
        setAllocationSource('FORM');
      }
    } catch (e) {
      console.error('Failed to generate allocation', e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed to generate allocation'}` },
      ]);
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
    }
  };

  const handleLoadingGenerate = async (loading: LoadingDemand) => {
    setIsGenerating(true);
    setLastDemand(loading as unknown as ProjectDemand);
    setThinkingSteps([]);

    try {
      const res = await fetch(ENDPOINTS.ALLOCATION.LOADING_DEMAND_STREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loading),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalProposal: AllocationProposal | null = null;

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
              finalProposal = data.proposal ?? null;
            } else if (eventType === 'error') {
              throw new Error(data.error || 'Stream error');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (finalProposal) {
        setProposal(finalProposal);
        setAllocationStage('RESULTS');
        setAllocationSource('FORM');
      }
    } catch (e) {
      console.error('Failed to generate allocation', e);
      setToast('Failed to generate allocation. Please try again.');
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
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
    setToast('Allocation approved and added.');
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Allocation approved! Proceeding to next steps...',
      },
    ]);
  };

  /** Clear allocation: reset proposal, stage, messages, lastDemand, and agent memory so next request gives unique results. */
  const handleDiscard = () => {
    setProposal(null);
    setAllocationStage('FORM');
    setLastDemand({});
    setAgentMemory([]);
    setMessages([
      {
        role: 'assistant',
        content: 'Allocation cleared. You can start a new request with roles, loading table, or Agentic AI.',
      },
    ]);
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
    <div className="flex flex-col flex-1 min-h-0 bg-gray-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium shadow-lg animate-in fade-in duration-200">
          {toast}
        </div>
      )}

      {/* Full Screen Loader Overlay */}
      {isGenerating && <FullScreenLoader thinkingSteps={thinkingSteps} />}

      {/* Two-column layout – no fixed pl; Layout main already has responsive padding for sidebar */}
      <div className="flex-1 flex gap-6 p-6 lg:p-8 overflow-hidden min-h-0">
        {/* Main form / results area (single column; chat inline when Agentic AI) */}
        <div
          ref={mainContentRef}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden"
          style={{ overflowAnchor: 'none' }}
        >
          <div className="space-y-6">
            {/* Header: Title + 3 modes (only one active at a time) */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Project Allocation
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Use one: Roles (add rows or multiline), Loading table, or Agentic AI (chat).
                </p>
              </div>
              <div className="flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setDemandMode('roles')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    demandMode === 'roles'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Roles
                </button>
                <button
                  type="button"
                  onClick={() => setDemandMode('loading')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    demandMode === 'loading'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Loading Table
                </button>
                <button
                  type="button"
                  onClick={() => setDemandMode('freetext')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    demandMode === 'freetext'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Agentic AI
                </button>
              </div>
            </div>

            {/* Content: roles/loading form, or Agentic AI chat inline; no right-side chat */}
            <div className="min-h-[calc(100vh-220px)] relative flex flex-col">
              <div
                className={`flex-1 flex flex-col min-h-0 transition-opacity duration-500 ease-in-out ${
                  allocationStage === 'FORM'
                    ? 'opacity-100'
                    : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              >
                {demandMode === 'loading' && (
                  <LoadingForm
                    onSubmit={handleLoadingGenerate}
                    isLoading={isGenerating}
                  />
                )}
                {demandMode === 'roles' && (
                  <ProjectRequirementsForm
                    onSubmit={handleGenerate}
                    isLoading={isGenerating}
                    initialValues={lastDemand}
                  />
                )}
                {demandMode === 'freetext' && (
                  <div className="flex-1 min-h-[400px] flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <AIAssistantPanel
                      messages={messages}
                      onSendMessage={handleChatInstruction}
                      isThinking={isAgentThinking}
                      thinkingSteps={thinkingSteps}
                      className="flex-1 min-h-0"
                    />
                  </div>
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
      </div>
    </div>
  );
}
