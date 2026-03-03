"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  highlighted: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    highlighted: false,
    cta: "Get Started",
    features: [
      { text: "1 calendar", included: true },
      { text: "50 bookings/month", included: true },
      { text: "Basic support", included: true },
      { text: "Custom branding", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 9,
    annualPrice: 7,
    highlighted: true,
    cta: "Start Free Trial",
    features: [
      { text: "Unlimited calendars", included: true },
      { text: "Unlimited bookings", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: true },
    ],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
          Start free, upgrade when you need more.
        </p>

        {/* Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className={`text-sm ${!annual ? "text-white" : "text-slate-400"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? "bg-emerald-500" : "bg-slate-600"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span
            className={`text-sm ${annual ? "text-white" : "text-slate-400"}`}
          >
            Annual{" "}
            <span className="text-emerald-400">(save 22%)</span>
          </span>
        </div>

        {/* Plans */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 ${
                plan.highlighted
                  ? "border-2 border-emerald-500 bg-[#1e293b]"
                  : "border border-slate-700 bg-[#1e293b]"
              }`}
            >
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  ${annual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-slate-400">/mo</span>
              </div>
              {annual && plan.monthlyPrice > 0 && (
                <p className="mt-1 text-sm text-slate-400">
                  Billed ${plan.annualPrice * 12}/year
                </p>
              )}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat.text} className="flex items-center gap-2">
                    <Check
                      className={`h-4 w-4 ${feat.included ? "text-emerald-400" : "text-slate-600"}`}
                    />
                    <span
                      className={
                        feat.included ? "text-slate-300" : "text-slate-500"
                      }
                    >
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full rounded-lg py-2.5 text-sm font-medium ${
                  plan.highlighted
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
