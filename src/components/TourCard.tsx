'use client'

import type { CardComponentProps } from 'onborda'

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const isLast = currentStep === totalSteps - 1

  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1.5px solid var(--ink)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        padding: '22px 24px',
        maxWidth: 340,
        minWidth: 300,
        position: 'relative',
        fontFamily: 'var(--font-sans, sans-serif)',
      }}
    >
      {arrow}

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--ink-3)',
          flexShrink: 0,
        }}>
          {String(currentStep + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(totalSteps).padStart(2, '0')}
        </div>
        <div style={{
          flex: 1, height: 5,
          background: 'var(--line-soft)',
          borderRadius: 999, overflow: 'hidden',
          border: '1px solid var(--ink)',
        }}>
          <div style={{
            height: '100%',
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
            background: 'var(--lime)',
            borderRadius: 999,
            transition: 'width 0.35s ease',
          }} />
        </div>
      </div>

      {/* Icon */}
      {step.icon && (
        <div style={{ fontSize: 30, lineHeight: 1, marginBottom: 10 }}>{step.icon}</div>
      )}

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-serif, serif)',
        fontSize: 22, lineHeight: 1.15,
        letterSpacing: '-0.01em',
        color: 'var(--ink)',
        margin: '0 0 10px',
      }}>
        {step.title}
      </h3>

      {/* Content */}
      <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>
        {step.content}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 8,
        marginTop: 20, alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {currentStep > 0 ? (
          <button
            onClick={prevStep}
            style={{
              padding: '8px 14px',
              border: '1.5px solid var(--ink)',
              borderRadius: 10, background: 'var(--paper-2)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: 'var(--ink-2)',
              transition: 'background 0.1s',
            }}
          >
            ← Quay lại
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={nextStep}
          style={{
            padding: '10px 20px',
            border: '1.5px solid var(--ink)',
            borderRadius: 10,
            background: isLast ? 'var(--lime)' : 'var(--ink)',
            color: '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            letterSpacing: '0.01em',
          }}
        >
          {isLast ? 'Bắt đầu học!' : 'Tiếp theo →'}
        </button>
      </div>
    </div>
  )
}
