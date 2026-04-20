import BottomNav from '@/components/BottomNav'
import ChildrenGuard from '@/components/ChildrenGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
      <div className="max-w-[430px] mx-auto bg-white dark:bg-slate-900 min-h-screen relative shadow-xl dark:shadow-slate-900/50">
        <ChildrenGuard />
        <main className="pb-20">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
