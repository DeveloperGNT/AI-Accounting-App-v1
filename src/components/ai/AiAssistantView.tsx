import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAccounting } from '../../context/AccountingContext';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { chatAi, clearChatError } from '../../features/ai/aiSlice';
import { formatINR } from '../../utils/formatters';

interface AiAssistantViewProps {
  navigate: (route: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actions?: { label: string; route: string }[];
  highlightData?: { label: string; value: string }[];
}

// Chat transcript is ephemeral UI state; the AI answers come from the real
// backend endpoint POST /organizations/{organizationId}/ai/chat via the
// chatAi thunk in features/ai/aiSlice. No canned/hardcoded financial replies.
export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ navigate }) => {
  const { currentOrg, metrics } = useAccounting();
  const dispatch = useAppDispatch();
  const activeOrganizationId = useAppSelector(
    (state) => state.organizations.activeOrganizationId,
  );
  const aiState = useAppSelector((state) => state.ai);

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello! I am your AI Accounting Co-pilot configured for **${currentOrg?.name ?? 'your organization'}** (FY ${currentOrg?.financialYear ?? ''}). Ask me anything about your ledgers, GST position, or receivables.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      highlightData: [
        { label: 'Active FY Revenue', value: formatINR(metrics.revenue, false) },
        { label: 'Net GST Payable', value: formatINR(metrics.gstNetPayable, false) },
        { label: 'Pending AI Audits', value: `${metrics.pendingReviewCount} items` },
      ],
      actions: [
        { label: 'Review Anomaly Flags', route: '/review' },
        { label: 'View GST Returns Hub', route: '/gst' },
      ],
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isTyping = aiState.chatStatus === 'loading';
  const chatError = aiState.chatError;

  const suggestedPrompts = [
    'Summarize my current GST liability and input tax credit',
    'How much do customers owe me right now?',
    'What expenses have been posted this financial year?',
    'Which invoices are still unpaid?',
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isTyping]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isTyping) return;
    if (!activeOrganizationId) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    dispatch(clearChatError());

    try {
      // Real backend AI endpoint — the organization id comes from the active
      // tenant and the Bearer token + x-organization-id headers are attached
      // by the shared apiClient interceptors.
      const response = await dispatch(
        chatAi({ organizationId: activeOrganizationId, query: text }),
      ).unwrap();

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: response.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // The rejected case sets ai.chatError; surfaced below the transcript.
    }
  };

  const handleDismissError = () => {
    dispatch(clearChatError());
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 text-white rounded-xs flex items-center justify-center">
              <Sparkles size={13} className="text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">
              AI Accounting Co-Pilot
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Natural language queries over your live accounting ledger
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xs">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Backend AI — tenant-scoped &amp; audited</span>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-mono uppercase text-slate-400 font-bold shrink-0">
          Suggested:
        </span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => void handleSend(p)}
            className="text-xs bg-white border border-slate-300 hover:border-slate-950 text-slate-700 hover:text-slate-950 px-3 py-1.5 rounded-xs font-medium whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white border border-slate-200 rounded-xs flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xs bg-slate-900 text-white flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                  AI
                </div>
              )}

              <div
                className={`max-w-xl rounded-xs p-4 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Highlight data if present */}
                {msg.highlightData && (
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 font-mono">
                    {msg.highlightData.map((h, i) => (
                      <div key={i} className="bg-white p-2 border border-slate-200 rounded-xs">
                        <div className="text-[10px] text-slate-500 uppercase">{h.label}</div>
                        <div className="font-bold text-slate-900 mt-0.5">{h.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick actions */}
                {msg.actions && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(act.route)}
                        className="bg-white border border-slate-300 hover:border-slate-900 text-slate-900 text-[11px] font-semibold px-2.5 py-1 rounded-xs flex items-center gap-1 transition-colors"
                      >
                        <span>{act.label}</span>
                        <ArrowRight size={11} />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[10px] text-slate-400 font-mono text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xs bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 font-mono text-xs font-bold">
                  U
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Loader2 size={14} className="animate-spin text-amber-500" />
              <span>Analyzing your ledger...</span>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {chatError && (
          <div className="px-6 py-2 bg-red-50 border-t border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertCircle size={13} />
              {chatError}
            </span>
            <button
              onClick={handleDismissError}
              className="p-0.5 hover:text-red-950"
              title="Dismiss"
            >
              <AlertCircle size={13} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="p-4 border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              activeOrganizationId
                ? 'Ask about cash, GST, receivables, anomalies…'
                : 'Select an organization to chat with your AI co-pilot'
            }
            disabled={!activeOrganizationId || isTyping}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-900 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || !activeOrganizationId || isTyping}
            className="bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-white p-2.5 rounded-xs transition-colors"
            title="Send"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Status footer */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
        <CheckCircle2 size={12} className="text-emerald-500" />
        <span>
          Answers are generated by the AI service from your organization's real accounting data.
        </span>
      </div>
    </div>
  );
};
