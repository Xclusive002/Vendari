import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart3, TrendingUp, Package, PieChart, Zap, Lock } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Vendari</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-slate-600 hover:bg-slate-800 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-8">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Premium Business Management Software</span>
          </div>

          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Manage Your Business with{' '}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Confidence
            </span>
          </h2>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Vendari is a comprehensive business management solution designed for ambitious entrepreneurs. Track sales, manage inventory, and optimize operations - all in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/get-access-code">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Manage Business
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-slate-600 hover:bg-slate-800 text-white bg-transparent">
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
              <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Daily Sales Tracking</h3>
              <p className="text-slate-400">Monitor your sales performance in real-time with detailed daily records and analytics.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
              <Package className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Inventory Management</h3>
              <p className="text-slate-400">Keep track of your stock levels, reorder points, and supplier information effortlessly.</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur">
              <PieChart className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Profit & Loss Analysis</h3>
              <p className="text-slate-400">Get comprehensive insights into your expenses and profitability with advanced analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Free Access</h3>
          <p className="text-slate-400 mb-12">No credit card required. Get your access code in seconds.</p>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12 backdrop-blur">
            <div className="flex items-baseline justify-center gap-2 mb-8">
              <span className="text-5xl font-bold text-white">Free</span>
              <span className="text-slate-400">forever</span>
            </div>

            <ul className="space-y-4 mb-12 text-left max-w-md mx-auto">
              {['Daily sales tracking', 'Inventory management', 'Profit & loss reports', 'Business analytics dashboard', 'Full feature access', 'Unlimited usage'].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="/get-access-code">
              <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">© 2024 Vendari. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
