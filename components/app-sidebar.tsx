"use client"

import { Calculator, Layers, Wallet, Sparkles, PiggyBank, FileText, CreditCard } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Resumo Geral",
    id: "resumo",
    icon: Calculator,
  },
  {
    title: "Parcelamentos",
    id: "dividas",
    icon: Layers,
  },
  {
    title: "Controle Mensal",
    id: "controle",
    icon: Wallet,
  },
  {
    title: "Gastos Diários",
    id: "diarios",
    icon: Sparkles,
  },
  {
    title: "Poupança",
    id: "poupanca",
    icon: PiggyBank,
  },
  {
    title: "Relatórios",
    id: "relatorios",
    icon: FileText,
  },
]

interface AppSidebarProps {
  activeTab: string
  setActiveTab: (tab: "resumo" | "dividas" | "controle" | "diarios" | "poupanca" | "relatorios") => void
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  return (
    <Sidebar variant="sidebar" className="border-r border-border bg-slate-50 dark:bg-slate-950">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <CreditCard className="h-6 w-6" />
          <span>Gestão de Dívidas</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    tooltip={item.title}
                    className="font-medium"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
