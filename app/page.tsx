import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HeroMotion, ParallaxMockup, ScrollReveal } from "@/components/landing-motion";

export const metadata: Metadata = {
  title: "Vendari - Business Management Software",
  description:
    "Run sales, inventory, expenses, customers, reporting, and team operations from one modern business dashboard.",
  alternates: {
    canonical: "https://www.vendari.name.ng",
  },
};
import { ConciergeOverview } from "@/components/concierge-content";
import {
  ArrowRight,
  AtSign,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Music2,
  Package,
  PanelLeft,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Sales", icon: ShoppingCart },
  { label: "Inventory", icon: Package },
  { label: "Customers", icon: Users },
  { label: "Reports", icon: BarChart3 },
  { label: "Purchases", icon: ClipboardList },
  { label: "Expenses", icon: Receipt },
  { label: "Settings", icon: Settings },
];

const pillars = [
  {
    number: "01",
    title: "Sales",
    icon: ShoppingCart,
    copy: "Record orders while the customer is still in front of you, without chasing details across notebooks or messages. Vendari keeps your sales history clear so you can see what is actually selling, when demand peaks, and where to put your attention next.",
  },
  {
    number: "02",
    title: "Inventory",
    icon: Package,
    copy: "Know what is on the shelf, what is moving, and what needs a reorder before a customer asks for it. Stock levels update as you work, giving you enough lead time to buy with intention instead of scrambling after a missed sale.",
  },
  {
    number: "03",
    title: "Reporting",
    icon: BarChart3,
    copy: "Turn raw sales and expense data into a decision you can act on. Vendari brings the useful numbers together, so you can spot a margin problem, understand a slow week, or decide which products deserve more of your cash.",
  },
  {
    number: "04",
    title: "Operations",
    icon: Store,
    copy: "See the whole business in one place: staff activity, purchases, expenses, customers, and sales. Fewer disconnected tools means less time reconciling records and more confidence that everyone is working from the same picture.",
  },
];

const features = [
  [
    "User-friendly interface",
    "Move from a sale to a stock check without needing a manual beside you.",
    LayoutDashboard,
  ],
  [
    "Secure & reliable",
    "Keep the records your business depends on protected and available when you need them.",
    LockKeyhole,
  ],
  [
    "Access anywhere anytime",
    "Check performance, stock, and daily activity from wherever the work takes you.",
    PanelLeft,
  ],
  [
    "Designed for scalability",
    "Add products, people, and locations without rebuilding your operating system.",
    Gauge,
  ],
  [
    "Save time & reduce errors",
    "Replace repeated data entry and end-of-day guesswork with one dependable record.",
    Zap,
  ],
  [
    "Built for growing businesses",
    "Start with what you need now and keep the same platform as the business gets bigger.",
    Store,
  ],
] as const;

const stages = [
  [
    "Just starting out",
    "Solo owner, one location",
    "Get sales, stock, and expenses out of your head and into a clear daily rhythm.",
  ],
  [
    "Growing team",
    "A few staff, multiple product lines",
    "Give everyone one shared place to record work and keep a closer eye on what is profitable.",
  ],
  [
    "Multi-location",
    "Several branches, shared visibility",
    "Compare activity across locations and see what needs attention without calling every branch.",
  ],
] as const;

