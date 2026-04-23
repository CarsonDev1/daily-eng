'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/axios'
import { Send, RotateCcw, Lightbulb } from 'lucide-react'

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

const SCENARIOS: Scenario[] = [
  { id: 'restaurant', label: 'Gọi món',    emoji: '🍽️', role: 'friendly waiter at Hudson\'s Café, a casual New York bistro',            context: 'The customer just sat down and is ready to order lunch',                                  starter: "Hi there! Welcome to Hudson's Café. I'm Jake, I'll be taking care of you today. Can I get you something to drink while you look over the menu?" },
  { id: 'interview',  label: 'Phỏng vấn', emoji: '💼', role: 'hiring manager at a mid-size tech startup in San Francisco',              context: 'Job interview for a software developer position — first round, 20 minutes',             starter: "Hey, come on in! Thanks for making the time. I'm Jake, the engineering manager. So — go ahead and tell me a bit about yourself and what drew you to this role." },
  { id: 'meeting',    label: 'Họp nhóm',  emoji: '🤝', role: 'team lead running a weekly project sync',                                  context: 'Virtual team meeting, reviewing Q4 deliverables, the user is a team member',           starter: "Alright, let's get rolling! Quick agenda today: Q4 progress, blockers, and next steps. [to you] Would you mind kicking us off with an update on your side?" },
  { id: 'directions', label: 'Hỏi đường', emoji: '🗺️', role: 'helpful local New Yorker on the street near Times Square',                context: 'The user looks lost and approaches to ask for directions',                             starter: "Hey, you look a little turned around! You need help finding somewhere?" },
  { id: 'shopping',   label: 'Mua sắm',   emoji: '🛒', role: 'friendly shop assistant at a mid-range clothing store in a Manhattan mall', context: 'The user just walked into the store and is browsing',                                  starter: "Hey, welcome in! Looking for anything specific today, or just browsing? We just got some new fall arrivals if you want to check them out." },
  { id: 'airport',    label: 'Sân bay',   emoji: '✈️', role: 'airline check-in staff at JFK Airport Terminal 4',                         context: 'The user is checking in for an international flight',                                  starter: "Good morning! Can I see your passport and booking reference, please? And are you checking any luggage today?" },
]

const SUGGESTIONS: Record<string, string[]> = {
  chat: ["What's the weather like?", "Tell me something interesting.", "Can you correct me?"],
  restaurant: ["I'd like a table for two.", "What do you recommend?", "I'm allergic to nuts."],
  interview: ["I have 3 years of experience.", "I work well in teams.", "What's the tech stack?"],
  meeting: ["Here's my update...", "I'm blocked on...", "Can we follow up later?"],
  directions: ["Where is the subway?", "How far is it?", "Is it walkable?"],
  shopping: ["I'm looking for a jacket.", "Do you have this in blue?", "What's the return policy?"],
  airport: ["I have one checked bag.", "Is there a delay?", "Can I upgrade my seat?"],
}

const FREE_CHAT_STARTER: Message = {
  id: 'init',
  role: 'assistant',
  content: "Hey! I just grabbed a latte — what are you having? So what's been going on with you lately? Anything exciting?",
  coaching: null,
}

