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
      category: category.trim() || 'Dispositivos',
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

// ─── Modal: Ordem de Serviço ──────────────────────────────────────────────────

function OrderModal({
  onClose,
  clients = [],
  statuses = [],
  services = [],
  products = [],
  onSave,
  onQuickNewClient,
  orderToEdit,
  isDark,
}: {
  onClose: () => void
  clients: Client[]
  statuses: CustomStatus[]
  services: CustomService[]
  products: Product[]
  onSave: (order: Order) => void
  onQuickNewClient: () => void
  orderToEdit?: Order | null
  isDark: boolean
}) {
  const safeClients = Array.isArray(clients) ? clients : []
  const safeStatuses = Array.isArray(statuses) ? statuses : []
  const safeServices = Array.isArray(services) ? services : []
  const safeProducts = Array.isArray(products) ? products : []

  const [client, setClient] = useState(orderToEdit?.client || (safeClients[0]?.name ?? ''))
  const [phone, setPhone] = useState(orderToEdit?.phone || '')
  const [device, setDevice] = useState(orderToEdit?.device || '')
  const [technician, setTechnician] = useState(orderToEdit?.technician || 'Admin')
  const [notes, setNotes] = useState(orderToEdit?.notes || '')
  const [status, setStatus] = useState(orderToEdit?.status || (safeStatuses[0]?.label ?? 'Entrada'))
  const [items, setItems] = useState<OrderItem[]>(
    orderToEdit?.items && orderToEdit.items.length > 0
      ? orderToEdit.items
      : [{ desc: orderToEdit?.service || '', qty: 1, unit: orderToEdit?.value || 0 }]
  )

  useEffect(() => {
    if (!phone && client && safeClients.length > 0) {
      const found = safeClients.find(c => c.name === client)
      if (found) setPhone(found.phone)
    }
  }, [client, safeClients])

  const total = items.reduce((s, i) => s + (Number(i.qty || 1) * Number(i.unit || 0)), 0)

  const handleClientSelectChange = (name: string) => {
    setClient(name)
    const found = safeClients.find(c => c.name === name)
    if (found) setPhone(found.phone)
  }

  const handleApplyPreset = (value: string, index: number) => {
    const svc = safeServices.find(s => s.name === value)
    if (svc) {
      setItems(items.map((it, idx) => idx === index ? { ...it, desc: svc.name, unit: svc.default_price } : it))
      return
    }
    const prod = safeProducts.find(p => p.name === value)
    if (prod) {
      setItems(items.map((it, idx) => idx === index ? { ...it, desc: prod.name, unit: prod.sale_price } : it))
    }
  }

  const handleSave = (e: React.FormEvent, sendToWhatsApp = false) => {
    e.preventDefault()
    if (!client.trim() || !device.trim()) {
      alert('Selecione o cliente e informe o aparelho!')
      return
    }

    const firstService = items[0]?.desc?.trim() || 'Serviço Técnico'
    const savedOrder: Order = {
      id: orderToEdit?.id || `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      client,
      phone,
      device,
      service: firstService,
      status,
      value: total,
      date: orderToEdit?.date || new Date().toLocaleDateString('pt-BR'),
      technician: technician || 'Admin',
      notes,
      items,
    }

    onSave(savedOrder)

    if (sendToWhatsApp && phone) {
      const msg = `*AndradeTech - Ordem de Serviço #${savedOrder.id}*\n\n` +
                  `Olá, *${client}*!\n` +
                  `*Aparelho:* ${device}\n` +
                  `*Serviço:* ${firstService}\n` +
                  `*Situação:* ${status}\n` +
                  `*Valor Total:* R$ ${total.toFixed(2)}\n\n` +
                  `Qualquer dúvida estamos à disposição!`
      window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <form onSubmit={(e) => handleSave(e, false)} className={`flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">
              {orderToEdit ? `EDITANDO ${orderToEdit.id}` : 'NOVO REGISTRO'}
            </div>
            <h2 className="text-sm font-bold sm:text-base">
              {orderToEdit ? 'Editar Ordem de Serviço' : 'Registrar Ordem de Serviço'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Cliente *</label>
                <button
                  type="button"
                  onClick={onQuickNewClient}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2 py-0.5 rounded shadow-sm hover:opacity-95"
                  title="Cadastrar Novo Cliente"
                >
                  <span>+</span> Cliente
                </button>
              </div>
              <select
                value={client}
                onChange={e => handleClientSelectChange(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>Selecione um cliente...</option>
                {safeClients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">WhatsApp / Tel</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Aparelho *</label>
              <input
                value={device}
                onChange={e => setDevice(e.target.value)}
                placeholder="Ex: Notebook Lenovo, Galaxy S21..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Situação</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={inputClass}
              >
                {safeStatuses.map(s => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Técnico Responsável</label>
            <input
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Diagnóstico / Defeito</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Relato do problema, observações do aparelho..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Serviços & Peças</label>
              <button
                type="button"
                onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-semibold text-[#0066FF] hover:text-[#8A2BE2]"
              >
                + Adicionar Item
              </button>
            </div>

            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b font-mono uppercase ${isDark ? 'bg-black/60 text-neutral-400 border-neutral-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <th className="px-3 py-2 text-left">Item (Serviço ou Peça)</th>
                    <th className="w-12 px-2 py-2 text-center">Qtd</th>
                    <th className="w-20 px-2 py-2 text-right">Unit</th>
                    <th className="w-20 px-2 py-2 text-right">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className={`border-t ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row">
                          <input
                            value={item.desc}
                            onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                            placeholder="Descrição..."
                            className="w-full bg-transparent outline-none"
                          />
                          <select
                            onChange={e => {
                              if (e.target.value) handleApplyPreset(e.target.value, i)
                            }}
                            className={`rounded border text-[10px] outline-none ${isDark ? 'bg-[#222] border-neutral-700 text-neutral-300' : 'bg-slate-100 border-slate-300 text-slate-700'}`}
                            defaultValue=""
                          >
                            <option value="" disabled>Catálogo</option>
                            <optgroup label="Serviços">
                              {safeServices.map(s => (
                                <option key={s.id} value={s.name}>🛠️ {s.name} (R${s.default_price})</option>
                              ))}
                            </optgroup>
                            <optgroup label="Produtos / Peças">
                              {safeProducts.map(p => (
                                <option key={p.id} value={p.name}>📦 {p.name} (R${p.sale_price})</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: Math.max(1, +e.target.value) } : it))}
                          className="w-full bg-transparent text-center font-mono outline-none"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit || ''}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, unit: +e.target.value } : it))}
                          placeholder="0"
                          className="w-full bg-transparent text-right font-mono outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-neutral-400">
                        R$ {((Number(item.qty || 1)) * (Number(item.unit || 0))).toFixed(2)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => items.length > 1 && setItems(items.filter((_, j) => j !== i))}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`border-t font-mono ${isDark ? 'border-neutral-700 bg-black/40' : 'border-slate-200 bg-slate-50'}`}>
                    <td colSpan={3} className="px-3 py-2 text-right uppercase text-neutral-400">Total:</td>
                    <td className="px-2 py-2 text-right font-bold text-[#0066FF]">R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className={`flex flex-col-reverse items-center justify-between gap-2 border-t px-5 py-3 sm:flex-row ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="w-full px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600 sm:w-auto">
            Cancelar
          </button>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="submit" className="flex-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-blue-500/20 sm:flex-initial">
              Salvar OS
            </button>
            <button type="button" onClick={(e) => handleSave(e, true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 sm:flex-initial">
              Salvar & Whats
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Modal: Orçamento ─────────────────────────────────────────────────────────

function QuoteModal({
  onClose,
  clients = [],
  services = [],
  products = [],
  onSave,
  onConvertToOrder,
  onQuickNewClient,
  quoteToEdit,
  isDark,
}: {
  onClose: () => void
  clients: Client[]
  services: CustomService[]
  products: Product[]
  onSave: (quote: Quote) => void
  onConvertToOrder: (quote: Quote) => void
  onQuickNewClient: () => void
  quoteToEdit?: Quote | null
  isDark: boolean
}) {
  const safeClients = Array.isArray(clients) ? clients : []
  const safeServices = Array.isArray(services) ? services : []
  const safeProducts = Array.isArray(products) ? products : []

  const [client, setClient] = useState(quoteToEdit?.client || (safeClients[0]?.name ?? ''))
  const [phone, setPhone] = useState(quoteToEdit?.phone || '')
  const [device, setDevice] = useState(quoteToEdit?.device || '')
  const [description, setDescription] = useState(quoteToEdit?.description || '')
  const [validDays, setValidDays] = useState('7')
  const [status, setStatus] = useState<'Pendente' | 'Aprovado' | 'Cancelado'>(quoteToEdit?.status || 'Pendente')
  const [items, setItems] = useState<OrderItem[]>(
    quoteToEdit?.items && quoteToEdit.items.length > 0
      ? quoteToEdit.items
      : [{ desc: '', qty: 1, unit: 0 }]
  )

  useEffect(() => {
    if (!phone && client && safeClients.length > 0) {
      const found = safeClients.find(c => c.name === client)
      if (found) setPhone(found.phone)
    }
  }, [client, safeClients])

  const total = items.reduce((s, i) => s + (Number(i.qty || 1) * Number(i.unit || 0)), 0)

  const handleClientSelectChange = (name: string) => {
    setClient(name)
    const found = safeClients.find(c => c.name === name)
    if (found) setPhone(found.phone)
  }

  const handleApplyPreset = (value: string, index: number) => {
    const svc = safeServices.find(s => s.name === value)
    if (svc) {
      setItems(items.map((it, idx) => idx === index ? { ...it, desc: svc.name, unit: svc.default_price } : it))
      return
    }
    const prod = safeProducts.find(p => p.name === value)
    if (prod) {
      setItems(items.map((it, idx) => idx === index ? { ...it, desc: prod.name, unit: prod.sale_price } : it))
    }
  }

  const handleSave = (e: React.FormEvent, sendWhatsApp = false) => {
    e.preventDefault()
    if (!client.trim() || !device.trim()) {
      alert('Selecione o cliente e informe o aparelho!')
      return
    }

    const expDate = new Date()
    expDate.setDate(expDate.getDate() + (Number(validDays) || 7))

    const quoteData: Quote = {
      id: quoteToEdit?.id || `ORC-${Math.floor(1000 + Math.random() * 9000)}`,
      client,
      phone,
      device,
      description: description || items[0]?.desc || 'Proposta de serviço',
      value: total,
      validUntil: quoteToEdit?.validUntil || expDate.toLocaleDateString('pt-BR'),
      createdAt: quoteToEdit?.createdAt || new Date().toLocaleDateString('pt-BR'),
      status,
      items,
    }

    onSave(quoteData)

    if (status === 'Aprovado' && (!quoteToEdit || quoteToEdit.status !== 'Aprovado')) {
      const confirmConvert = confirm('O orçamento foi marcado como Aprovado. Deseja gerar a Ordem de Serviço agora?')
      if (confirmConvert) {
        onConvertToOrder(quoteData)
      }
    }

    if (sendWhatsApp && phone) {
      const msg = `*AndradeTech - Proposta de Orçamento #${quoteData.id}*\n\n` +
                  `Olá, *${client}*!\n` +
                  `*Aparelho:* ${device}\n` +
                  `*Situação:* ${status}\n` +
                  `*Descrição:* ${quoteData.description}\n` +
                  `*Valor Total:* R$ ${total.toFixed(2)}\n\n` +
                  `Aguardamos sua confirmação!`
      window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-4 backdrop-blur-sm">
      <form onSubmit={(e) => handleSave(e, false)} className={`flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl border shadow-2xl transition-colors ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#8A2BE2] font-bold">
              {quoteToEdit ? `EDITANDO ${quoteToEdit.id}` : 'PROPOSTA COMERCIAL'}
            </div>
            <h2 className="text-sm font-bold sm:text-base">
              {quoteToEdit ? 'Editar Orçamento' : 'Criar Novo Orçamento'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Cliente *</label>
                <button
                  type="button"
                  onClick={onQuickNewClient}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2 py-0.5 rounded shadow-sm hover:opacity-95"
                  title="Cadastrar Novo Cliente"
                >
                  <span>+</span> Cliente
                </button>
              </div>
              <select
                value={client}
                onChange={e => handleClientSelectChange(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>Selecione um cliente...</option>
                {safeClients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">WhatsApp / Tel</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Aparelho *</label>
              <input
                value={device}
                onChange={e => setDevice(e.target.value)}
                placeholder="Ex: iPhone 12, Notebook Acer..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Situação</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className={`${inputClass} font-semibold ${
                  status === 'Aprovado' ? 'text-green-500' :
                  status === 'Cancelado' ? 'text-red-500' : 'text-[#8A2BE2]'
                }`}
              >
                <option value="Pendente">🟡 Pendente</option>
                <option value="Aprovado">🟢 Aprovado (Vira OS)</option>
                <option value="Cancelado">🔴 Cancelado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Validade</label>
              <select
                value={validDays}
                onChange={e => setValidDays(e.target.value)}
                className={inputClass}
              >
                <option value="3">3 dias</option>
                <option value="7">7 dias (padrão)</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Resumo do Diagnóstico</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva a falha constatada e o que precisa ser substituído..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">Itens / Peças / Serviços</label>
              <button
                type="button"
                onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-semibold text-[#8A2BE2] hover:text-[#0066FF]"
              >
                + Adicionar Item
              </button>
            </div>

            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b font-mono uppercase ${isDark ? 'bg-black/60 text-neutral-400 border-neutral-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="w-12 px-2 py-2 text-center">Qtd</th>
                    <th className="w-20 px-2 py-2 text-right">Unit</th>
                    <th className="w-20 px-2 py-2 text-right">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className={`border-t ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row">
                          <input
                            value={item.desc}
                            onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                            placeholder="Peça ou mão de obra..."
                            className="w-full bg-transparent outline-none"
                          />
                          <select
                            onChange={e => {
                              if (e.target.value) handleApplyPreset(e.target.value, i)
                            }}
                            className={`rounded border text-[10px] outline-none ${isDark ? 'bg-[#222] border-neutral-700 text-neutral-300' : 'bg-slate-100 border-slate-300 text-slate-700'}`}
                            defaultValue=""
                          >
                            <option value="" disabled>Catálogo</option>
                            <optgroup label="Serviços">
                              {safeServices.map(s => (
                                <option key={s.id} value={s.name}>🛠️ {s.name} (R${s.default_price})</option>
                              ))}
                            </optgroup>
                            <optgroup label="Produtos / Peças">
                              {safeProducts.map(p => (
                                <option key={p.id} value={p.name}>📦 {p.name} (R${p.sale_price})</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: Math.max(1, +e.target.value) } : it))}
                          className="w-full bg-transparent text-center font-mono outline-none"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit || ''}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, unit: +e.target.value } : it))}
                          placeholder="0"
                          className="w-full bg-transparent text-right font-mono outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-neutral-400">
                        R$ {((Number(item.qty || 1)) * (Number(item.unit || 0))).toFixed(2)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => items.length > 1 && setItems(items.filter((_, j) => j !== i))}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`border-t font-mono ${isDark ? 'border-neutral-700 bg-black/40' : 'border-slate-200 bg-slate-50'}`}>
                    <td colSpan={3} className="px-3 py-2 text-right uppercase text-neutral-400">Total:</td>
                    <td className="px-2 py-2 text-right font-bold text-[#8A2BE2]">R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className={`flex flex-col-reverse items-center justify-between gap-2 border-t px-5 py-3 sm:flex-row ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="w-full px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600 sm:w-auto">
            Cancelar
          </button>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="submit" className="flex-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-purple-500/20 sm:flex-initial">
              {quoteToEdit ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
            </button>
            <button type="button" onClick={(e) => handleSave(e, true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 sm:flex-initial">
              Salvar & Whats
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Modal: Cliente ───────────────────────────────────────────────────────────

function ClientModal({
  onClose,
  onSave,
  clientToEdit,
  isDark,
}: {
  onClose: () => void
  onSave: (client: Client) => void
  clientToEdit?: Client | null
  isDark: boolean
}) {
  const [name, setName] = useState(clientToEdit?.name || '')
  const [phone, setPhone] = useState(clientToEdit?.phone || '')
  const [cpf, setCpf] = useState(clientToEdit?.cpf || '')
  const [address, setAddress] = useState(clientToEdit?.address || '')
  const [city, setCity] = useState(clientToEdit?.city || '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Nome do cliente é obrigatório')

    onSave({
      id: clientToEdit?.id || `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name,
      phone,
      cpf,
      address,
      city: city || 'São João do Paraíso',
      totalOrders: clientToEdit?.totalOrders || 0,
      totalSpent: clientToEdit?.totalSpent || 0,
      lastService: clientToEdit?.lastService || 'Cadastrado no sistema',
      devices: clientToEdit?.devices || [],
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
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">
              {clientToEdit ? `EDITANDO ${clientToEdit.id}` : 'CADASTRO'}
            </div>
            <h2 className="text-base font-bold">
              {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome Completo *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Rafael Mendonça" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Telefone / WhatsApp *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(DDD) 99999-9999" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">CPF / CNPJ</label>
              <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Endereço</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro..." className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Cidade / Estado</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: São João do Paraíso, BA" className={inputClass} />
          </div>
        </div>
        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 shadow-md shadow-blue-500/20">
            {clientToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
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
  const [showProductModal, setShowProductModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)

  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [quoteEditing, setQuoteEditing] = useState<Quote | null>(null)
  const [clientEditing, setClientEditing] = useState<Client | null>(null)
  const [productEditing, setProductEditing] = useState<Product | null>(null)
  const [serviceEditing, setServiceEditing] = useState<CustomService | null>(null)
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [services, setServices] = useState<CustomService[]>(DEFAULT_SERVICES)
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS)
  const [statuses, setStatuses] = useState<CustomStatus[]>(DEFAULT_STATUSES)

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
            isDark={isDark}
            onOpenProductModal={() => { setProductEditing(null); setShowProductModal(true) }}
            onOpenServiceModal={() => { setServiceEditing(null); setShowServiceModal(true) }}
            onOpenStatusModal={() => setShowStatusModal(true)}
            onEditProduct={(p) => { setProductEditing(p); setShowProductModal(true) }}
            onEditService={(s) => { setServiceEditing(s); setShowServiceModal(true) }}
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
          onClose={() => setShowStatusModal(false)}
          onSave={async (st) => {
            setStatuses(prev => [...prev, st])
            await supabase.from('statuses').insert([st])
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