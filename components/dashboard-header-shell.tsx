"use client"

import dynamic from "next/dynamic"

const DashboardHeader = dynamic(() => import("./dashboard-header").then((m) => m.DashboardHeader), {
  ssr: false,
})

export function DashboardHeaderShell({ email }: { email: string | null }) {
  return <DashboardHeader email={email} />
}


