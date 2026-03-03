"use client";

import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <BarChart2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="mt-2 text-slate-400">
          Coming soon — track your booking rates and trends.
        </p>
      </div>
    </div>
  );
}
