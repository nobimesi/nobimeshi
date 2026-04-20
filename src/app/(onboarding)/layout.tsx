export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[430px] mx-auto min-h-screen relative">
        {children}
      </div>
    </div>
  )
}
