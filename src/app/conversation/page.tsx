'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/axios'
import { Send, RotateCcw, Lightbulb, MessageSquare, Theater, User } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  coaching?: string | null
}

interface Scenario {
  id: string
  label: string
  emoji: string
  role: string
  context: string
  starter: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: 'restaurant',
    label: 'Gọi món',
    emoji: '🍽️',
    role: 'friendly waiter at Hudson\'s Café, a casual New York bistro',
    context: 'The customer just sat down and is ready to order lunch',
    starter: "Hi there! Welcome to Hudson's Café. I'm Jake, I'll be taking care of you today. Can I get you something to drink while you look over the menu?",
  },
  {
    id: 'interview',
    label: 'Phỏng vấn',
    emoji: '💼',
    role: 'hiring manager at a mid-size tech startup in San Francisco',
    context: 'Job interview for a software developer position — first round, 20 minutes',
    starter: "Hey, come on in! Thanks for making the time. I'm Jake, the engineering manager. So — go ahead and tell me a bit about yourself and what drew you to this role.",
  },
  {
    id: 'meeting',
    label: 'Họp nhóm',
    emoji: '🤝',
    role: 'team lead running a weekly project sync',
    context: 'Virtual team meeting, reviewing Q4 deliverables, the user is a team member',
    starter: "Alright, let's get rolling! Quick agenda today: Q4 progress, blockers, and next steps. [to you] Would you mind kicking us off with an update on your side?",
  },
  {
    id: 'directions',
    label: 'Hỏi đường',
    emoji: '🗺️',
    role: 'helpful local New Yorker on the street near Times Square',
    context: 'The user looks lost and approaches to ask for directions',
    starter: "Hey, you look a little turned around! You need help finding somewhere?",
  },
  {
    id: 'shopping',
    label: 'Mua sắm',
    emoji: '🛒',
    role: 'friendly shop assistant at a mid-range clothing store in a Manhattan mall',
    context: 'The user just walked into the store and is browsing',
    starter: "Hey, welcome in! Looking for anything specific today, or just browsing? We just got some new fall arrivals if you want to check them out.",
  },
  {
    id: 'airport',
    label: 'Sân bay',
    emoji: '✈️',
    role: 'airline check-in staff at JFK Airport Terminal 4',
    context: 'The user is checking in for an international flight',
    starter: "Good morning! Can I see your passport and booking reference, please? And are you checking any luggage today?",
  },
]

