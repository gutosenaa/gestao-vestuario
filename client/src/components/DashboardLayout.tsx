import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Bell, Box, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Cog,
  CreditCard, LayoutDashboard, LogOut, Menu, PackagePlus, ReceiptText, Search,
  ShoppingBag, Store, Users, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";

export type AppView = "dashboard" | "venda" | "produtos" | "precificacao" | "estoque" | "compras" | "despesas" | "financeiro" | "relatorios" | "clientes" | "fornecedores" | "configuracoes";

const navigation: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard; quick?: boolean }> = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "venda", label: "Nova venda", icon: ShoppingBag, quick: true },
  { id: "produtos", label: "Produtos", icon: Store },
  { id: "precificacao", label: "Precificação", icon: CircleDollarSign },
  { id: "estoque", label: "Estoque", icon: Box },
  { id: "compras", label: "Compras", icon: PackagePlus },
  { id: "despesas", label: "Despesas", icon: ReceiptText },
  { id: "financeiro", label: "Financeiro", icon: CreditCard },
  { id: "relatorios", label: "Relatórios", icon: ClipboardList },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "fornecedores", label: "Fornecedores", icon: Users },
  { id: "configuracoes", label: "Configurações", icon: Cog },
];

export default function DashboardLayout({
  children, activeView, onViewChange, alertCount = 0, onGlobalSearch,
}: {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  alertCount?: number;
  onGlobalSearch?: (query: string) => void;
}) {
  const { user, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const active = useMemo(() => navigation.find(item => item.id === activeView), [activeView]);
  const visibleNavigation = useMemo(() => {
    const allowed: Record<string, AppView[]> = {
      Admin: navigation.map(item => item.id),
      Vendedor: ["dashboard", "venda", "produtos", "clientes"],
      Financeiro: ["dashboard", "despesas", "financeiro", "relatorios"],
      Estoque: ["dashboard", "produtos", "precificacao", "estoque", "compras", "fornecedores"],
    };
    return navigation.filter(item => allowed[user?.role ?? ""]?.includes(item.id));
  }, [user?.role]);

  if (loading) return <div className="cinema-bg grid min-h-screen place-items-center"><div className="orbit-loader" /></div>;
  if (!user) return <div className="cinema-bg grid min-h-screen place-items-center p-5"><section className="glass-panel max-w-md p-9 text-center"><div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200"><Store size={28} /></div><p className="eyebrow">GESTÃO DE ALTA PERFORMANCE</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Entre para operar sua loja.</h1><p className="mt-4 text-sm leading-6 text-slate-300">Vendas, estoque, custos e resultado financeiro em uma única base segura.</p><Button onClick={startLogin} className="mt-8 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">Acessar sistema</Button></section></div>;

  const canSell = user.role === "Admin" || user.role === "Vendedor";
  const navigate = (view: AppView) => { if (visibleNavigation.some(item => item.id === view)) onViewChange(view); setMobileOpen(false); };
  return <div className="cinema-bg min-h-screen text-slate-100">
    <aside className={`fixed inset-y-0 left-0 z-50 hidden border-r border-white/8 bg-slate-950/65 backdrop-blur-2xl transition-all duration-200 lg:flex lg:flex-col ${collapsed ? "w-[76px]" : "w-[248px]"}`}>
      <div className="flex h-[76px] items-center gap-3 border-b border-white/8 px-5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-teal-500 text-slate-950 shadow-[0_0_30px_rgba(45,212,191,.28)]"><Store size={19} strokeWidth={2.6} /></div>
        {!collapsed && <div className="min-w-0"><p className="font-display text-sm font-bold tracking-[.17em] text-white">NORTHSTAR</p><p className="text-[10px] tracking-[.22em] text-cyan-300">SPORT MANAGEMENT</p></div>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-5">
        {visibleNavigation.map(item => { const Icon = item.icon; const selected = item.id === activeView; return <button key={item.id} onClick={() => navigate(item.id)} className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition ${selected ? "bg-gradient-to-r from-cyan-300/18 to-teal-400/8 text-white shadow-[inset_0_0_0_1px_rgba(103,232,249,.12)]" : "text-slate-400 hover:bg-white/6 hover:text-slate-100"}`} title={collapsed ? item.label : undefined}><Icon size={18} className={selected ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"} />{!collapsed && <span className="font-medium">{item.label}</span>}{item.quick && !collapsed && <span className="ml-auto rounded-md bg-orange-300/12 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-orange-200">RÁPIDA</span>}</button>; })}
      </nav>
      <div className="border-t border-white/8 p-3">
        <button onClick={() => setCollapsed(value => !value)} className="mb-3 flex h-10 w-full items-center justify-center rounded-xl text-slate-400 hover:bg-white/6 hover:text-white">{collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={17} /><span className="ml-2 text-xs">Recolher menu</span></>}</button>
        <div className="flex items-center gap-3 rounded-xl bg-white/[.035] p-2.5"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-300/15 text-xs font-bold text-orange-200">{user.name?.slice(0, 1).toUpperCase() || "U"}</div>{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{user.name || "Usuário"}</p><p className="mt-0.5 text-[10px] text-cyan-300">{user.role}</p></div>}{!collapsed && <button onClick={logout} aria-label="Sair" className="text-slate-500 hover:text-orange-200"><LogOut size={16} /></button>}</div>
      </div>
    </aside>

    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-white/8 bg-slate-950/45 px-4 backdrop-blur-xl lg:ml-[248px] lg:px-7">
      <button onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-100 lg:hidden"><Menu size={19} /></button>
      <div className="min-w-0 flex-1"><p className="hidden text-[10px] font-bold tracking-[.2em] text-cyan-300 sm:block">CENTRO DE COMANDO</p><h2 className="truncate font-display text-base font-semibold text-white">{active?.label || "Gestão comercial"}</h2></div>
      <div className="relative hidden max-w-xs flex-1 md:block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} onChange={event => onGlobalSearch?.(event.target.value)} placeholder="Buscar produto, cliente, código..." className="h-10 w-full rounded-xl border border-white/8 bg-white/[.045] pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[.075]" />{searchOpen && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">BUSCA GLOBAL</span>}</div>
      <button onClick={() => navigate("dashboard")} className="relative grid size-10 place-items-center rounded-xl border border-white/8 bg-white/[.045] text-slate-300 hover:text-cyan-200"><Bell size={17} />{alertCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-orange-400 text-[9px] font-bold text-slate-950">{Math.min(alertCount, 9)}</span>}</button>
      {canSell && <button onClick={() => navigate("venda")} className="hidden h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-bold text-slate-950 shadow-[0_0_28px_rgba(103,232,249,.15)] hover:bg-cyan-200 sm:flex"><ShoppingBag size={15} />Nova venda</button>}
    </header>

    <main className={`pb-24 pt-5 lg:pb-8 ${collapsed ? "lg:ml-[76px]" : "lg:ml-[248px]"}`}><div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">{children}</div></main>

    <div className="fixed bottom-0 z-40 flex h-[72px] w-full items-center justify-around border-t border-white/10 bg-slate-950/85 px-2 pb-safe backdrop-blur-xl lg:hidden">{visibleNavigation.filter(item => ["dashboard", "venda", "produtos", "estoque", "financeiro"].includes(item.id)).slice(0, 5).map(item => { const Icon = item.icon; const selected = activeView === item.id; return <button key={item.id} onClick={() => navigate(item.id)} className={`flex min-w-[52px] flex-col items-center gap-1 text-[9px] font-medium ${selected ? "text-cyan-200" : "text-slate-500"}`}><span className={`grid size-8 place-items-center rounded-xl ${selected ? "bg-cyan-300/15" : ""}`}><Icon size={17} /></span>{item.label === "Visão geral" ? "Início" : item.label}</button>; })}</div>
    {mobileOpen && <div className="fixed inset-0 z-[60] lg:hidden"><button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/70" /><aside className="absolute inset-y-0 left-0 w-[290px] border-r border-white/10 bg-slate-950 p-4 shadow-2xl"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-cyan-200"><Store size={21} /><span className="font-display text-sm font-bold tracking-widest">NORTHSTAR</span></div><button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-400"><X size={20} /></button></div><div className="space-y-1">{visibleNavigation.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm ${activeView === item.id ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400"}`}><Icon size={18} />{item.label}</button>; })}</div><div className="absolute bottom-5 left-4 right-4"><div className="rounded-xl bg-white/5 p-3 text-xs text-slate-300"><p className="font-medium text-white">{user.name || "Usuário"}</p><p className="mt-1 text-cyan-300">{user.role}</p><button onClick={logout} className="mt-3 flex items-center gap-2 text-orange-200"><LogOut size={14} />Sair</button></div></div></aside></div>}
  </div>;
}
