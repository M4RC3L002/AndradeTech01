import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'dashboard' | 'orders' | 'quotes' | 'clients' | 'settings'

interface OrderItem {
  desc: string
  qty: number
  unit: number
}

interface Order {
  id: string
  client: string
  phone: string
  device: string
  service: string
  status: string
  value: number
  date: string
  technician: string
  notes: string
  items?: OrderItem[]
}

interface Quote {
  id: string
  client: string
  phone: string
  device: string
  description: string
  value: number
  validUntil: string
  createdAt: string
  status: 'Pendente' | 'Aprovado' | 'Cancelado'
  items: OrderItem[]
}

interface Client {
  id: string
  name: string
  phone: string
  cpf: string
  address: string
  city: string
  totalOrders: number
  totalSpent: number
  lastService: string
  devices: string[]
}

interface CustomService {
  id: string
  name: string
  default_price: number
  category: string
}

interface Product {
  id: string
  name: string
  category: string
  cost_price: number
  sale_price: number
  stock: number
}

interface CustomStatus {
  id: string
  label: string
  dot: string
}

interface CategoryItem {
  id: string
  name: string
}

// ─── Padrões Iniciais & Navegação ──────────────────────────────────────────────

const LOGO_URL = 'https://yqpgdnztjoplteltassu.supabase.co/storage/v1/object/public/public-assets/logo.png'

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: '1', label: 'Entrada', dot: '#64748B' },
  { id: '2', label: 'Orçamento', dot: '#F59E0B' },
  { id: '3', label: 'Em Análise', dot: '#007BFF' },
  { id: '4', label: 'Aguardando Peça', dot: '#8A2BE2' },
  { id: '5', label: 'Concluído', dot: '#10B981' },
  { id: '6', label: 'Entregue', dot: '#059669' },
  { id: '7', label: 'Cancelado', dot: '#EF4444' },
]

const DEFAULT_SERVICES: CustomService[] = [
  { id: '1', name: 'Troca de Tela', default_price: 350, category: 'Dispositivos' },
  { id: '2', name: 'Reparo de Bateria', default_price: 180, category: 'Dispositivos' },
  { id: '3', name: 'Formatação + SO', default_price: 150, category: 'Computadores' },
  { id: '4', name: 'Limpeza Interna e Pasta', default_price: 120, category: 'Computadores' },
  { id: '5', name: 'Troca de Conector de Carga', default_price: 130, category: 'Dispositivos' },
  { id: '6', name: 'Diagnóstico e Orçamento', default_price: 0, category: 'Geral' },
]

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'SSD 480GB Kingston', category: 'Computadores', cost_price: 130, sale_price: 240, stock: 4 },
  { id: '2', name: 'Tela iPhone 11 Incell', category: 'Dispositivos', cost_price: 110, sale_price: 250, stock: 2 },
  { id: '3', name: 'Fonte ATX 500W', category: 'Computadores', cost_price: 160, sale_price: 280, stock: 3 },
]

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Acessórios' },
  { id: '2', name: 'Computadores' },
  { id: '3', name: 'Dispositivos' },
]

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Painel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
    ),
  },
  {
    id: 'orders',
    label: 'Ordens',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>
    ),
  },
  {
    id: 'quotes',
    label: 'Orçamentos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    ),
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    ),
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2" /></svg>
    ),
  },
] as const

// ─── Componentes Globais ──────────────────────────────────────────────────────

function AppLogo({ size = 36 }: { size?: number }) {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return (
      <div
        className="flex items-center justify-center rounded-xl font-bold text-white shadow-md flex-shrink-0 bg-gradient-to-tr from-[#0066FF] to-[#8A2BE2]"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        AT
      </div>
    )
  }

  return (
    <img
      src={LOGO_URL}
      alt="AndradeTech Logo"
      onError={() => setImgError(true)}
      className="rounded-xl object-contain flex-shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all ${
        isDark
          ? 'bg-[#181818] border-neutral-800 text-neutral-300 hover:border-neutral-700'
          : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'
      }`}
    >
      <span className="flex items-center gap-1.5">
        {isDark ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
        <span className="font-semibold">{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
      </span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-600'}`}>
        MUDAR
      </span>
    </button>
  )
}

function StatusBadge({ status, statuses = [] }: { status: string; statuses?: CustomStatus[] }) {
  const current = statuses.find(s => s && s.label && s.label.toLowerCase() === (status || '').toLowerCase()) || {
    label: status || 'Entrada',
    dot: '#888888',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-xs font-medium"
      style={{
        color: current.dot,
        background: `${current.dot}18`,
        border: `1px solid ${current.dot}33`,
      }}
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: current.dot }} />
      {current.label}
    </span>
  )
}

