import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full px-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
