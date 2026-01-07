"use client"

import dynamic from "next/dynamic"
import type { Divida } from "@/lib/types"

const DividasStats = dynamic(() => import("@/components/dividas-stats").then((m) => m.DividasStats), {
  ssr: false,
  loading: () => (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <div className="h-[96px] rounded-xl border bg-background/60 animate-pulse" />
        <div className="h-[96px] rounded-xl border bg-background/60 animate-pulse" />
        <div className="h-[96px] rounded-xl border bg-background/60 animate-pulse" />
        <div className="h-[96px] rounded-xl border bg-background/60 animate-pulse" />
      </div>
    </div>
  ),
})

export function DividasStatsClient({ dividas }: { dividas: Divida[] }) {
  return <DividasStats dividas={dividas} />
}


