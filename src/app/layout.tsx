import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { NavBar } from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Daily English',
	description: 'Your personal English learning journal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<body className={`${inter.className} min-h-screen`}>
				{/* Stars layer */}
				<div className='stars-layer' aria-hidden='true'>
					<div className='stars stars-sm' />
					<div className='stars stars-md' />
					<div className='stars stars-lg' />
				</div>
				{/* Nebula glows */}
				<div className='nebula-glow nebula-1' aria-hidden='true' />
				<div className='nebula-glow nebula-2' aria-hidden='true' />

				<Providers>
					<div className='relative z-10'>
						<NavBar />
						<main className='max-w-7xl mx-auto px-4 py-6'>{children}</main>
					</div>
					<Toaster richColors position='top-right' />
				</Providers>
			</body>
		</html>
	);
}
