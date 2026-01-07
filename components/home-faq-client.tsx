"use client"

import dynamic from "next/dynamic"

const HomeFaq = dynamic(() => import("@/components/home-faq").then((m) => m.HomeFaq), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/30 dark:border-blue-500/25 bg-white/60 dark:bg-slate-950/30 p-6 animate-pulse">
      <div className="h-5 w-40 rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-4 h-4 w-full rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-3 h-4 w-11/12 rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-3 h-4 w-10/12 rounded bg-black/10 dark:bg-white/10" />
    </div>
  ),
})

export function HomeFaqClient() {
  return <HomeFaq />
}