function uid() { return Math.random().toString(36).slice(2) }

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-3)' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function ConversationPage() {
  const [mode,     setMode]     = useState<'chat' | 'roleplay'>('chat')
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<Message[]>([FREE_CHAT_STARTER])
  const [input,    setInput]    = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error,    setError]    = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const resetConversation = useCallback((newMode: 'chat' | 'roleplay', newScenario: Scenario | null) => {
    setMessages(newMode === 'chat' ? [FREE_CHAT_STARTER] : newScenario ? [{ id: 'init', role: 'assistant', content: newScenario.starter, coaching: null }] : [])
    setInput(''); setError(''); setIsTyping(false)
  }, [])

  const handleModeSwitch = (newMode: 'chat' | 'roleplay') => {
    setMode(newMode); setScenario(null); resetConversation(newMode, null)
  }

  const handleScenarioSelect = (s: Scenario) => {
    setScenario(s); resetConversation('roleplay', s)
  }

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isTyping) return
    const userMsg: Message = { id: uid(), role: 'user', content: msg }
    setMessages((prev) => [...prev, userMsg])
    setInput(''); setIsTyping(true); setError('')
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
    try {
      const { data } = await api.post<{ response: string; coaching: string | null }>('/conversation', {
        history, userMessage: msg, mode,
        role:    mode === 'roleplay' && scenario ? scenario.role    : undefined,
        context: mode === 'roleplay' && scenario ? scenario.context : undefined,
      })
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: data.response, coaching: data.coaching }])
    } catch {
      setError('Gửi thất bại. Thử lại nhé!')
    } finally {
      setIsTyping(false); inputRef.current?.focus()
    }
  }

  const suggestions = SUGGESTIONS[scenario?.id ?? 'chat'] ?? SUGGESTIONS.chat

  return (
    <div className="space-y-6" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div>
        <h1 className="page-h1" style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 42, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
          Talk it <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>out</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>AI conversation partner — instant grammar coaching</p>
      </div>

      <div className="prac-grid">
        {/* Left rail — mode + scenarios */}
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="mode-toggle">
            <button className={`m ${mode === 'chat' ? 'on' : ''}`} onClick={() => handleModeSwitch('chat')}>
              Free Chat
            </button>
            <button className={`m ${mode === 'roleplay' ? 'on' : ''}`} onClick={() => handleModeSwitch('roleplay')}>
              Role-play
            </button>
          </div>

          {/* Scenarios */}
          <AnimatePresence>
            {mode === 'roleplay' && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
                <p className="caps" style={{ fontSize: 9, color: 'var(--ink-3)', marginBottom: 8 }}>Pick a scenario</p>
                {SCENARIOS.map((s) => (
                  <div key={s.id} className={`scenario ${scenario?.id === s.id ? 'on' : ''}`} onClick={() => handleScenarioSelect(s)}>
                    <div className="emo">{s.emoji}</div>
                    <div>
                      <div className="t">{s.label}</div>
                      <div className="d">{s.role.split(' at ')[0]}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'chat' && (
            <div className="topic-hero">
              <div className="cap">Free Conversation</div>
              <div className="ttl">Jake</div>
              <div className="desc">Your friendly New York conversation partner. Ask anything, chat about life.</div>
              <div className="chips">
                <div className="ch">💡 Grammar coaching</div>
                <div className="ch">🗽 New York vibes</div>
              </div>
            </div>
          )}
        </div>

        {/* Right — chat shell */}
        <div className="chat-shell">
          {/* Top bar */}
          <div className="chat-top">
            <div className="chat-top-l">
              <div className="av">
                {mode === 'chat' ? '👨' : scenario ? scenario.emoji : '🎭'}
              </div>
              <div>
                <div className="who">
                  {mode === 'chat' ? 'Jake' : scenario ? scenario.role.split(' at ')[0] : 'Select a scenario'}
                </div>
                <div className="role">
                  {mode === 'chat' ? 'Free Chat' : scenario ? scenario.label : '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="status">
                <div className="d" />
                Online
              </div>
              <button onClick={() => resetConversation(mode, scenario)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px', borderRadius: 8, color: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                <RotateCcw style={{ width: 11, height: 11 }} /> Reset
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-scroll">
            {mode === 'roleplay' && !scenario && (
              <div style={{ margin: 'auto', textAlign: 'center', padding: 32 }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 10 }}>🎭</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>Pick a scenario on the left</p>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>AI will play the role and coach you in real-time</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`bubble ${msg.role === 'user' ? 'me' : 'them'}`}
                >
                  <div className="main">{msg.content}</div>
                </motion.div>
                {msg.coaching && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    style={{ maxWidth: '85%', marginTop: 4, borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'flex-start', gap: 7, background: 'rgba(255,217,61,0.1)', border: '1.5px solid rgba(255,217,61,0.35)' }}>
                    <Lightbulb style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2, color: 'var(--saffron)' }} />
                    <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{msg.coaching}</p>
                  </motion.div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="bubble them">
                <TypingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="chat-compose">
            <div className="suggest-row">
              {suggestions.map((s) => (
                <button key={s} className="s-chip" onClick={() => handleSend(s)}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={mode === 'roleplay' && !scenario ? 'Select a scenario first...' : 'Type your message… (Enter to send)'}
                disabled={isTyping || (mode === 'roleplay' && !scenario)}
                style={{
                  flex: 1, padding: '12px 14px', border: '1.5px solid var(--ink)', borderRadius: 12,
                  background: 'var(--paper-2)', minHeight: 50, maxHeight: 140, resize: 'none',
                  fontSize: 14, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                }}
              />
              <button
                className="c-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping || (mode === 'roleplay' && !scenario)}
                style={{ opacity: (!input.trim() || isTyping) ? 0.4 : 1 }}
              >
                <Send style={{ width: 14, height: 14 }} />
                Send
              </button>
            </div>
            {error && <p style={{ fontSize: 12, color: 'var(--coral)', textAlign: 'center', padding: '4px 0 0' }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
