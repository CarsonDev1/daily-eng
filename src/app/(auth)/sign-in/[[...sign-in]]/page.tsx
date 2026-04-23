'use client'

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
	return (
		<>
			<div style={{ textAlign: 'center', marginBottom: 8 }}>
				<h1
					style={{
						fontFamily: 'var(--font-serif, serif)',
						fontSize: 38,
						lineHeight: 1,
						color: 'var(--ink)',
						marginBottom: 6,
					}}
				>
					Welcome back to Daily <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>English</em>
				</h1>
				<p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sign in to continue your learning journey</p>
			</div>
			<SignIn />
		</>
	);
}