const FREE_CHAT_STARTER: Message = {
  id: 'init',
  role: 'assistant',
  content: "Hey! I just grabbed a latte — what are you having? So what's been going on with you lately? Anything exciting?",
  coaching: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--c-text-3)' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, agentName }: { msg: Message; agentName: string }) {
  const isUser = msg.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}
    >
      {/* Speaker label */}
      <span className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--c-text-3)' }}>
        {isUser ? 'You' : agentName}
      </span>

      {/* Bubble */}
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
        style={isUser ? {
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: 'white',
          borderBottomRightRadius: '6px',
        } : {
          background: 'var(--c-card)',
          border: '1px solid var(--c-card-border)',
          color: 'var(--c-text-1)',
          borderBottomLeftRadius: '6px',
        }}
      >
        {msg.content}
      </div>

      {/* Coaching note */}
      {msg.coaching && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-[85%] rounded-xl px-3.5 py-2.5 flex items-start gap-2"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.28)',
          }}
        >
          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
            {msg.coaching}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const [mode,       setMode]       = useState<'chat' | 'roleplay'>('chat')
  const [scenario,   setScenario]   = useState<Scenario | null>(null)
  const [messages,   setMessages]   = useState<Message[]>([FREE_CHAT_STARTER])
  const [input,      setInput]      = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const [error,      setError]      = useState('')

  const bottomRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Reset conversation when mode or scenario changes
  const resetConversation = useCallback((newMode: 'chat' | 'roleplay', newScenario: Scenario | null) => {
    if (newMode === 'chat') {
      setMessages([FREE_CHAT_STARTER])
    } else if (newScenario) {
      setMessages([{ id: 'init', role: 'assistant', content: newScenario.starter, coaching: null }])
    } else {
      setMessages([])
    }
    setInput('')
    setError('')
    setIsTyping(false)
  }, [])

  const handleModeSwitch = (newMode: 'chat' | 'roleplay') => {
    setMode(newMode)
    setScenario(null)
    resetConversation(newMode, null)
  }

  const handleScenarioSelect = (s: Scenario) => {
    setScenario(s)
    resetConversation('roleplay', s)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg: Message = { id: uid(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setError('')

    // Auto-reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Build history (no coaching notes — clean conversation context)
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const { data } = await api.post<{ response: string; coaching: string | null }>('/conversation', {
        history,
        userMessage: text,
        mode,
        role:    mode === 'roleplay' && scenario ? scenario.role    : undefined,
        context: mode === 'roleplay' && scenario ? scenario.context : undefined,
      })

      const aiMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: data.response,
        coaching: data.coaching,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setError('Gửi thất bại. Thử lại nhé!')
    } finally {
      setIsTyping(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const agentName = mode === 'chat'
    ? 'Jake'
    : scenario?.role.split(' ')[0] ?? 'Agent'

  const agentDesc = mode === 'chat'
    ? '🗽 New York · Your English conversation partner'
    : scenario
      ? `${scenario.emoji} ${scenario.label} · Role-play scenario`
      : 'Pick a scenario below'

  const S = { background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 pb-6">
      {/* Page title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🗣️</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text">Conversation Practice</h1>
            <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>
              Luyện hội thoại với AI · Sửa lỗi ngay lập tức
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {([
          { id: 'chat',     label: 'Free Chat',  icon: MessageSquare, color: '#a78bfa' },
          { id: 'roleplay', label: 'Role-play',  icon: Theater,       color: '#f59e0b' },
        ] as const).map(({ id, label, icon: Icon, color }) => {
          const active = mode === id
          return (
            <button
              key={id}
              onClick={() => handleModeSwitch(id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center"
              style={active ? {
                background: `${color}15`,
                border: `1px solid ${color}40`,
                color,
                boxShadow: `0 0 14px ${color}18`,
              } : {
                background: 'var(--c-card)',
                border: '1px solid var(--c-card-border)',
                color: 'var(--c-text-3)',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Scenario picker (role-play only) */}
      <AnimatePresence>
        {mode === 'roleplay' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="rounded-2xl p-4" style={S}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-text-3)' }}>
                Chọn tình huống
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {SCENARIOS.map((s) => {
                  const active = scenario?.id === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleScenarioSelect(s)}
                      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={active ? {
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.4)',
                        color: '#f59e0b',
                      } : {
                        background: 'var(--c-input-bg)',
                        border: '1px solid var(--c-input-border)',
                        color: 'var(--c-text-2)',
                      }}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-center leading-tight">{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character info bar */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={S}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
          style={{ background: 'var(--c-accent-bg)', border: '1px solid var(--c-accent-border)' }}
        >
          {mode === 'chat' ? '👨' : scenario ? scenario.emoji : '🎭'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--c-text-1)' }}>
            {mode === 'chat' ? 'Jake' : scenario ? `${scenario.role.split(' at ')[0].split(' at ')[0]}` : 'Select a scenario'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--c-text-3)' }}>{agentDesc}</p>
        </div>
        <button
          onClick={() => resetConversation(mode, scenario)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--c-text-3)', border: '1px solid var(--c-input-border)', background: 'var(--c-input-bg)' }}
          title="New conversation"
        >
          <RotateCcw className="w-3 h-3" /> New
        </button>
      </div>

      {/* Chat area */}
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ ...S, minHeight: '420px' }}
      >
        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-5 space-y-5"
          style={{ minHeight: '380px', maxHeight: '55vh' }}
        >
          {/* Empty state for role-play before scenario is picked */}
          {mode === 'roleplay' && !scenario && (
            <div className="h-full flex items-center justify-center text-center py-12">
              <div>
                <span className="text-4xl block mb-3">🎭</span>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text-2)' }}>Chọn một tình huống bên trên</p>
                <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>AI sẽ đóng vai và sửa lỗi ngay trong hội thoại</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} agentName={agentName} />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-start gap-1"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--c-text-3)' }}>
                {agentName}
              </span>
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', borderBottomLeftRadius: '6px' }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ borderTop: '1px solid var(--c-card-border)', background: 'var(--c-card)' }}>
          {error && (
            <p className="text-xs text-red-400 text-center py-1.5">{error}</p>
          )}
          <div className="flex items-end gap-2 p-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'roleplay' && !scenario
                    ? 'Select a scenario first...'
                    : 'Type your message… (Enter to send, Shift+Enter for new line)'
                }
                disabled={isTyping || (mode === 'roleplay' && !scenario)}
                rows={1}
                className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--c-input-bg)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--c-text-1)',
                  lineHeight: '1.5',
                  maxHeight: '160px',
                  overflow: 'auto',
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || (mode === 'roleplay' && !scenario)}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'var(--c-input-bg)',
                border: '1px solid var(--c-input-border)',
              }}
            >
              <Send className="w-4 h-4" style={{ color: input.trim() ? 'white' : 'var(--c-text-3)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div
        className="rounded-xl px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
        style={S}
      >
        {[
          { emoji: '💡', tip: 'Lỗi ngữ pháp sẽ được sửa nhẹ nhàng sau mỗi câu trả lời' },
          { emoji: '🎯', tip: 'Dùng từ đơn giản? AI gợi ý từ tự nhiên hơn cho bạn' },
          { emoji: '🔁', tip: 'Nhấn "New" để bắt đầu hội thoại mới bất cứ lúc nào' },
        ].map(({ emoji, tip }) => (
          <div key={tip} className="flex items-start gap-2">
            <span className="text-sm shrink-0">{emoji}</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)' }}>{tip}</p>
          </div>
        ))}
      </div>

      {/* User tip */}
      <div className="flex items-start gap-2 px-1">
        <User className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--c-text-3)' }} />
        <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
          <span className="font-semibold">Mẹo:</span> Nói thành tiếng khi gõ — ghi âm lại để nghe lại phát âm của bạn.
          Làm ít nhất 10 phút mỗi ngày để thấy kết quả sau 2 tuần.
        </p>
      </div>
    </div>
  )
}
