'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-serif, serif)', fontSize: 38, lineHeight: 1, color: 'var(--ink)', marginBottom: 6 }}>
          Start your Daily <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>English</em> journey
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Create an account — it&apos;s free</p>
      </div>
      <SignUp />
    </>
  )
}
