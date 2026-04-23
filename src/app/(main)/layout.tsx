import { NavBar } from '@/components/NavBar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10">
      <NavBar />
      <main className="main-inner max-w-[1360px] mx-auto px-4 sm:px-8 py-4 sm:py-6">{children}</main>
    </div>
  )
}
