"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <Settings className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-slate-400">
          Coming soon — manage your account and preferences.
        </p>
      </div>
    </div>
  );
}