function DashboardMockup() {
  return (
    <div className="motion-hover relative mx-auto w-full max-w-[920px] overflow-hidden rounded-xl border border-white/15 bg-ink-soft shadow-2xl shadow-ink/30 ring-1 ring-black/10">
      <div className="flex items-center gap-2 border-b border-white/10 bg-ink px-4 py-3 sm:px-5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-negative" />
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="h-2 w-2 rounded-full bg-positive" />
        </div>
        <span className="ml-2 text-[10px] font-medium tracking-[0.18em] text-white/40">
          VENDARI / OVERVIEW
        </span>
      </div>
      <div className="border-b border-warning/20 bg-warning/10 px-4 py-2 text-center text-[10px] font-semibold text-warning sm:px-5">
        Sample data for illustration
      </div>
      <div className="grid min-h-[430px] grid-cols-1 sm:grid-cols-[190px_1fr]">
        <aside
          className="hidden border-r border-white/10 bg-ink p-3 sm:block sm:p-4"
          aria-label="Dashboard preview navigation"
        >
          <div className="mb-8 flex items-center gap-2 px-2 text-sm font-semibold text-white">
            <Image
              src="/vendari-dark-blue-bg.png"
              alt="Vendari"
              width={104}
              height={104}
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="space-y-1">
            {navItems.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[10px] font-medium ${active ? "bg-white/10 text-white" : "text-white/45"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 bg-[#f7f9fc] p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-text-muted">
                Monday, 23 August 2026
              </p>
              <h3 className="font-display text-lg font-semibold text-ink">
                Good morning, Emmanuel
              </h3>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue/10 text-[10px] font-semibold text-blue">
              EA
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              ["Total Sales", "N1,284,500", "+18.4%", CircleDollarSign],
              ["Orders", "248", "+12.8%", ShoppingCart],
              ["Profit", "N384,220", "+9.6%", Wallet],
            ].map(([label, value, trend, Icon]) => (
              <div
                key={label as string}
                className="rounded-lg border border-border bg-surface p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-medium text-text-muted sm:text-[10px]">
                    {label as string}
                  </p>
                  <Icon className="hidden h-3.5 w-3.5 text-blue sm:block" />
                </div>
                <p className="mt-2 font-mono text-xs font-medium text-ink sm:text-base">
                  {value as string}
                </p>
                <p className="mt-1 text-[8px] font-medium text-positive sm:text-[9px]">
                  {trend as string}{" "}
                  <span className="text-text-muted">vs last month</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-lg border border-border bg-surface p-3 shadow-sm sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-medium text-text-muted">
                    Sales over time
                  </p>
                  <p className="font-mono text-sm font-medium text-ink">
                    N4,820,400
                  </p>
                </div>
                <span className="rounded bg-positive/10 px-1.5 py-1 text-[8px] font-medium text-positive">
                  +24.6%
                </span>
              </div>
              <svg
                className="mt-4 h-28 w-full"
                viewBox="0 0 420 120"
                role="img"
                aria-label="Sales trend rises through the month"
              >
                <path
                  d="M0 96 C35 89 48 94 71 77 S113 83 139 67 S177 72 203 51 S243 65 272 39 S314 51 340 28 S388 35 420 8"
                  fill="none"
                  stroke="#4683EC"
                  strokeWidth="3"
                />
                <path
                  d="M0 96 C35 89 48 94 71 77 S113 83 139 67 S177 72 203 51 S243 65 272 39 S314 51 340 28 S388 35 420 8 V120 H0Z"
                  fill="url(#chartFill)"
                  opacity=".12"
                />
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="1">
                    <stop stopColor="#4683EC" />
                    <stop offset="1" stopColor="#4954F1" />
                  </linearGradient>
                </defs>
                <path d="M0 112 H420" stroke="#E3E8F1" />
                <path
                  d="M0 78 H420 M0 44 H420"
                  stroke="#E3E8F1"
                  strokeDasharray="3 5"
                />
              </svg>
              <div className="flex justify-between text-[8px] text-text-muted">
                <span>1 Aug</span>
                <span>8 Aug</span>
                <span>15 Aug</span>
                <span>23 Aug</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[9px] font-medium text-text-muted">
                  Top products
                </p>
                <ChevronRight className="h-3 w-3 text-text-muted" />
              </div>
              <div className="space-y-3">
                {[
                  ["Premium Ankara", "N482,000"],
                  ["Leather Sandals", "N316,500"],
                  ["Gift Box Set", "N204,800"],
                  ["Cedar Candle", "N186,400"],
                ].map(([name, amount], index) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-blue/10 font-mono text-[8px] text-blue">
                      0{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[9px] font-medium text-ink">
                        {name}
                      </p>
                      <div className="mt-1 h-1 rounded-full bg-bg">
                        <div
                          className="h-1 rounded-full bg-brand-gradient"
                          style={{ width: `${92 - index * 15}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-[8px] text-text-secondary">
                      {amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-warning" />
              <p className="text-[9px] font-semibold text-ink">
                Low stock alerts
              </p>
              <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-[8px] font-medium text-warning">
                3 items
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-ink p-5 text-white shadow-xl shadow-ink/20 sm:p-7">
      <div className="absolute right-[-30px] top-[-40px] h-36 w-36 rounded-full border border-blue/30" />
      <div className="absolute right-[-8px] top-[-18px] h-24 w-24 rounded-full border border-violet/30" />
      <div className="relative flex items-center gap-2 text-blue">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          Vendari insight
        </span>
      </div>
      <p className="relative mt-6 max-w-md font-display text-xl font-semibold leading-snug sm:text-2xl">
        “You&apos;re selling out of Premium Ankara every 9 days, but reordering
        every 14.”
      </p>
      <div className="relative mt-6 grid gap-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
        <div>
          <p className="text-white/45">Computed from your real numbers</p>
          <p className="mt-1 font-mono text-white/80">
            Sales + stock + purchases
          </p>
        </div>
        <div>
          <p className="text-white/45">AI explanation</p>
          <p className="mt-1 text-white/80">
            Your current reorder cycle leaves 5 days exposed.
          </p>
        </div>
      </div>
    </div>
  );
}

function StorefrontShowcase() {
  return (
    <section className="relative overflow-hidden bg-bg px-5 py-20 sm:px-8 sm:py-28">
      <div className="absolute left-[-10rem] top-20 h-72 w-72 rounded-full bg-blue/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <ScrollReveal direction="left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">The standout move</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-[1.02] text-ink sm:text-6xl">
              Your business, its own online store — in minutes.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-text-secondary">
              Turn the inventory you already manage into a storefront customers can browse, trust, and share. No second catalog to maintain.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["01", "Inventory", "Your products and prices are ready to go."],
                ["02", "Auto-published store", "A branded shop appears with one clear link."],
                ["03", "Share anywhere", "Send it straight to customers on WhatsApp."],
              ].map(([number, title, copy], index) => (
                <div key={title} className="relative flex gap-3 border-l border-blue/25 pl-4">
                  <span className="font-mono text-xs text-blue">{number}</span>
                  <div><p className="font-display text-base font-semibold text-ink">{title}</p><p className="mt-1 text-sm leading-5 text-text-secondary">{copy}</p></div>
                  {index < 2 && <span className="absolute -bottom-3 left-[-3px] hidden h-6 border-l border-dashed border-blue/30 lg:block" />}
                </div>
              ))}
            </div>
            <Link href="/register" className="motion-hover mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2">Launch your storefront <ArrowRight className="h-4 w-4" /></Link>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.08}>
            <div className="relative mx-auto max-w-2xl">
              <div className="rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-modal)] sm:p-5">
                <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Sample storefront content</p>
                <div className="overflow-hidden rounded-xl border border-border bg-[#f7f9fc]">
                  <div className="flex items-center justify-between bg-ink px-4 py-3 text-white sm:px-5"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold">V</span><span className="text-xs font-semibold">Emmanuel&apos;s Store</span></div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70">Open today</span></div>
                  <div className="p-4 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue">Fresh arrivals</p><h3 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">Made for your everyday.</h3></div><Store className="h-7 w-7 text-blue" /></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["Premium Ankara", "₦18,500", "#4683EC"], ["Leather Sandals", "₦24,000", "#4954F1"], ["Gift Box Set", "₦12,500", "#0F1D3D"], ["Cedar Candle", "₦8,900", "#4683EC"], ["Daily Tote", "₦15,000", "#4954F1"], ["Silk Scarf", "₦9,500", "#0F1D3D"]].map(([name, price, color]) => <div key={name} className="overflow-hidden rounded-lg border border-border bg-surface"><div className="h-20 opacity-90" style={{ background: `linear-gradient(135deg, ${color}, #06122B)` }} /><div className="p-2.5"><p className="truncate text-xs font-semibold text-ink">{name}</p><p className="mt-1 font-mono text-xs font-semibold text-blue">{price}</p></div></div>)}</div><div className="mt-5 flex items-center justify-between rounded-lg bg-ink px-4 py-3 text-white"><span className="text-xs text-white/70">3 items in cart</span><span className="inline-flex items-center gap-2 text-xs font-semibold">View cart <ArrowRight className="h-3.5 w-3.5" /></span></div></div>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-2 w-44 rounded-2xl border border-border bg-surface p-3 shadow-[var(--shadow-modal)] sm:-right-8 sm:w-52"><div className="flex items-center gap-2 border-b border-border pb-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/15 text-xs font-bold text-[#25D366]">W</span><span className="text-[10px] font-semibold text-ink">WhatsApp</span></div><p className="mt-3 rounded-lg bg-[#25D366]/10 p-2 text-[10px] leading-4 text-ink">Shop with us online 👉 vendari.name.ng/s/emmanuel-store</p><p className="mt-2 text-right text-[9px] text-text-muted">10:42 AM</p></div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const accessToken = (await cookies()).get("vendari_access")?.value;

  if (accessToken) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-bg text-text-primary">
      <nav
        className="sticky top-0 z-40 border-b border-white/60 bg-surface/80 shadow-[0_8px_30px_rgb(6_18_43_/_4%)] backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            <Image
              src="/vendari-logo-png.png"
              alt="Vendari"
              width={144}
              height={144}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-text-secondary md:flex">
            <a
              href="#how-it-works"
              className="rounded-md transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              How it works
            </a>
            <a
              href="#features"
              className="rounded-md transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              Features
            </a>
            <a
              href="#businesses"
              className="rounded-md transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              For every business
            </a>
            <Link
              href="/about"
              className="rounded-md transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="motion-hover inline-flex items-center gap-2 rounded-md bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:text-sm"
            >
              Start now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative bg-surface px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="landing-mesh landing-mesh-one" aria-hidden="true" />
        <div className="landing-mesh landing-mesh-two" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <HeroMotion>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue/20 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Clarity for the work behind
                the work
              </p>
              <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.98] tracking-tight text-ink sm:text-7xl">
                Business operations.{" "}
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  Simplified.
                </span>
              </h1>
            </HeroMotion>
            <HeroMotion delay={0.08}>
              <p className="mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
                Vendari is the all-in-one platform that helps retailers and
                service businesses run sales, inventory, reporting, and
                day-to-day operations from a single, powerful interface — and
                tells you what your own numbers mean, in plain language, every
                day.
              </p>
            </HeroMotion>
            <HeroMotion delay={0.16}>
              <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
                <Link
                  href="/register"
                  className="motion-hover inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-gradient px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:flex-none sm:px-5"
                >
                  Start 5-day trial{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="motion-hover inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-ink px-4 py-3.5 text-center text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:flex-none sm:px-5"
                >
                  See how it works <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </HeroMotion>
          </div>
          <HeroMotion delay={0.24} className="mt-14 sm:mt-20">
            <ParallaxMockup><DashboardMockup /></ParallaxMockup>
          </HeroMotion>
        </div>
      </section>

      <ScrollReveal direction="left">
        <section
          id="how-it-works"
          className="border-y border-border bg-bg px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
              The problem
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
              Your business is telling you what is happening. It should not take
              detective work to listen.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary">
              Right now, too many business owners juggle a notebook, a
              spreadsheet, and guesswork to know if they are actually making
              money. They find out they are out of stock only when a customer
              asks, then spend the rest of the day piecing together what went
              wrong.
            </p>
          </div>
          <div className="mx-auto mt-14 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-12">
            {pillars.map(({ number, title, icon: Icon, copy }) => (
              <article
                key={title}
                className={`motion-hover rounded-xl border border-border bg-surface p-6 ${title === "Sales" ? "lg:col-span-5 lg:row-span-2" : title === "Inventory" ? "lg:col-span-7" : "lg:col-span-7"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-blue">{number}</span>
                  <Icon className="h-5 w-5 text-blue" />
                </div>
                <h3 className="mt-12 font-display text-xl font-semibold text-ink sm:text-2xl">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal direction="right" delay={0.04}>
        <section className="bg-ink px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
                The useful difference
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl">
                Your numbers, explained in plain language.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/65">
                Vendari does not just show you charts. Every day, it reads your
                own sales, inventory, and expense data, then points out what
                changed and why. You get a useful next question or decision, not
                another dashboard to stare at.
              </p>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
                The calculation comes from your real numbers. The AI adds the
                explanation, so you can see the difference between what Vendari
                computed and what it is helping you understand.
              </p>
            </div>
            <InsightCard />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.08}>
        <section
          id="features"
          className="bg-surface px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
                One place to run it all
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">
                Everything you need, all in one place.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:grid-rows-2">
              {features.map(([title, copy, Icon]) => (
                <article
                  key={title}
                  className={`motion-hover rounded-xl border border-border bg-surface p-6 sm:p-8 ${title === "User-friendly interface" ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5"}`}
                >
                  <Icon className="h-5 w-5 text-blue" />
                  <h3 className="mt-8 font-display text-lg font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal direction="left" delay={0.06}>
        <StorefrontShowcase />
      </ScrollReveal>

      <ScrollReveal>
        <section
          id="businesses"
          className="border-t border-border bg-bg px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
                  Room to grow
                </p>
                <h2 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-5xl">
                  Built for every size of business.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-text-secondary">
                Start with the work in front of you. Keep the same platform as
                your business finds its next shape.
              </p>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {stages.map(([title, label, copy], index) => (
                <article
                  key={title}
                  className="motion-hover relative rounded-xl border border-border bg-surface p-7"
                >
                  <span className="font-mono text-xs text-blue">
                    0{index + 1}
                  </span>
                  <h3 className="mt-10 font-display text-xl font-semibold text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {label}
                  </p>
                  <p className="mt-5 text-sm leading-6 text-text-secondary">
                    {copy} Vendari scales with you, so switching tools is not
                    part of the plan.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ConciergeOverview />

      <section id="faq" className="border-t border-border bg-bg px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Straight answers</p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">Questions worth asking before you trust a platform.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-text-secondary">No vague promises. Here is how Vendari handles the practical concerns that matter when your business records move online.</p>
          </div>
          <Accordion type="single" collapsible className="rounded-xl border border-border bg-surface px-5 sm:px-7">
            <AccordionItem value="safe"><AccordionTrigger className="text-left text-ink">Is my sales and business data safe?</AccordionTrigger><AccordionContent className="leading-6 text-text-secondary">Vendari sends authenticated requests over HTTPS and restricts business records to authorized business members. We do not sell your business data. You should still use a strong password, keep access private, and contact us if you suspect unauthorized access.</AccordionContent></AccordionItem>
            <AccordionItem value="payments"><AccordionTrigger className="text-left text-ink">Where does my customer&apos;s payment actually go?</AccordionTrigger><AccordionContent className="leading-6 text-text-secondary">For Paystack payments, the money goes to the business&apos;s own linked bank account through Paystack. Vendari never holds customer payment funds. Paystack handles the payment processing and settlement timing.</AccordionContent></AccordionItem>
            <AccordionItem value="stop"><AccordionTrigger className="text-left text-ink">What happens to my data if I stop paying?</AccordionTrigger><AccordionContent className="leading-6 text-text-secondary">Your subscription access can expire, which stops access to paid workspace features. Your records are not transferred to another business and we do not claim ownership of them. Contact Vendari before cancelling if you need an export or have a retention question.</AccordionContent></AccordionItem>
            <AccordionItem value="trial"><AccordionTrigger className="text-left text-ink">Is there really a free trial, and what happens after?</AccordionTrigger><AccordionContent className="leading-6 text-text-secondary">Yes. New businesses receive a 5-day trial of the Vendari membership. After the trial, you choose monthly or yearly billing to keep the workspace active. Pricing is shown on the <Link href="/pricing" className="font-semibold text-blue hover:underline">pricing page</Link>; there is no automatic claim that the service stays free.</AccordionContent></AccordionItem>
            <AccordionItem value="built"><AccordionTrigger className="text-left text-ink">Who built this?</AccordionTrigger><AccordionContent className="leading-6 text-text-secondary">Vendari is an independent product built by the Vendari team for retailers and service businesses. Read the <Link href="/about" className="font-semibold text-blue hover:underline">About page</Link> for the product&apos;s purpose and the people behind it.</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </section>

      <ScrollReveal>
        <section className="bg-brand-gradient px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                A clearer next day starts here
              </p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-white sm:text-6xl">
                Run your business smarter with Vendari.
              </h2>
              <p className="mt-5 text-lg font-medium text-white/85">
                One platform. Total control.
              </p>
              <p className="mt-1 text-sm text-white/70">
                Start free and build your business with clearer numbers and better daily decisions.
              </p>
            </div>
            <Link
              href="/register"
              className="motion-hover inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-semibold text-ink shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue"
            >
              Start your free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <footer className="bg-ink px-5 py-12 text-white sm:px-8 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src="/vendari-dark-blue-bg.png"
              alt="Vendari"
              width={144}
              height={144}
              className="h-9 w-auto object-contain"
            />
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
              Business operations, with less guesswork. One clear place for the
              work behind the work.
            </p>
            <a href="tel:09016615446" className="mt-5 inline-flex text-lg font-semibold text-white hover:text-blue">0901 661 5446</a>
            <p className="mt-1 text-xs text-white/45">Talk to the Vendari team</p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.tiktok.com/@vendari_ng?_r=1&_t=ZS-99dm8ICiMdT"
                target="_blank"
                rel="noreferrer"
                aria-label="Vendari on TikTok"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/65 transition-colors hover:border-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                <Music2 className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/vendarihq?s=11"
                target="_blank"
                rel="noreferrer"
                aria-label="Vendari on X"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/65 transition-colors hover:border-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                <AtSign className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Explore
            </p>
            <nav
              className="mt-4 flex flex-col items-start gap-3 text-sm text-white/65"
              aria-label="Footer navigation"
            >
              <a
                href="#features"
                className="transition-colors hover:text-white"
              >
                Features
              </a>
              <a
                href="#businesses"
                className="transition-colors hover:text-white"
              >
                For every business
              </a>
              <Link
                href="/register"
                className="transition-colors hover:text-white"
              >
                Become a member
              </Link>
              <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
              <Link href="/about" className="transition-colors hover:text-white">About Vendari</Link>
            </nav>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">
              Legal
            </p>
            <nav
              className="mt-4 flex flex-col items-start gap-3 text-sm text-white/65"
              aria-label="Legal navigation"
            >
              <Link
                href="/privacy"
                className="transition-colors hover:text-white"
              >
                Privacy policy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-white"
              >
                Terms and conditions
              </Link>
              <Link href="/dmca" className="transition-colors hover:text-white">
                DMCA policy
              </Link>
            </nav>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Vendari</p>
          <div className="flex flex-col gap-2 text-left sm:items-end"><a href="tel:09016615446" className="text-sm font-semibold text-white hover:text-blue">Call Vendari: 0901 661 5446</a><p>Built for retailers and service businesses.</p></div>
        </div>
      </footer>
    </main>
  );
}