function WhatsAppBtn({
  phone,
  label = '',
  orderDetails,
  quoteDetails,
}: {
  phone: string
  label?: string
  orderDetails?: Partial<Order>
  quoteDetails?: Partial<Quote>
}) {
  let msg = `Olá! Passando para falar sobre seu atendimento na AndradeTech.`

  if (orderDetails) {
    msg = `*AndradeTech - Atualização de OS*\n\n` +
          `Olá, *${orderDetails.client || 'Cliente'}*!\n` +
          `*OS:* #${orderDetails.id || '---'}\n` +
          `*Aparelho:* ${orderDetails.device || 'N/A'}\n` +
          `*Serviço:* ${orderDetails.service || 'Em diagnóstico'}\n` +
          `*Situação Atual:* ${orderDetails.status || 'Em andamento'}\n` +
          (orderDetails.value ? `*Valor Total:* R$ ${Number(orderDetails.value).toFixed(2)}\n\n` : '\n') +
          `Estamos à disposição!`
  } else if (quoteDetails) {
    msg = `*AndradeTech - Proposta de Orçamento*\n\n` +
          `Olá, *${quoteDetails.client || 'Cliente'}*!\n` +
          `*Orçamento:* #${quoteDetails.id || '---'}\n` +
          `*Aparelho:* ${quoteDetails.device || 'N/A'}\n` +
          `*Descrição:* ${quoteDetails.description || 'Reparo técnico'}\n` +
          `*Valor Total:* R$ ${(Number(quoteDetails.value) || 0).toFixed(2)}\n` +
          `*Validade da proposta:* ${quoteDetails.validUntil || '7 dias'}\n\n` +
          `Podemos confirmar a aprovação do serviço?`
  } else if (label) {
    msg = `Olá! ${label}`
  }

  const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
  const href = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}` : '#'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!cleanPhone) {
          e.preventDefault()
          alert('Telefone do cliente não informado!')
        }
      }}
      title="Enviar WhatsApp"
      className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white transition-all bg-[#25D366] hover:opacity-90 active:scale-95 shadow-sm"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span className="hidden sm:inline">{label || 'WhatsApp'}</span>
    </a>
  )
}

function EmptyState({ icon, title, sub, isDark }: { icon: React.ReactNode; title: string; sub: string; isDark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 opacity-25 text-neutral-400">{icon}</div>
      <div className={`mb-1 text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>{title}</div>
      <div className={`text-xs ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}>{sub}</div>
    </div>
  )
}

function Topbar({
  title,
  isDark,
  onOpenMobileMenu,
  onNewOrder,
  onNewQuote,
  onNewClient,
  children,
}: {
  title: string
  isDark: boolean
  onOpenMobileMenu: () => void
  onNewOrder?: () => void
  onNewQuote?: () => void
  onNewClient?: () => void
  onLogout?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className={`flex flex-shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 sm:py-3 transition-colors ${
      isDark ? 'border-neutral-900 bg-[#0c0c0c]' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={`flex-shrink-0 rounded-lg p-1.5 md:hidden transition-colors ${
            isDark ? 'bg-neutral-900 text-neutral-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div className="truncate">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 sm:text-[10px]">AndradeTech</div>
          <div className={`truncate text-xs font-bold sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</div>
        </div>
        {children}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {onNewClient && (
          <button
            type="button"
            onClick={onNewClient}
            title="Novo Cliente"
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isDark ? 'border-neutral-800 bg-[#141414] text-neutral-300 hover:bg-neutral-800' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /></svg>
            <span className="text-[11px] sm:text-xs">Cliente</span>
          </button>
        )}
        {onNewQuote && (
          <button
            type="button"
            onClick={onNewQuote}
            title="Novo Orçamento"
            className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-[#8A2BE2] hover:bg-purple-500/20"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>
            <span className="text-[11px] sm:text-xs">Orçamento</span>
          </button>
        )}
        {onNewOrder && (
          <button
            type="button"
            onClick={onNewOrder}
            title="Nova OS"
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            <span className="text-[11px] sm:text-xs">Nova OS</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLoginSuccess, isDark }: { onLoginSuccess: () => void; isDark: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      setErrorMsg('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      onLoginSuccess()
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center p-4 transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-100'}`}>
      <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-colors ${isDark ? 'bg-[#111] border-neutral-800' : 'bg-white border-slate-200'}`}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <AppLogo size={56} />
          </div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] bg-clip-text text-transparent">
            AndradeTech
          </h1>
          <p className="font-mono text-xs text-neutral-400">Acesso Restrito ao Sistema</p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-center text-xs text-red-500">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-neutral-400">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#0066FF]'
              }`}
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-neutral-400">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#0066FF]'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] hover:opacity-95 shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Print Modal ──────────────────────────────────────────────────────────────

function PrintModal({
  order,
  client,
  onClose,
}: {
  order: Order
  client?: Client
  onClose: () => void
}) {
  const [printType, setPrintType] = useState<'a4' | 'thermal'>('a4')

  const items = (order.items && order.items.length > 0)
    ? order.items
    : [{ desc: order.service || 'Serviço Técnico Especializado', qty: 1, unit: order.value || 0 }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden bg-[#111] border-neutral-800 text-white">
        <div className="flex items-center justify-between px-5 py-3.5 border-b print:hidden border-neutral-800 bg-[#161616]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm sm:text-base">Emissão de Comprovante / OS</span>
            <div className="flex rounded-lg border p-0.5 border-neutral-700 bg-black">
              <button
                type="button"
                onClick={() => setPrintType('a4')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  printType === 'a4' ? 'bg-[#0066FF] text-white' : 'text-neutral-400'
                }`}
              >
                Folha A4
              </button>
              <button
                type="button"
                onClick={() => setPrintType('thermal')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  printType === 'thermal' ? 'bg-[#8A2BE2] text-white' : 'text-neutral-400'
                }`}
              >
                Cupom 80mm
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] shadow hover:opacity-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Imprimir / PDF</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-200/50 flex justify-center">
          {printType === 'a4' && (
            <div id="print-area" className="w-full max-w-[210mm] bg-white text-black p-8 sm:p-10 rounded shadow-md border border-neutral-300 font-sans text-xs print:m-0 print:p-0 print:border-none print:shadow-none">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain" />
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">ANDRADETECH</h1>
                    <p className="text-[11px] font-semibold text-slate-600">Assistência Técnica em Informática e Acessórios</p>
                    <p className="text-[10px] text-slate-500">São João do Paraíso - BA | WhatsApp / Tel: (73) 98834-3028</p>
                    <p className="text-[10px] text-slate-500">E-mail: andrade.tech2026@gmail.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-1 rounded border border-slate-300 font-bold">ORDEM DE SERVIÇO</span>
                  <div className="text-xl font-mono font-black text-blue-600 mt-1">{order.id}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Emissão: {order.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 mb-5 bg-slate-50">
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">DADOS DO CLIENTE</div>
                  <div className="font-bold text-sm text-slate-800">{order.client}</div>
                  <div className="text-[11px] text-slate-600">Telefone: {order.phone || 'Não informado'}</div>
                  {client?.cpf && <div className="text-[11px] text-slate-600">CPF/CNPJ: {client.cpf}</div>}
                  {client?.address && <div className="text-[11px] text-slate-600">Endereço: {client.address} - {client.city}</div>}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">EQUIPAMENTO & SITUAÇÃO</div>
                  <div className="font-bold text-sm text-slate-800">{order.device}</div>
                  <div className="text-[11px] text-slate-600">Situação Atual: <span className="font-bold text-slate-800">{order.status}</span></div>
                  <div className="text-[11px] text-slate-600">Técnico Resp.: {order.technician}</div>
                </div>
              </div>

              {order.notes && (
                <div className="border border-slate-200 rounded-lg p-3 mb-5 bg-white">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">RELATO DO DEFEITO / OBSERVAÇÕES TÉCNICAS</div>
                  <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{order.notes}</div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] text-slate-600 uppercase">
                    <tr>
                      <th className="p-2.5">Descrição do Serviço / Peça</th>
                      <th className="p-2.5 text-center w-16">Qtd</th>
                      <th className="p-2.5 text-right w-24">V. Unit</th>
                      <th className="p-2.5 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{it.desc}</td>
                        <td className="p-2.5 text-center font-mono">{it.qty}</td>
                        <td className="p-2.5 text-right font-mono">R$ {Number(it.unit || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">R$ {(Number(it.qty || 1) * Number(it.unit || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-mono border-t-2 border-slate-300">
                      <td colSpan={3} className="p-3 text-right uppercase font-bold text-slate-700">Valor Total a Pagar:</td>
                      <td className="p-3 text-right text-sm font-black text-blue-600">R$ {Number(order.value || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 text-[9px] text-slate-500 leading-relaxed mb-8">
                <span className="font-bold text-slate-700 uppercase">Termo de Garantia Legal (Art. 26 do CDC):</span> A garantia para serviços executados e peças substituídas é de 90 (noventa) dias a contar da data de retirada do aparelho, cobrindo exclusivamente o defeito solucionado. A garantia perde sua validade em casos de selo rompido, oxidação por umidade, quedas, trincas ou danos causados por mau uso e sobretensão elétrica.
              </div>

              <div className="grid grid-cols-2 gap-10 text-center pt-4">
                <div>
                  <div className="border-t border-slate-400 w-full mb-1"></div>
                  <div className="font-bold text-[11px] text-slate-800">{order.client}</div>
                  <div className="text-[10px] text-slate-500">Assinatura do Cliente</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-full mb-1"></div>
                  <div className="font-bold text-[11px] text-slate-800">AndradeTech Assistência Técnica</div>
                  <div className="text-[10px] text-slate-500">Assinatura do Responsável</div>
                </div>
              </div>
            </div>
          )}

          {printType === 'thermal' && (
            <div id="print-area" className="w-[80mm] bg-white text-black p-4 rounded shadow-md border border-neutral-300 font-mono text-[11px] leading-tight print:m-0 print:p-0 print:border-none print:shadow-none print:w-[80mm]">
              <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                <div className="font-black text-sm">ANDRADETECH</div>
                <div className="text-[9px]">Assistência Técnica Especializada</div>
                <div className="text-[9px]">São João do Paraíso - Bahia</div>
                <div className="text-[9px]">Tel/WhatsApp: (73) 98834-3028</div>
                <div className="text-[8px]">andrade.tech2026@gmail.com</div>
              </div>

              <div className="text-center font-bold text-xs py-1 border-b border-dashed border-black mb-2">
                ORDEM DE SERVIÇO #{order.id}
              </div>

              <div className="space-y-1 mb-2 border-b border-dashed border-black pb-2 text-[10px]">
                <div><b>Data:</b> {order.date}</div>
                <div><b>Cliente:</b> {order.client}</div>
                <div><b>Contato:</b> {order.phone || 'N/A'}</div>
                <div><b>Aparelho:</b> {order.device}</div>
                <div><b>Técnico:</b> {order.technician}</div>
                <div><b>Situação:</b> {order.status}</div>
              </div>

              {order.notes && (
                <div className="mb-2 border-b border-dashed border-black pb-2 text-[10px]">
                  <b>Defeito:</b> {order.notes}
                </div>
              )}

              <div className="mb-2 border-b border-dashed border-black pb-2">
                <div className="font-bold text-[10px] mb-1">ITENS / SERVIÇOS:</div>
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="truncate pr-1">{it.qty}x {it.desc}</span>
                    <span className="font-bold whitespace-nowrap">R$ {(Number(it.qty || 1) * Number(it.unit || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-xs py-1 border-b border-dashed border-black mb-3">
                <span>TOTAL:</span>
                <span>R$ {Number(order.value || 0).toFixed(2)}</span>
              </div>

              <div className="text-[8px] text-center leading-tight mb-4 text-neutral-600">
                Garantia legal de 90 dias conforme CDC sobre serviços executados. Não cobre quedas ou umidade.
              </div>

              <div className="text-center pt-4">
                <div className="border-t border-black w-4/5 mx-auto mb-1"></div>
                <div className="text-[9px]">Assinatura do Cliente</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Modais de Ajustes ────────────────────────────────────────────────────────

function ProductModal({
  onClose,
  onSave,
  categories = [],
  productToEdit,
  isDark,
}: {
  onClose: () => void
  onSave: (prod: Product) => void
  categories?: CategoryItem[]
  productToEdit?: Product | null
  isDark: boolean
}) {
  const safeCats = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES
  const [name, setName] = useState(productToEdit?.name || '')
  const [category, setCategory] = useState(productToEdit?.category || safeCats[0]?.name || 'Acessórios')
  const [costPrice, setCostPrice] = useState(productToEdit?.cost_price !== undefined ? String(productToEdit.cost_price) : '')
  const [salePrice, setSalePrice] = useState(productToEdit?.sale_price !== undefined ? String(productToEdit.sale_price) : '')
  const [stock, setStock] = useState(productToEdit?.stock !== undefined ? String(productToEdit.stock) : '1')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Informe o nome da peça/produto!')

    onSave({
      id: productToEdit?.id || Date.now().toString(),
      name: name.trim(),
      category: category.trim() || 'Acessórios',
      cost_price: Number(costPrice) || 0,
      sale_price: Number(salePrice) || 0,
      stock: Number(stock) || 0,
    })
    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <form onSubmit={handleSave} className={`w-full max-w-lg rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">ESTOQUE & PEÇAS</div>
            <h2 className="text-base font-bold">{productToEdit ? 'Editar Peça / Produto' : 'Novo Produto / Peça'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Descrição do Produto *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: SSD 480GB Kingston, Tela iPhone 11..." className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Categoria (Filtro)</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {safeCats.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
              <option value="Geral">Geral</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Preço Custo (R$)</label>
              <input type="number" step="any" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Preço Venda (R$) *</label>
              <input required type="number" step="any" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Quantidade</label>
              <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-blue-500/20">
            {productToEdit ? 'Atualizar Peça' : 'Salvar Peça'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ServiceModal({
  onClose,
  onSave,
  categories = [],
  serviceToEdit,
  isDark,
}: {
  onClose: () => void
  onSave: (svc: CustomService) => void
  categories?: CategoryItem[]
  serviceToEdit?: CustomService | null
  isDark: boolean
}) {
  const safeCats = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES
  const [name, setName] = useState(serviceToEdit?.name || '')
  const [defaultPrice, setDefaultPrice] = useState(serviceToEdit?.default_price !== undefined ? String(serviceToEdit.default_price) : '')
  const [category, setCategory] = useState(serviceToEdit?.category || safeCats[0]?.name || 'Dispositivos')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Informe o nome do serviço!')

    onSave({
      id: serviceToEdit?.id || Date.now().toString(),
      name: name.trim(),
      default_price: Number(defaultPrice) || 0,
      category: category.trim() || 'Geral',
    })
    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <form onSubmit={handleSave} className={`w-full max-w-lg rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">MÃO DE OBRA</div>
            <h2 className="text-base font-bold">{serviceToEdit ? 'Editar Serviço' : 'Novo Serviço Técnico'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome do Serviço *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Troca de Tela, Formatação..." className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Preço Padrão (R$) *</label>
              <input required type="number" step="any" value={defaultPrice} onChange={e => setDefaultPrice(e.target.value)} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Categoria (Filtro)</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                {safeCats.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>
        </div>
        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-blue-500/20">
            {serviceToEdit ? 'Atualizar Serviço' : 'Salvar Serviço'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatusModal({
  onClose,
  onSave,
  statusToEdit,
  isDark,
}: {
  onClose: () => void
  onSave: (st: CustomStatus) => void
  statusToEdit?: CustomStatus | null
  isDark: boolean
}) {
  const [label, setLabel] = useState(statusToEdit?.label || '')
  const [dot, setDot] = useState(statusToEdit?.dot || '#0066FF')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return alert('Informe o nome da situação!')

    onSave({
      id: statusToEdit?.id || Date.now().toString(),
      label: label.trim(),
      dot,
    })
    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <form onSubmit={handleSave} className={`w-full max-w-md rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">FLUXO DE OS</div>
            <h2 className="text-base font-bold">{statusToEdit ? 'Editar Situação' : 'Nova Situação / Status'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome da Situação *</label>
            <input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Em Garantia, Aguardando Cliente..." className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Cor de Identificação</label>
            <div className="flex items-center gap-3">
              <input type="color" value={dot} onChange={e => setDot(e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border-0 bg-transparent" />
              <span className="font-mono text-xs uppercase text-neutral-400">{dot}</span>
            </div>
          </div>
        </div>
        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-blue-500/20">
            {statusToEdit ? 'Atualizar Situação' : 'Salvar Situação'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CategoryModal({
  onClose,
  onSave,
  categoryToEdit,
  isDark,
}: {
  onClose: () => void
  onSave: (cat: CategoryItem) => void
  categoryToEdit?: CategoryItem | null
  isDark: boolean
}) {
  const [name, setName] = useState(categoryToEdit?.name || '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Informe o nome da categoria!')

    onSave({
      id: categoryToEdit?.id || Date.now().toString(),
      name: name.trim(),
    })
    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <form onSubmit={handleSave} className={`w-full max-w-md rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">FILTROS & CATEGORIAS</div>
            <h2 className="text-base font-bold">{categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome da Categoria *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Acessórios, Computadores..." className={inputClass} />
          </div>
        </div>
        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-blue-500/20">
            {categoryToEdit ? 'Atualizar Categoria' : 'Salvar Categoria'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Settings Screen (Com Quadro de Categorias, Filtro e Lista/Quadro) ────────

function SettingsScreen({
  services = [],
  products = [],
  statuses = [],
  categories = [],
  isDark,
  onOpenProductModal,
  onOpenServiceModal,
  onOpenStatusModal,
  onOpenCategoryModal,
  onEditProduct,
  onEditService,
  onEditStatus,
  onEditCategory,
  onDeleteProduct,
  onDeleteService,
  onDeleteStatus,
  onDeleteCategory,
  onOpenMenu,
  onLogout,
}: {
  services: CustomService[]
  products: Product[]
  statuses: CustomStatus[]
  categories: CategoryItem[]
  isDark: boolean
  onOpenProductModal: () => void
  onOpenServiceModal: () => void
  onOpenStatusModal: () => void
  onOpenCategoryModal: () => void
  onEditProduct: (p: Product) => void
  onEditService: (s: CustomService) => void
  onEditStatus: (st: CustomStatus) => void
  onEditCategory: (cat: CategoryItem) => void
  onDeleteProduct: (id: string) => void
  onDeleteService: (id: string) => void
  onDeleteStatus: (id: string) => void
  onDeleteCategory: (id: string) => void
  onOpenMenu: () => void
  onLogout: () => void
}) {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')

  const safeProducts = Array.isArray(products) ? products : []
  const safeServices = Array.isArray(services) ? services : []
  const safeStatuses = Array.isArray(statuses) ? statuses : []
  const safeCategories = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES

  const filteredProducts = selectedCategory === 'Todos'
    ? safeProducts
    : safeProducts.filter(p => (p.category || 'Geral').toLowerCase() === selectedCategory.toLowerCase())

  const filteredServices = selectedCategory === 'Todos'
    ? safeServices
    : safeServices.filter(s => (s.category || 'Geral').toLowerCase() === selectedCategory.toLowerCase())

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Configurações & Catálogo" isDark={isDark} onOpenMobileMenu={onOpenMenu} onLogout={onLogout}>
        <div className={`ml-2 flex items-center gap-1 rounded-lg border p-0.5 ${isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-slate-100'}`}>
          <button
            type="button"
            onClick={() => setView('board')}
            className="rounded px-2 py-1 text-[11px] font-medium transition-all"
            style={{
              background: view === 'board' ? 'linear-gradient(to right, #0066FF, #8A2BE2)' : 'transparent',
              color: view === 'board' ? '#fff' : (isDark ? '#888' : '#555'),
            }}
          >
            Quadro
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className="rounded px-2 py-1 text-[11px] font-medium transition-all"
            style={{
              background: view === 'list' ? 'linear-gradient(to right, #0066FF, #8A2BE2)' : 'transparent',
              color: view === 'list' ? '#fff' : (isDark ? '#888' : '#555'),
            }}
          >
            Lista
          </button>
        </div>
      </Topbar>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {/* Barra de Filtros por Categoria */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono text-neutral-400 mr-1 uppercase">Filtro:</span>
          {['Todos', ...safeCategories.map(c => c.name)].map(catName => {
            const isActive = selectedCategory === catName
            return (
              <button
                key={catName}
                type="button"
                onClick={() => setSelectedCategory(catName)}
                className="whitespace-nowrap rounded-full border px-3 py-1 font-mono text-xs transition-all"
                style={{
                  background: isActive ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
                  color: isActive ? '#0066FF' : (isDark ? '#777' : '#555'),
                  borderColor: isActive ? '#0066FF' : (isDark ? '#262626' : '#E2E8F0'),
                }}
              >
                {catName}
              </button>
            )
          })}
        </div>

        {view === 'board' ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Card Produtos / Peças */}
              <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <div>
                    <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Produtos & Peças</span>
                    <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({filteredProducts.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenProductModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-xs font-bold text-white hover:opacity-95 shadow-sm"
                  >
                    + Nova Peça
                  </button>
                </div>

                <div className={`max-h-72 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400">Nenhuma peça nesta categoria</div>
                  ) : (
                    filteredProducts.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-neutral-500/5">
                        <div>
                          <div className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{p.name}</div>
                          <div className="flex gap-2 text-[10px] font-mono text-neutral-400">
                            <span className="text-[#0066FF] font-bold">{p.category || 'Geral'}</span>
                            <span>•</span>
                            <span>Venda: R$ {Number(p.sale_price || 0).toFixed(2)}</span>
                            <span>•</span>
                            <span>Qtd: {p.stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => onEditProduct(p)} className="p-1 text-neutral-400 hover:text-[#0066FF]" title="Editar Peça">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" onClick={() => onDeleteProduct(p.id)} className="p-1 text-neutral-400 hover:text-red-500" title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card Serviços */}
              <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <div>
                    <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Serviços da Assistência</span>
                    <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({filteredServices.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenServiceModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-xs font-bold text-white hover:opacity-95 shadow-sm"
                  >
                    + Novo Serviço
                  </button>
                </div>

                <div className={`max-h-72 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                  {filteredServices.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400">Nenhum serviço nesta categoria</div>
                  ) : (
                    filteredServices.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-neutral-500/5">
                        <div>
                          <div className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{s.name}</div>
                          <div className="flex gap-2 text-[10px] font-mono text-neutral-400">
                            <span className="text-[#8A2BE2] font-bold">{s.category || 'Geral'}</span>
                            <span>•</span>
                            <span>R$ {Number(s.default_price || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => onEditService(s)} className="p-1 text-neutral-400 hover:text-[#0066FF]" title="Editar Serviço">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" onClick={() => onDeleteService(s.id)} className="p-1 text-neutral-400 hover:text-red-500" title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card Situações / Status */}
              <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <div>
                    <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Situações de OS</span>
                    <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({safeStatuses.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenStatusModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-xs font-bold text-white hover:opacity-95 shadow-sm"
                  >
                    + Nova Situação
                  </button>
                </div>

                <div className={`max-h-72 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                  {safeStatuses.map(st => (
                    <div key={st.id} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-neutral-500/5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: st.dot }} />
                        <span className={isDark ? 'text-neutral-200' : 'text-slate-800'}>{st.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (safeStatuses.length <= 1) return alert('Mantenha ao menos uma situação!')
                          onDeleteStatus(st.id)
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Linha 2: Quadro de Categorias / Filtros */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 pt-2">
              <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                  <div>
                    <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Categorias de Filtro</span>
                    <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({safeCategories.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCategoryModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-xs font-bold text-white hover:opacity-95 shadow-sm"
                  >
                    + Nova Categoria
                  </button>
                </div>

                <div className={`max-h-56 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                  {safeCategories.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-neutral-500/5">
                      <span className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>{c.name}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => onEditCategory(c)} className="p-1 text-neutral-400 hover:text-[#0066FF]" title="Editar Categoria">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (safeCategories.length <= 1) return alert('Mantenha ao menos uma categoria!')
                            onDeleteCategory(c.id)
                          }}
                          className="p-1 text-neutral-400 hover:text-red-500"
                          title="Excluir"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`overflow-hidden rounded-xl border transition-colors ${
            isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className={`border-b text-left text-neutral-400 ${isDark ? 'bg-[#0e0e0e] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                    <th className="px-3 py-2.5 font-mono uppercase">Tipo</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Nome / Descrição</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Categoria</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Preço / Venda</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Estoque</th>
                    <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                  {filteredProducts.map(p => (
                    <tr key={`prod-${p.id}`} className={isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#0066FF]">📦 Peça</td>
                      <td className={`px-3 py-2.5 font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{p.name}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">{p.category || 'Geral'}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-green-500">R$ {Number(p.sale_price || 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-300">{p.stock} un</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => onEditProduct(p)} className="p-1 text-neutral-400 hover:text-[#0066FF]" title="Editar Peça">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" onClick={() => onDeleteProduct(p.id)} className="p-1 text-neutral-400 hover:text-red-500" title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredServices.map(s => (
                    <tr key={`svc-${s.id}`} className={isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#8A2BE2]">🛠️ Serviço</td>
                      <td className={`px-3 py-2.5 font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{s.name}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">{s.category || 'Geral'}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-green-500">R$ {Number(s.default_price || 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">—</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => onEditService(s)} className="p-1 text-neutral-400 hover:text-[#0066FF]" title="Editar Serviço">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" onClick={() => onDeleteService(s.id)} className="p-1 text-neutral-400 hover:text-red-500" title="Excluir">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Raiz da Aplicação ────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('andrade_tech_theme')
      return saved !== null ? saved === 'dark' : true
    } catch {
      return true
    }
  })

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev
      try {
        localStorage.setItem('andrade_tech_theme', next ? 'dark' : 'light')
      } catch {}
      return next
    })
  }

  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)

  // Modais de Ajustes
  const [showProductModal, setShowProductModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Itens em Edição
  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [quoteEditing, setQuoteEditing] = useState<Quote | null>(null)
  const [clientEditing, setClientEditing] = useState<Client | null>(null)
  const [productEditing, setProductEditing] = useState<Product | null>(null)
  const [serviceEditing, setServiceEditing] = useState<CustomService | null>(null)
  const [statusEditing, setStatusEditing] = useState<CustomStatus | null>(null)
  const [categoryEditing, setCategoryEditing] = useState<CategoryItem | null>(null)

  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [services, setServices] = useState<CustomService[]>(DEFAULT_SERVICES)
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS)
  const [statuses, setStatuses] = useState<CustomStatus[]>(DEFAULT_STATUSES)
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    }).catch(() => {
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return

    const room = supabase.channel('online-users', {
      config: {
        presence: {
          key: session.user.id,
        },
      },
    })

    room
      .on('presence', { event: 'sync' }, () => {
        try {
          const presenceState = room.presenceState()
          const users = Object.keys(presenceState).map(key => presenceState[key][0] as any)
          setOnlineUsers(users)
        } catch {}
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await room.track({
              user_id: session.user.id,
              email: session.user.email,
              online_at: new Date().toISOString(),
            })
          } catch {}
        }
      })

    return () => {
      supabase.removeChannel(room)
    }
  }, [session])

  const fetchData = async () => {
    try {
      const { data: cData } = await supabase.from('clients').select('*')
      if (cData) {
        setClients(cData.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          cpf: c.cpf || '',
          address: c.address || '',
          city: c.city || '',
          totalOrders: c.total_orders || 0,
          totalSpent: Number(c.total_spent) || 0,
          lastService: c.last_service || '',
          devices: Array.isArray(c.devices) ? c.devices : [],
        })))
      }
    } catch {}

    try {
      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (oData) {
        setOrders(oData.map(o => ({
          id: o.id,
          client: o.client,
          phone: o.phone || '',
          device: o.device,
          service: o.service || '',
          status: o.status,
          value: Number(o.value) || 0,
          date: o.date,
          technician: o.technician || 'Admin',
          notes: o.notes || '',
          items: Array.isArray(o.items) ? o.items : [],
        })))
      }
    } catch {}

    try {
      const { data: qData } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
      if (qData) {
        setQuotes(qData.map(q => ({
          id: q.id,
          client: q.client,
          phone: q.phone || '',
          device: q.device || '',
          description: q.description || '',
          value: Number(q.value) || 0,
          validUntil: q.valid_until || '',
          createdAt: q.created_at ? new Date(q.created_at).toLocaleDateString('pt-BR') : '',
          status: q.status || 'Pendente',
          items: Array.isArray(q.items) ? q.items : [],
        })))
      }
    } catch {}

    try {
      const { data: sData } = await supabase.from('services').select('*')
      if (sData && sData.length > 0) setServices(sData)
    } catch {}

    try {
      const { data: pData } = await supabase.from('products').select('*')
      if (pData && pData.length > 0) setProducts(pData)
    } catch {}

    try {
      const { data: stData } = await supabase.from('statuses').select('*')
      if (stData && stData.length > 0) setStatuses(stData)
    } catch {}

    try {
      const { data: catData } = await supabase.from('categories').select('*')
      if (catData && catData.length > 0) setCategories(catData)
    } catch {}
  }

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut()
    }
  }

  const handleSaveClient = async (clientData: Client) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === clientData.id)
      return exists ? prev.map(c => c.id === clientData.id ? clientData : c) : [clientData, ...prev]
    })

    await supabase.from('clients').upsert([{
      id: clientData.id,
      name: clientData.name,
      phone: clientData.phone,
      cpf: clientData.cpf,
      address: clientData.address,
      city: clientData.city,
      total_orders: clientData.totalOrders,
      total_spent: clientData.totalSpent,
      last_service: clientData.lastService,
      devices: clientData.devices,
    }])
  }

  const handleDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    await supabase.from('clients').delete().eq('id', id)
  }

  const handleOpenEditClient = (client: Client) => {
    setClientEditing(client)
    setShowClientModal(true)
  }

  const handleOpenNewClient = () => {
    setClientEditing(null)
    setShowClientModal(true)
  }

  const handleSaveOrder = async (orderData: Order) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === orderData.id)
      return exists ? prev.map(o => o.id === orderData.id ? orderData : o) : [orderData, ...prev]
    })

    await supabase.from('orders').upsert([{
      id: orderData.id,
      client: orderData.client,
      phone: orderData.phone,
      device: orderData.device,
      service: orderData.service,
      status: orderData.status,
      value: orderData.value,
      date: orderData.date,
      technician: orderData.technician,
      notes: orderData.notes,
      items: orderData.items || [],
    }])
  }

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
    await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
  }

  const handleDeleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
    await supabase.from('orders').delete().eq('id', orderId)
  }

  const handleSaveQuote = async (quoteData: Quote) => {
    setQuotes(prev => {
      const exists = prev.some(q => q.id === quoteData.id)
      return exists ? prev.map(q => q.id === quoteData.id ? quoteData : q) : [quoteData, ...prev]
    })

    await supabase.from('quotes').upsert([{
      id: quoteData.id,
      client: quoteData.client,
      phone: quoteData.phone,
      device: quoteData.device,
      description: quoteData.description,
      value: quoteData.value,
      valid_until: quoteData.validUntil,
      status: quoteData.status,
      items: quoteData.items,
    }])
  }

  const handleConvertToOrder = async (quote: Quote) => {
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'Aprovado' } : q))
    await supabase.from('quotes').update({ status: 'Aprovado' }).eq('id', quote.id)

    const newOrder: Order = {
      id: `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      client: quote.client,
      phone: quote.phone,
      device: quote.device,
      service: quote.items[0]?.desc || quote.description,
      status: 'Entrada',
      value: quote.value,
      date: new Date().toLocaleDateString('pt-BR'),
      technician: 'Admin',
      notes: `Convertido do Orçamento #${quote.id}. ${quote.description}`,
      items: quote.items,
    }

    setOrders(prev => [newOrder, ...prev])
    await supabase.from('orders').insert([{
      id: newOrder.id,
      client: newOrder.client,
      phone: newOrder.phone,
      device: newOrder.device,
      service: newOrder.service,
      status: newOrder.status,
      value: newOrder.value,
      date: newOrder.date,
      technician: newOrder.technician,
      notes: newOrder.notes,
      items: newOrder.items,
    }])

    setScreen('orders')
    alert(`Orçamento #${quote.id} convertido com sucesso na Ordem #${newOrder.id}!`)
  }

  const handleDeleteQuote = async (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id))
    await supabase.from('quotes').delete().eq('id', id)
  }

  if (authLoading) {
    return (
      <div className={`flex h-screen items-center justify-center font-mono text-xs ${isDark ? 'bg-[#0a0a0a] text-neutral-400' : 'bg-slate-100 text-slate-500'}`}>
        Conectando com o banco de dados...
      </div>
    )
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={() => fetchData()} isDark={isDark} />
  }

  const safeClients = Array.isArray(clients) ? clients : []
  const selectedClientForPrint = orderToPrint ? safeClients.find(c => c.name.toLowerCase() === (orderToPrint.client || '').toLowerCase()) : undefined

  return (
    <div className={`flex h-screen overflow-hidden transition-colors ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-100 text-slate-900'}`}>
      <aside className={`hidden h-screen flex-shrink-0 flex-col border-r transition-colors md:flex ${
        isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white'
      }`} style={{ width: 230 }}>
        
        <div className={`flex flex-col gap-3 border-b p-4 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <AppLogo size={38} />
            <div>
              <div className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] bg-clip-text text-transparent">
                AndradeTech
              </div>
              <div className="font-mono text-[10px] text-neutral-400">Assistência Técnica</div>
            </div>
          </div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {NAV_ITEMS.map(item => {
            const isActive = screen === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScreen(item.id as Screen)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] text-white shadow-md shadow-blue-500/20'
                    : isDark ? 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className={`border-t p-3 pb-2 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Técnicos Online ({onlineUsers.length})
          </div>
          <div className="mb-3 max-h-24 space-y-1.5 overflow-y-auto px-1">
            {onlineUsers.map(u => (
              <div key={u.user_id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                <span className={`truncate text-[11px] font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`} title={u.email}>
                  {u.email ? u.email.split('@')[0] : 'Técnico'}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
              isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-red-400' : 'text-slate-500 hover:bg-slate-100 hover:text-red-500'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 md:hidden backdrop-blur-sm">
          <div className={`flex h-full w-64 flex-col border-r p-4 transition-colors ${
            isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white'
          }`}>
            <div className={`mb-4 flex items-center justify-between border-b pb-4 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <AppLogo size={32} />
                <span className="text-sm font-extrabold bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] bg-clip-text text-transparent">
                  AndradeTech
                </span>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1 text-neutral-400 hover:text-red-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-4">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>

            <div className="flex-1 space-y-1.5">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setScreen(item.id as Screen)
                    setMobileMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    screen === item.id
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] text-white shadow-md'
                      : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className={`mt-auto border-t pt-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                Técnicos Online ({onlineUsers.length})
              </div>
              <div className="mb-3 max-h-24 space-y-1.5 overflow-y-auto px-1">
                {onlineUsers.map(u => (
                  <div key={u.user_id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                    <span className={`truncate text-[11px] font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`} title={u.email}>
                      {u.email ? u.email.split('@')[0] : 'Técnico'}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:text-red-400"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Área Principal */}
      <main className="flex flex-1 flex-col overflow-hidden pb-14 md:pb-0">
        {screen === 'dashboard' && (
          <DashboardScreen
            orders={orders}
            quotes={quotes}
            statuses={statuses}
            isDark={isDark}
            onNewOrder={() => { setOrderEditing(null); setShowOrderModal(true) }}
            onNewQuote={() => { setQuoteEditing(null); setShowQuoteModal(true) }}
            onNewClient={handleOpenNewClient}
            onEditOrder={(o) => { setOrderEditing(o); setShowOrderModal(true) }}
            onPrintOrder={(o) => setOrderToPrint(o)}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'orders' && (
          <OrdersScreen
            orders={orders}
            statuses={statuses}
            isDark={isDark}
            onNewOrder={() => { setOrderEditing(null); setShowOrderModal(true) }}
            onEditOrder={(o) => { setOrderEditing(o); setShowOrderModal(true) }}
            onPrintOrder={(o) => setOrderToPrint(o)}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'quotes' && (
          <QuotesScreen
            quotes={quotes}
            isDark={isDark}
            onNewQuote={() => { setQuoteEditing(null); setShowQuoteModal(true) }}
            onEditQuote={(q) => { setQuoteEditing(q); setShowQuoteModal(true) }}
            onConvertToOrder={handleConvertToOrder}
            onDeleteQuote={handleDeleteQuote}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'clients' && (
          <ClientsScreen
            clients={clients}
            isDark={isDark}
            onNewClient={handleOpenNewClient}
            onEditClient={handleOpenEditClient}
            onDeleteClient={handleDeleteClient}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            services={services}
            products={products}
            statuses={statuses}
            categories={categories}
            isDark={isDark}
            onOpenProductModal={() => { setProductEditing(null); setShowProductModal(true) }}
            onOpenServiceModal={() => { setServiceEditing(null); setShowServiceModal(true) }}
            onOpenStatusModal={() => setShowStatusModal(true)}
            onOpenCategoryModal={() => { setCategoryEditing(null); setShowCategoryModal(true) }}
            onEditProduct={(p) => { setProductEditing(p); setShowProductModal(true) }}
            onEditService={(s) => { setServiceEditing(s); setShowServiceModal(true) }}
            onEditStatus={(st) => { setStatusEditing(st); setShowStatusModal(true) }}
            onEditCategory={(cat) => { setCategoryEditing(cat); setShowCategoryModal(true) }}
            onDeleteProduct={async (id) => {
              setProducts(prev => prev.filter(p => p.id !== id))
              await supabase.from('products').delete().eq('id', id)
            }}
            onDeleteService={async (id) => {
              setServices(prev => prev.filter(s => s.id !== id))
              await supabase.from('services').delete().eq('id', id)
            }}
            onDeleteStatus={async (id) => {
              setStatuses(prev => prev.filter(s => s.id !== id))
              await supabase.from('statuses').delete().eq('id', id)
            }}
            onDeleteCategory={async (id) => {
              setCategories(prev => prev.filter(c => c.id !== id))
              await supabase.from('categories').delete().eq('id', id)
            }}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Barra Inferior Mobile */}
      <nav className={`fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t px-2 md:hidden transition-colors ${
        isDark ? 'border-neutral-800 bg-[#0d0d0d]' : 'border-slate-200 bg-white shadow-lg'
      }`}>
        {NAV_ITEMS.map(item => {
          const isActive = screen === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id as Screen)}
              className="flex flex-1 flex-col items-center justify-center py-1 transition-colors"
              style={{ color: isActive ? '#0066FF' : (isDark ? '#666' : '#94A3B8') }}
            >
              {item.icon}
              <span className="mt-0.5 font-mono text-[10px]">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Modais Globais */}
      {showOrderModal && (
        <OrderModal
          onClose={() => {
            setShowOrderModal(false)
            setOrderEditing(null)
          }}
          clients={clients}
          statuses={statuses}
          services={services}
          products={products}
          onSave={handleSaveOrder}
          onQuickNewClient={handleOpenNewClient}
          orderToEdit={orderEditing}
          isDark={isDark}
        />
      )}

      {showQuoteModal && (
        <QuoteModal
          onClose={() => {
            setShowQuoteModal(false)
            setQuoteEditing(null)
          }}
          clients={clients}
          services={services}
          products={products}
          onSave={handleSaveQuote}
          onConvertToOrder={handleConvertToOrder}
          onQuickNewClient={handleOpenNewClient}
          quoteToEdit={quoteEditing}
          isDark={isDark}
        />
      )}

      {showClientModal && (
        <ClientModal
          onClose={() => {
            setShowClientModal(false)
            setClientEditing(null)
          }}
          onSave={handleSaveClient}
          clientToEdit={clientEditing}
          isDark={isDark}
        />
      )}

      {/* Modais de Ajustes com Edição e Backdrop Blur */}
      {showProductModal && (
        <ProductModal
          onClose={() => {
            setShowProductModal(false)
            setProductEditing(null)
          }}
          productToEdit={productEditing}
          categories={categories}
          onSave={async (prod) => {
            setProducts(prev => {
              const exists = prev.some(p => p.id === prod.id)
              return exists ? prev.map(p => p.id === prod.id ? prod : p) : [prod, ...prev]
            })
            await supabase.from('products').upsert([prod])
          }}
          isDark={isDark}
        />
      )}

      {showServiceModal && (
        <ServiceModal
          onClose={() => {
            setShowServiceModal(false)
            setServiceEditing(null)
          }}
          serviceToEdit={serviceEditing}
          categories={categories}
          onSave={async (svc) => {
            setServices(prev => {
              const exists = prev.some(s => s.id === svc.id)
              return exists ? prev.map(s => s.id === svc.id ? svc : s) : [svc, ...prev]
            })
            await supabase.from('services').upsert([svc])
          }}
          isDark={isDark}
        />
      )}

      {showStatusModal && (
        <StatusModal
          onClose={() => {
            setShowStatusModal(false)
            setStatusEditing(null)
          }}
          statusToEdit={statusEditing}
          onSave={async (st) => {
            setStatuses(prev => {
              const exists = prev.some(s => s.id === st.id)
              return exists ? prev.map(s => s.id === st.id ? st : s) : [st, ...prev]
            })
            await supabase.from('statuses').upsert([st])
          }}
          isDark={isDark}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          onClose={() => {
            setShowCategoryModal(false)
            setCategoryEditing(null)
          }}
          categoryToEdit={categoryEditing}
          onSave={async (cat) => {
            setCategories(prev => {
              const exists = prev.some(c => c.id === cat.id)
              return exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat]
            })
            await supabase.from('categories').upsert([cat])
          }}
          isDark={isDark}
        />
      )}

      {orderToPrint && (
        <PrintModal
          order={orderToPrint}
          client={selectedClientForPrint}
          onClose={() => setOrderToPrint(null)}
        />
      )}
    </div>
  )
}