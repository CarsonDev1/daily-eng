export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 24,
				padding: '40px 24px',
				background: 'var(--paper)',
			}}
		>
			{children}
		</div>
	);
}
