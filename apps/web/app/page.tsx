import type { Metadata } from "next";
import {
  Calendar,
  CalendarPlus,
  Share2,
  CheckCircle2,
  Code2,
  Clock,
  Bell,
  Users,
  BarChart2,
  Zap,
  Check,
  X as XIcon,
} from "lucide-react";
import PricingSection from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "BookingKit — Drop-In Scheduling for Your SaaS",
  description:
    "Add Calendly-style booking to your app in under 5 minutes. Embeddable scheduling widget for indie SaaS. Starting at $9/mo.",
  keywords: [
    "scheduling",
    "booking",
    "calendly alternative",
    "SaaS",
    "widget",
    "appointment",
    "calendar",
  ],
  openGraph: {
    title: "BookingKit — Drop-In Scheduling for Your SaaS",
    description:
      "Add Calendly-style booking to your app in under 5 minutes. No credit card required.",
    url: "https://bookingkit.threestack.io",
    siteName: "BookingKit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookingKit — Drop-In Scheduling for Your SaaS",
    description:
      "Add Calendly-style booking to your app in under 5 minutes. No credit card required.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BookingKit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "9.00",
    priceCurrency: "USD",
  },
  description:
    "Drop-in scheduling widget for indie SaaS. Embeddable booking pages with custom availability.",
};

const steps = [
  {
    icon: CalendarPlus,
    title: "Create Calendar",
    desc: "Set your availability and preferences",
  },
  {
    icon: Share2,
    title: "Share Link",
    desc: "Send your booking link or embed the widget",
  },
  {
    icon: CheckCircle2,
    title: "Get Booked",
    desc: "Attendees book, you get notified",
  },
];

const features = [
  {
    icon: Code2,
    title: "Embeddable Widget",
    desc: "Drop into any app with one script tag",
  },
  {
    icon: Clock,
    title: "Custom Availability",
    desc: "Set complex availability rules",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    desc: "Email reminders sent automatically",
  },
  {
    icon: Users,
    title: "Team Calendars",
    desc: "Share calendars with your team",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Track booking rates and trends",
  },
  {
    icon: Zap,
    title: "No-Code Setup",
    desc: "No engineering required",
  },
];

const comparisonRows = [
  { feature: "Price", bk: "$9/mo", cal: "$12-16/mo" },
  { feature: "Custom branding", bk: true, cal: "Paid plans only" },
  { feature: "API access", bk: true, cal: "Paid plans only" },
  { feature: "Widget embed", bk: true, cal: "Paid plans only" },
  { feature: "Self-hosted option", bk: true, cal: false },
  { feature: "Unlimited calendars", bk: true, cal: "Paid" },
];

const testimonials = [
  {
    quote: "Finally a Calendly alternative that doesn't cost a fortune.",
    name: "Sarah K.",
    role: "founder of DevMetrics",
    initials: "SK",
  },
  {
    quote: "Integrated in 5 minutes, customers love it.",
    name: "Marcus T.",
    role: "founder of LaunchPad",
    initials: "MT",
  },
  {
    quote: "The $9/mo price is unbeatable for what you get.",
    name: "Priya M.",
    role: "founder of FlowTools",
    initials: "PM",
  },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true)
    return <Check className="mx-auto h-5 w-5 text-emerald-400" />;
  if (value === false)
    return <XIcon className="mx-auto h-5 w-5 text-slate-500" />;
  return <span>{value}</span>;
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-500" />
            <span className="text-lg font-bold text-emerald-500">
              BookingKit
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-slate-400 hover:text-white"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-400 hover:text-white"
            >
              Pricing
            </a>
            <a href="#" className="text-sm text-slate-400 hover:text-white">
              Docs
            </a>
          </div>
          <a
            href="/signup"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Get Started Free
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
            Now in public beta — $9/mo
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Drop-In Scheduling for Your SaaS
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Add Calendly-style booking to your app in under 5 minutes. No credit
            card required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="/signup"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Start Free
            </a>
            <a
              href="#features"
              className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              See Demo
            </a>
          </div>

          {/* Browser mockup */}
          <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-xl border border-slate-700 bg-[#1e293b]">
            <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="ml-4 flex-1 rounded bg-slate-800 px-3 py-1 text-xs text-slate-500">
                bookingkit.threestack.io/dashboard
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3">
                {["128", "12", "5", "32m"].map((v, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-[#0f172a] p-3 text-center"
                  >
                    <p className="text-lg font-bold text-white">{v}</p>
                    <p className="text-xs text-slate-500">
                      {
                        [
                          "Bookings",
                          "Today",
                          "Calendars",
                          "Avg Duration",
                        ][i]
                      }
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-lg bg-[#0f172a] px-4 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20" />
                      <div className="h-3 w-20 rounded bg-slate-700" />
                    </div>
                    <div className="h-3 w-16 rounded bg-slate-700" />
                    <div className="h-5 w-16 rounded-full bg-emerald-500/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-white">
            How it works
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                    <Icon className="h-7 w-7 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-emerald-400">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#0f172a] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            All the features to run professional scheduling.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-800 bg-[#1e293b] p-6"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-white">
            BookingKit vs Calendly
          </h2>
          <div className="mt-12 overflow-hidden rounded-xl bg-[#1e293b]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-sm">
                  <th className="px-6 py-4 font-medium text-slate-400">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-medium text-emerald-400">
                    BookingKit
                  </th>
                  <th className="px-6 py-4 text-center font-medium text-slate-400">
                    Calendly
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-slate-700/50 last:border-0"
                  >
                    <td className="px-6 py-3 text-sm text-slate-300">
                      {row.feature}
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-slate-300">
                      <ComparisonCell value={row.bk} />
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-slate-400">
                      <ComparisonCell value={row.cal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Testimonials */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Loved by founders
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-slate-800 bg-[#1e293b] p-6"
              >
                <p className="text-sm text-slate-300">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#1e293b] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to get booked?
          </h2>
          <p className="mt-4 text-slate-400">
            Start accepting bookings in minutes. No credit card required.
          </p>
          <a
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-emerald-500 px-8 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Start Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0f172a] px-6 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span className="font-bold text-emerald-500">BookingKit</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Drop-in scheduling for indie SaaS.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#features" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Docs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#" className="hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-5xl border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} BookingKit. All rights reserved.
        </div>
      </footer>
    </>
  );
}
