export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-lime/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-lime rounded-full animate-spin" />
        </div>
        <p className="text-[13px] text-sand/30 font-light">불러오는 중...</p>
      </div>
    </div>
  )
}