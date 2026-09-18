import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Screen = 'dashboard' | 'orders' | 'quotes' | 'clients' | 'pdv' | 'settings'

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
  status: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Cancelado'
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
  brand?: string
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

interface Sale {
  id: string
  client: string
  phone: string
  cpf: string
  payment_method: 'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito'
  items: OrderItem[]
  total: number
  date: string
}

// ─── Constantes Globais ───────────────────────────────────────────────────────

const LOGO_URL = 'https://yqpgdnztjoplteltassu.supabase.co/storage/v1/object/public/public-assets/logo.png'

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: '1', label: 'Entrada', dot: '#64748B' },
  { id: '2', label: 'Orçamento', dot: '#F59E0B' },
  { id: '3', label: 'Em Análise', dot: '#007BFF' },
  { id: '4', label: 'Aguardando Aprovação', dot: '#EAB308' },
  { id: '5', label: 'Aguardando Peça', dot: '#8A2BE2' },
  { id: '6', label: 'Finalizado', dot: '#10B981' },
  { id: '7', label: 'Entregue', dot: '#059669' },
  { id: '8', label: 'Cancelado', dot: '#EF4444' },
]

const DEFAULT_SERVICES: CustomService[] = [
  { id: '1', name: 'Troca de Tela', default_price: 350, category: 'Hardware' },
  { id: '2', name: 'Reparo de Bateria', default_price: 180, category: 'Hardware' },
  { id: '3', name: 'Formatação + SO', default_price: 150, category: 'Software' },
  { id: '4', name: 'Limpeza Interna e Pasta', default_price: 120, category: 'Manutenção' },
  { id: '5', name: 'Troca de Conector de Carga', default_price: 130, category: 'Hardware' },
  { id: '6', name: 'Diagnóstico e Orçamento', default_price: 0, category: 'Diagnóstico' },
]

const DEFAULT_PRODUCT_CATEGORIES = [
  'Acessórios',
  'Armazenamento',
  'Upgrade',
  'Telas',
  'Fontes',
  'Peças',
  'Geral',
]

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1001', name: 'SSD 480GB Kingston', brand: 'Kingston', category: 'Armazenamento', cost_price: 130, sale_price: 240, stock: 4 },
  { id: '1002', name: 'Tela iPhone 11 Incell', brand: 'Apple', category: 'Telas', cost_price: 110, sale_price: 250, stock: 2 },
  { id: '1003', name: 'Fonte ATX 500W', brand: 'Corsair', category: 'Fontes', cost_price: 160, sale_price: 280, stock: 3 },
  { id: '1004', name: 'Cabo USB-C Trançado 1.5m', brand: 'Baseus', category: 'Acessórios', cost_price: 15, sale_price: 45, stock: 10 },
  { id: '1005', name: 'Memória RAM 16GB DDR4 3200MHz', brand: 'Asgard', category: 'Upgrade', cost_price: 180, sale_price: 290, stock: 5 },
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
    id: 'pdv',
    label: 'PDV (Vendas)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
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

// Função auxiliar para checar se a OS foi finalizada
function isOrderFinalized(status?: string) {
  const s = (status || '').trim().toLowerCase()
  return s === 'finalizado' || s === 'concluído' || s === 'concluido' || s === 'entregue'
}

// ─── Componentes Auxiliares ───────────────────────────────────────────────────

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

function WhatsAppBtn({ phone, label = '', orderDetails }: { phone: string; label?: string; orderDetails?: Partial<Order> }) {
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
      className="inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full p-2 text-white transition-all bg-[#25D366] hover:opacity-90 active:scale-95 shadow-sm"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
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

// ─── Modal de Emissão (OS e Vendas PDV) ─────────────────────────────────────────

function PrintModal({
  order,
  client,
  onClose,
  isDark,
  documentKind = 'order',
}: {
  order: Order
  client?: Client
  onClose: () => void
  isDark: boolean
  documentKind?: 'order' | 'sale' | 'quote'
}) {
  const [printType, setPrintType] = useState<'a4' | 'thermal'>('a4')

  const items = (order.items && order.items.length > 0)
    ? order.items
    : [{ desc: order.service || 'Item de Serviço / Venda', qty: 1, unit: order.value || 0 }]

  const isSale = documentKind === 'sale' || order.id.startsWith('VD-')
  const isQuote = documentKind === 'quote'
  const documentTitle = isQuote ? 'ORÇAMENTO' : isSale ? 'CUPOM NÃO FISCAL DE VENDA' : 'ORDEM DE SERVIÇO'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between px-5 py-3.5 border-b print:hidden ${
          isDark ? 'border-neutral-800 bg-[#161616]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm sm:text-base">{isSale ? 'Comprovante de Venda' : 'Ordem de Serviço'}</span>
            <div className={`flex rounded-lg border p-0.5 ${isDark ? 'border-neutral-700 bg-black' : 'border-slate-300 bg-white'}`}>
              <button
                type="button"
                onClick={() => setPrintType('a4')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  printType === 'a4' ? 'bg-[#0066FF] text-white' : 'text-neutral-400'
                }`}
              >
                📄 Folha A4
              </button>
              <button
                type="button"
                onClick={() => setPrintType('thermal')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  printType === 'thermal' ? 'bg-[#8A2BE2] text-white' : 'text-neutral-400'
                }`}
              >
                🧾 Cupom 80mm
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
                  <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-1 rounded border border-slate-300 font-bold">
                    {documentTitle}
                  </span>
                  <div className="text-xl font-mono font-black text-blue-600 mt-1">{order.id}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Data: {order.date}</div>
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
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">DETALHES DA OPERAÇÃO</div>
                  <div className="font-bold text-sm text-slate-800">{isSale ? 'Venda de Produtos / PDV' : order.device}</div>
                  <div className="text-[11px] text-slate-600">Forma / Situação: <span className="font-bold text-slate-800">{order.status}</span></div>
                  <div className="text-[11px] text-slate-600">Responsável: {order.technician}</div>
                </div>
              </div>

              {order.notes && (
                <div className="border border-slate-200 rounded-lg p-3 mb-5 bg-white">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">OBSERVAÇÕES</div>
                  <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">{order.notes}</div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] text-slate-600 uppercase">
                    <tr>
                      <th className="p-2.5">Descrição do Item / Peça</th>
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
                      <td colSpan={3} className="p-3 text-right uppercase font-bold text-slate-700">{isQuote ? 'Valor Total do Orçamento:' : 'Valor Total Pago:'}</td>
                      <td className="p-3 text-right text-sm font-black text-blue-600">R$ {Number(order.value || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 border-t-2 border-slate-300 pt-4 text-[10px] text-slate-700 leading-relaxed">
                <div className="font-mono uppercase font-black text-slate-800 mb-1">TERMO DE GARANTIA (Art. 26, II, Lei 8.078/90 - CDC)</div>
                <p>Este serviço e as peças substituídas possuem garantia legal de 90 (noventa) dias, contados a partir da data de entrega do produto.</p>
                <p>A garantia cobre exclusivamente defeitos no reparo realizado ou nas peças trocadas sob condições normais de uso.</p>
                <p>A garantia será anulada em caso de mau uso, quedas, contato com líquidos/oxidação, variações elétricas ou caso o aparelho seja aberto por terceiros sem nossa autorização.</p>
                <p>Em caso de nova falha coberta, a assistência tem o prazo legal de até 30 dias para sanar o vício (Art. 18, CDC).</p>
              </div>

              <div className="grid grid-cols-2 gap-10 text-center pt-8">
                <div>
                  <div className="border-t border-slate-400 w-full mb-1"></div>
                  <div className="font-bold text-[11px] text-slate-800">{order.client}</div>
                  <div className="text-[10px] text-slate-500">Cliente</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-full mb-1"></div>
                  <div className="font-bold text-[11px] text-slate-800">AndradeTech</div>
                  <div className="text-[10px] text-slate-500">Vendedor / Responsável</div>
                </div>
              </div>
            </div>
          )}

          {printType === 'thermal' && (
            <div id="print-area" className="w-[80mm] bg-white text-black p-4 rounded shadow-md border border-neutral-300 font-mono text-[11px] leading-tight print:m-0 print:p-0 print:border-none print:shadow-none print:w-[80mm]">
              <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                <div className="font-black text-sm">ANDRADETECH</div>
                <div className="text-[9px]">{isQuote ? 'Orçamento / Proposta Comercial' : 'Comprovante de Venda / PDV'}</div>
                <div className="text-[9px]">São João do Paraíso - Bahia</div>
                <div className="text-[9px]">WhatsApp: (73) 98834-3028</div>
              </div>

              <div className="text-center font-bold text-xs py-1 border-b border-dashed border-black mb-2">
                {isQuote ? 'ORÇAMENTO' : 'VENDA'} #{order.id}
              </div>

              <div className="space-y-1 mb-2 border-b border-dashed border-black pb-2 text-[10px]">
                <div><b>Data:</b> {order.date}</div>
                <div><b>Cliente:</b> {order.client}</div>
                <div><b>{isQuote ? 'Status:' : 'Pagamento:'}</b> {order.status}</div>
              </div>

              <div className="mb-2 border-b border-dashed border-black pb-2">
                <div className="font-bold text-[10px] mb-1">ITENS:</div>
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="truncate pr-1">{it.qty}x {it.desc}</span>
                    <span className="font-bold whitespace-nowrap">R$ {(Number(it.qty || 1) * Number(it.unit || 0)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-xs py-1 border-b border-dashed border-black mb-3">
                <span>{isQuote ? 'VALOR TOTAL:' : 'TOTAL PAGO:'}</span>
                <span>R$ {Number(order.value || 0).toFixed(2)}</span>
              </div>

              <div className="text-center pt-4">
                <div className="border-t border-black w-4/5 mx-auto mb-1"></div>
                <div className="text-[9px]">Obrigado pela preferência!</div>
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-black text-[8px] leading-tight">
                <div className="font-black mb-1">TERMO DE GARANTIA (Art. 26, II, Lei 8.078/90 - CDC)</div>
                <div>Este serviço e as peças substituídas possuem garantia legal de 90 (noventa) dias, contados a partir da data de entrega do produto.</div>
                <div>A garantia cobre exclusivamente defeitos no reparo realizado ou nas peças trocadas sob condições normais de uso.</div>
                <div>A garantia será anulada em caso de mau uso, quedas, contato com líquidos/oxidação, variações elétricas ou caso o aparelho seja aberto por terceiros sem nossa autorização.</div>
                <div>Em caso de nova falha coberta, a assistência tem o prazo legal de até 30 dias para sanar o vício (Art. 18, CDC).</div>
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

// ─── Telas Principais ─────────────────────────────────────────────────────────

const DashboardScreen = ({
  orders = [],
  quotes = [],
  statuses = [],
  isDark,
  onNewOrder,
  onNewQuote,
  onNewClient,
  onEditOrder,
  onPrintOrder,
  onOpenMenu,
}: {
  orders: Order[]
  quotes: Quote[]
  statuses: CustomStatus[]
  isDark: boolean
  onNewOrder: () => void
  onNewQuote: () => void
  onNewClient: () => void
  onEditOrder: (order: Order) => void
  onPrintOrder: (order: Order) => void
  onOpenMenu: () => void
}) => {
  const [search, setSearch] = useState('')

  const safeOrders = Array.isArray(orders) ? orders : []
  const safeQuotes = Array.isArray(quotes) ? quotes : []

  const openOrders = safeOrders.filter(o => o && !isOrderFinalized(o.status) && o.status !== 'Cancelado').length
  const completedOrders = safeOrders.filter(o => o && isOrderFinalized(o.status)).length
  const pendingQuotes = safeQuotes.filter(q => q && q.status === 'Pendente').length
  const totalRevenue = safeOrders.filter(o => o && o.status !== 'Cancelado').reduce((sum, o) => sum + Number(o.value || 0), 0)

  const filteredOrders = safeOrders.filter(o =>
    o && (
      (o.client || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.device || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Visão Geral"
        isDark={isDark}
        onOpenMobileMenu={onOpenMenu}
        onNewOrder={onNewOrder}
        onNewQuote={onNewQuote}
        onNewClient={onNewClient}
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por OS, cliente, aparelho..."
            className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-xs outline-none transition-colors sm:text-sm ${
              isDark ? 'border-neutral-800 bg-[#111] text-white focus:border-[#0066FF]' : 'border-slate-200 bg-white text-slate-900 focus:border-[#0066FF]'
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {[
            { label: 'Em Aberto', value: openOrders.toString(), sub: 'serviços ativos', color: 'text-[#0066FF]' },
            { label: 'Concluídos', value: completedOrders.toString(), sub: 'finalizados', color: 'text-green-500' },
            { label: 'Orçamentos', value: pendingQuotes.toString(), sub: 'pendentes', color: 'text-[#8A2BE2]' },
            { label: 'Previsto', value: `R$ ${totalRevenue.toFixed(0)}`, sub: 'total faturado', color: isDark ? 'text-white' : 'text-slate-800' },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-xl border p-3 sm:p-4 transition-colors ${
              isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
            }`}>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{kpi.label}</span>
              <div className={`mt-1 text-lg font-bold tracking-tight sm:text-2xl ${kpi.color}`}>{kpi.value}</div>
              <div className="mt-0.5 font-mono text-[10px] text-neutral-400 sm:text-xs">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className={`overflow-hidden rounded-xl border transition-colors ${
          isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Ordens de Serviço Recentes</span>
            <span className="font-mono text-[11px] text-neutral-400">{safeOrders.length} cadastradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead>
                <tr className={`border-b text-left text-neutral-400 ${isDark ? 'bg-[#0e0e0e] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                  <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cliente / Contato</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Aparelho</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Situação</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                  <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>}
                        title="Nenhuma ordem recente"
                        sub="Registre uma nova OS ou Orçamento"
                        isDark={isDark}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 10).map(order => {
                    const finalized = isOrderFinalized(order.status)
                    return (
                      <tr key={order.id} className={isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#0066FF]">{order.id}</td>
                        <td className="px-3 py-2.5">
                          <div className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{order.client}</div>
                          <div className="font-mono text-[10px] text-neutral-400">{order.phone || 'Sem telefone'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-neutral-400">{order.device}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={order.status} statuses={statuses} /></td>
                        <td className={`px-3 py-2.5 font-mono font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                          {order.value > 0 ? `R$ ${Number(order.value).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onPrintOrder(order)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-purple-500"
                              title="Imprimir OS / Cupom"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            </button>
                            {/* Oculta botão de editar se a OS estiver finalizada */}
                            {!finalized && (
                              <button
                                type="button"
                                onClick={() => onEditOrder(order)}
                                className="rounded p-1.5 text-neutral-400 hover:text-[#0066FF]"
                                title="Editar OS"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                            )}
                            <WhatsAppBtn phone={order.phone} orderDetails={order} />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersScreen({
  orders = [],
  statuses = [],
  isDark,
  onNewOrder,
  onEditOrder,
  onPrintOrder,
  onDeleteOrder,
  onOpenMenu,
}: {
  orders: Order[]
  statuses: CustomStatus[]
  isDark: boolean
  onNewOrder: () => void
  onEditOrder: (order: Order) => void
  onPrintOrder: (order: Order) => void
  onDeleteOrder: (id: string) => void
  onOpenMenu: () => void
}) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('Todos')

  const safeOrders = Array.isArray(orders) ? orders : []
  const safeStatuses = Array.isArray(statuses) ? statuses : []

  const filtered = filterStatus === 'Todos' ? safeOrders : safeOrders.filter(o => o && o.status === filterStatus)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Ordens de Serviço" isDark={isDark} onOpenMobileMenu={onOpenMenu} onNewOrder={onNewOrder}>
        <div className={`ml-2 flex items-center gap-1 rounded-lg border p-0.5 ${isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-slate-100'}`}>
          {(['list','kanban'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="rounded px-2 py-1 text-[11px] font-medium transition-all"
              style={{
                background: view === v ? 'linear-gradient(to right, #0066FF, #8A2BE2)' : 'transparent',
                color: view === v ? '#fff' : (isDark ? '#888' : '#555'),
              }}
            >
              {v === 'list' ? 'Lista' : 'Quadro'}
            </button>
          ))}
        </div>
      </Topbar>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {['Todos', ...safeStatuses.map(s => s.label)].map(s => {
            const isActive = filterStatus === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className="whitespace-nowrap rounded-full border px-3 py-1 font-mono text-xs transition-all"
                style={{
                  background: isActive ? 'rgba(0, 102, 255, 0.15)' : 'transparent',
                  color: isActive ? '#0066FF' : (isDark ? '#777' : '#555'),
                  borderColor: isActive ? '#0066FF' : (isDark ? '#262626' : '#E2E8F0'),
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {view === 'list' ? (
          <div className={`overflow-hidden rounded-xl border transition-colors ${
            isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className={`border-b text-left text-neutral-400 ${isDark ? 'bg-[#0e0e0e] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                    <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Cliente</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Aparelho</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Situação</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                    <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>}
                          title="Nenhuma ordem encontrada"
                          sub="Crie uma nova OS para começar"
                          isDark={isDark}
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map(order => {
                      const finalized = isOrderFinalized(order.status)
                      return (
                        <tr key={order.id} className={isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#0066FF]">{order.id}</td>
                          <td className="px-3 py-2.5">
                            <div className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{order.client}</div>
                            <div className="font-mono text-[10px] text-neutral-400">{order.phone || '—'}</div>
                          </td>
                          <td className="px-3 py-2.5 text-neutral-400">{order.device}</td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={order.status} statuses={statuses} />
                          </td>
                          <td className={`px-3 py-2.5 font-mono font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                            {order.value > 0 ? `R$ ${Number(order.value).toFixed(2)}` : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onPrintOrder(order)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-purple-500 hover:bg-neutral-800/50"
                                title="Imprimir OS / Cupom"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                              </button>
                              
                              {/* Oculta edição caso o serviço esteja finalizado */}
                              {!finalized && (
                                <button
                                  type="button"
                                  onClick={() => onEditOrder(order)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-[#0066FF] hover:bg-neutral-800/50"
                                  title="Editar OS"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                              )}

                              <WhatsAppBtn phone={order.phone} orderDetails={order} />

                              <button
                                type="button"
                                onClick={() => { if(confirm(`Excluir ${order.id}?`)) onDeleteOrder(order.id) }}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-800/50"
                                title="Excluir OS"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {safeStatuses.map(st => {
              const colOrders = safeOrders.filter(o => o && (o.status || '').toLowerCase() === (st.label || '').toLowerCase())
              return (
                <div key={st.id} className={`flex w-64 flex-shrink-0 flex-col rounded-xl border transition-colors ${
                  isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <div className={`flex items-center justify-between border-b px-3.5 py-2.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
                      <span className="font-mono text-xs font-semibold" style={{ color: st.dot }}>{st.label}</span>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-500'}`}>{colOrders.length}</span>
                  </div>
                  <div className="min-h-[140px] flex-1 space-y-2 p-2">
                    {colOrders.length === 0 ? (
                      <div className="py-8 text-center font-mono text-xs text-neutral-400">vazio</div>
                    ) : (
                      colOrders.map(order => {
                        const finalized = isOrderFinalized(order.status)
                        return (
                          <div key={order.id} className={`space-y-1.5 rounded-lg border p-3 ${
                            isDark ? 'border-neutral-800/80 bg-[#141414]' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#0066FF]">{order.id}</span>
                              <span className="font-mono text-[10px] text-neutral-400">{order.date}</span>
                            </div>
                            <div className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{order.client}</div>
                            <div className="text-[11px] text-neutral-400">{order.device}</div>
                            <div className={`flex items-center justify-between border-t pt-2 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
                              <span className="font-mono text-xs font-bold text-[#8A2BE2]">R$ {Number(order.value || 0).toFixed(2)}</span>
                              <div className="flex gap-1 items-center">
                                <button type="button" onClick={() => onPrintOrder(order)} className="p-1 text-neutral-400 hover:text-purple-500" title="Imprimir OS">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                </button>
                                {!finalized && (
                                  <button type="button" onClick={() => onEditOrder(order)} className="p-1 text-neutral-400 hover:text-[#0066FF]" title="Editar OS">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                  </button>
                                )}
                                <WhatsAppBtn phone={order.phone} orderDetails={order} />
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function QuotesScreen({
  quotes = [],
  isDark,
  onNewQuote,
  onEditQuote,
  onUpdateStatus,
  onPrintQuote,
  onDeleteQuote,
  onOpenMenu,
}: {
  quotes: Quote[]
  isDark: boolean
  onNewQuote: () => void
  onEditQuote: (quote: Quote) => void
  onUpdateStatus: (quote: Quote, status: Quote['status']) => void
  onPrintQuote: (quote: Quote) => void
  onDeleteQuote: (id: string) => void
  onOpenMenu: () => void
}) {
  const safeQuotes = Array.isArray(quotes) ? quotes : []

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Orçamentos & Propostas" isDark={isDark} onOpenMobileMenu={onOpenMenu} onNewQuote={onNewQuote} />

      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        <div className="flex items-center justify-between sm:hidden">
          <span className="font-mono text-xs text-neutral-400">{safeQuotes.length} orçamentos</span>
          <button
            type="button"
            onClick={onNewQuote}
            className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-3 py-1.5 text-xs font-semibold text-white shadow-md"
          >
            + Novo Orçamento
          </button>
        </div>

        <div className={`overflow-hidden rounded-xl border transition-colors ${
          isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs">
              <thead>
                <tr className={`border-b text-left text-neutral-400 ${isDark ? 'bg-[#0e0e0e] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                  <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cliente / Aparelho</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Resumo</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Validade</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Status</th>
                  <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                {safeQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>}
                        title="Nenhum orçamento cadastrado"
                        sub="Clique em '+ Orçamento' para gerar uma proposta"
                        isDark={isDark}
                      />
                    </td>
                  </tr>
                ) : (
                  safeQuotes.map(q => {
                    const isRejected = q.status === 'Reprovado' || q.status === 'Cancelado'
                    return (
                      <tr key={q.id} className={`${isRejected ? 'opacity-50 bg-neutral-900/20' : ''} ${isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#8A2BE2]">{q.id}</td>
                        <td className="px-3 py-2.5">
                          <div className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{q.client}</div>
                          <div className="text-[10px] text-neutral-400">{q.device}</div>
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 text-neutral-400">{q.description}</td>
                        <td className={`px-3 py-2.5 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>R$ {Number(q.value || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5 font-mono text-neutral-400">{q.validUntil}</td>
                        <td className="px-3 py-2.5">
                          <select
                            value={q.status}
                            disabled={isRejected}
                            onChange={e => onUpdateStatus(q, e.target.value as Quote['status'])}
                            className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-bold outline-none transition-colors ${
                              isRejected ? 'cursor-not-allowed border-red-500/30 bg-red-500/10 text-red-500' :
                              q.status === 'Aprovado' ? 'border-green-500/40 bg-green-500/10 text-green-600' :
                              'border-yellow-500/40 bg-yellow-500/10 text-yellow-600 cursor-pointer'
                            }`}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Aprovado">Aprovado (Vira OS)</option>
                            <option value="Reprovado">Reprovado</option>
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onPrintQuote(q)}
                              className="rounded p-1 text-neutral-400 hover:text-purple-500 transition-colors"
                              title="Imprimir Orçamento"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            </button>
                            <button
                              type="button"
                              disabled={isRejected}
                              onClick={() => onEditQuote(q)}
                              className={`rounded p-1 transition-colors ${isRejected ? 'opacity-30 cursor-not-allowed text-neutral-500' : 'text-neutral-400 hover:text-[#8A2BE2]'}`}
                              title={isRejected ? "Orçamento reprovado/desabilitado" : "Editar Orçamento"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => { if(confirm(`Descartar o orçamento ${q.id}?`)) onDeleteQuote(q.id) }}
                              className="rounded p-1 text-neutral-400 hover:text-red-500 transition-colors"
                              title="Descartar orçamento"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tela de PDV (Frente de Caixa) ────────────────────────────────────────────

function PDVScreen({
  products = [],
  clients = [],
  sales = [],
  isDark,
  onCompleteSale,
  onPrintSale,
  onDeleteSale,
  onOpenMenu,
}: {
  products: Product[]
  clients: Client[]
  sales: Sale[]
  isDark: boolean
  onCompleteSale: (sale: Sale) => void
  onPrintSale: (sale: Sale) => void
  onDeleteSale: (sale: Sale) => void
  onOpenMenu: () => void
}) {
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCpf, setClientCpf] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito'>('PIX')
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')

  const total = cart.reduce((acc, item) => acc + (item.product.sale_price * item.qty), 0)

  const productCategories = ['Todas', ...Array.from(new Set(products.map(p => p.category || 'Geral')))]

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todas' || (p.category || 'Geral') === selectedCategory
    const searchLower = productSearch.toLowerCase().trim()
    const matchesSearch = !searchLower ||
      p.id.toLowerCase().includes(searchLower) ||
      p.name.toLowerCase().includes(searchLower) ||
      (p.brand || '').toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower)
    return matchesCategory && matchesSearch
  })

  const handleSelectClient = (name: string) => {
    setSelectedClient(name)
    const found = clients.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (found) {
      setClientPhone(found.phone)
      setClientCpf(found.cpf)
    } else {
      setClientPhone('')
      setClientCpf('')
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Produto sem estoque disponível!')
      return
    }
    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id)
      if (exists) {
        if (exists.qty >= product.stock) {
          alert('Quantidade máxima em estoque atingida!')
          return prev
        }
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0])
        setProductSearch('')
      } else {
        const exactIdMatch = products.find(p => p.id.toLowerCase() === productSearch.trim().toLowerCase())
        if (exactIdMatch) {
          addToCart(exactIdMatch)
          setProductSearch('')
        }
      }
    }
  }

  const updateCartQty = (productId: string, qty: number, stock: number) => {
    if (qty > stock) {
      alert('Quantidade superior ao estoque disponível!')
      return
    }
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId))
      return
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, qty } : item))
  }

  const handleFinishSale = () => {
    if (cart.length === 0) {
      alert('Adicione ao menos um produto no carrinho!')
      return
    }

    const saleData: Sale = {
      id: `VD-${Math.floor(1000 + Math.random() * 9000)}`,
      client: selectedClient.trim() || 'Consumidor Final',
      phone: clientPhone,
      cpf: clientCpf,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        desc: `${item.product.name}${item.product.brand ? ` (${item.product.brand})` : ''} [Cod: ${item.product.id}]`,
        qty: item.qty,
        unit: item.product.sale_price,
      })),
      total,
      date: new Date().toLocaleDateString('pt-BR'),
    }

    onCompleteSale(saleData)
    setCart([])
    setSelectedClient('')
    setClientPhone('')
    setClientCpf('')
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Frente de Caixa (PDV)" isDark={isDark} onOpenMobileMenu={onOpenMenu} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-bold">Catálogo de Produtos</h2>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Buscar por ID, Marca ou Nome..."
                    className={`w-full rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors ${
                      isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
                {productCategories.map(cat => {
                  const isCatActive = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-mono transition-all border ${
                        isCatActive
                          ? 'bg-[#0066FF] text-white border-[#0066FF] font-bold shadow-sm'
                          : isDark
                          ? 'bg-[#181818] border-neutral-800 text-neutral-400 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-neutral-400 text-xs">
                    Nenhum produto encontrado para a busca ou categoria selecionada.
                  </div>
                ) : (
                  filteredProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                        p.stock <= 0
                          ? 'opacity-40 border-neutral-700 bg-neutral-900 pointer-events-none'
                          : isDark ? 'border-neutral-800 bg-[#181818] hover:border-[#0066FF]' : 'border-slate-200 bg-slate-50 hover:border-[#0066FF]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                            #{p.id}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-200 text-slate-700'}`}>
                            {p.category || 'Geral'}
                          </span>
                        </div>
                        <div className="font-bold text-xs mt-1 text-ellipsis overflow-hidden">{p.name}</div>
                        {p.brand && (
                          <div className="text-[10px] font-mono text-purple-400 mt-0.5">
                            Marca: {p.brand}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-500/20">
                        <span className="font-mono text-xs font-bold text-green-500">R$ {p.sale_price.toFixed(2)}</span>
                        <span className={`text-[10px] font-mono ${p.stock <= 2 ? 'text-amber-500 font-bold' : 'text-neutral-400'}`}>
                          Estoque: {p.stock}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'}`}>
              <h2 className="text-sm font-bold mb-3">Últimas Vendas Realizadas</h2>
              <div className="max-h-48 overflow-y-auto divide-y divide-neutral-500/10 text-xs">
                {sales.length === 0 ? (
                  <div className="text-center py-4 text-neutral-400">Nenhuma venda registrada ainda</div>
                ) : (
                  sales.slice(0, 5).map(s => (
                    <div key={s.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-bold">{s.client} <span className="font-normal text-neutral-400">({s.payment_method})</span></div>
                        <div className="text-[10px] text-neutral-400">{s.date} - #{s.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-green-500">R$ {s.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => onPrintSale(s)}
                          className="p-1 rounded text-neutral-400 hover:text-purple-500"
                          title="Imprimir Cupom"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSale(s)}
                          className="p-1 rounded text-neutral-400 hover:text-red-500"
                          title="Excluir Venda"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'}`}>
              <div>
                <h2 className="text-sm font-bold mb-3">Carrinho de Compras</h2>
                
                <div className="space-y-2 mb-4">
                  <select
                    value={selectedClient}
                    onChange={e => handleSelectClient(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Cliente (opcional, padrão: Consumidor Final)</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}{c.phone ? ` — ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="Telefone"
                      className={inputClass}
                    />
                    <input
                      value={clientCpf}
                      onChange={e => setClientCpf(e.target.value)}
                      placeholder="CPF na Nota"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="border-t border-b border-neutral-500/20 py-2 max-h-48 overflow-y-auto divide-y divide-neutral-500/10">
                  {cart.length === 0 ? (
                    <div className="text-center py-6 text-neutral-400 text-xs">Carrinho vazio</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="pr-2 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] text-blue-400">#{item.product.id}</span>
                            <span className="font-semibold">{item.product.name}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {item.product.brand ? `${item.product.brand} • ` : ''}R$ {item.product.sale_price.toFixed(2)} un
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.qty}
                            onChange={e => updateCartQty(item.product.id, Number(e.target.value), item.product.stock)}
                            className="w-12 text-center rounded border border-neutral-700 bg-transparent text-xs py-1"
                          />
                          <span className="font-mono font-bold w-16 text-right">R$ {(item.product.sale_price * item.qty).toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, 0, item.product.stock)}
                            className="text-neutral-400 hover:text-red-500 p-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Forma de Pagamento:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="PIX">⚡ PIX</option>
                    <option value="Dinheiro">💵 Dinheiro</option>
                    <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                    <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-500/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs uppercase font-mono text-neutral-400">Total a Pagar:</span>
                  <span className="text-xl font-black font-mono text-green-500">R$ {total.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleFinishSale}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Concluir Venda & Baixar Estoque</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientsScreen({
  clients = [],
  isDark,
  onNewClient,
  onEditClient,
  onDeleteClient,
  onOpenMenu,
}: {
  clients: Client[]
  isDark: boolean
  onNewClient: () => void
  onEditClient: (client: Client) => void
  onDeleteClient: (id: string) => void
  onOpenMenu: () => void
}) {
  const [search, setSearch] = useState('')
  const safeClients = Array.isArray(clients) ? clients : []
  const filtered = safeClients.filter(c =>
    c && ((c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search))
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Base de Clientes" isDark={isDark} onOpenMobileMenu={onOpenMenu} onNewClient={onNewClient} />

      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente ou tel..."
              className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition-colors sm:text-sm ${
                isDark ? 'border-neutral-800 bg-[#111] text-white focus:border-[#0066FF]' : 'border-slate-200 bg-white text-slate-900 focus:border-[#0066FF]'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={onNewClient}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-3 py-2 text-xs font-semibold text-white shadow-md hover:opacity-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            <span>+ Cliente</span>
          </button>
        </div>

        <div className={`overflow-hidden rounded-xl border transition-colors ${
          isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-xs">
              <thead>
                <tr className={`border-b text-left text-neutral-400 ${isDark ? 'bg-[#0e0e0e] border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                  <th className="px-3 py-2.5 font-mono uppercase">Nome</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Telefone</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cidade</th>
                  <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                        title="Nenhum cliente cadastrado"
                        sub="Toque em '+ Cliente' para cadastrar"
                        isDark={isDark}
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className={isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                      <td className={`px-3 py-2.5 font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{c.name}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">{c.phone || 'Sem número'}</td>
                      <td className="px-3 py-2.5 text-neutral-400">{c.city}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditClient(c)}
                            className="rounded p-1 text-neutral-400 hover:text-[#0066FF] transition-colors"
                            title="Editar Cliente"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <WhatsAppBtn phone={c.phone} label={`Olá ${c.name}!`} />
                          <button
                            type="button"
                            onClick={() => { if(confirm(`Deseja realmente excluir o cliente ${c.name}?`)) onDeleteClient(c.id) }}
                            className="rounded p-1 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Excluir Cliente"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsScreen({
  services = [],
  products = [],
  statuses = [],
  isDark,
  onOpenProductModal,
  onEditProduct,
  onOpenServiceModal,
  onOpenStatusModal,
  onDeleteProduct,
  onDeleteService,
  onDeleteStatus,
  onOpenMenu,
}: {
  services: CustomService[]
  products: Product[]
  statuses: CustomStatus[]
  isDark: boolean
  onOpenProductModal: () => void
  onEditProduct: (product: Product) => void
  onOpenServiceModal: () => void
  onOpenStatusModal: () => void
  onDeleteProduct: (id: string) => void
  onDeleteService: (id: string) => void
  onDeleteStatus: (id: string) => void
  onOpenMenu: () => void
}) {
  const safeProducts = Array.isArray(products) ? products : []
  const safeServices = Array.isArray(services) ? services : []
  const safeStatuses = Array.isArray(statuses) ? statuses : []

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Configurações, Peças & Catálogo" isDark={isDark} onOpenMobileMenu={onOpenMenu} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
            isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <div>
                <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Produtos & Peças</span>
                <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({safeProducts.length})</span>
              </div>
              <button
                type="button"
                onClick={onOpenProductModal}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-xs font-bold text-white hover:opacity-95 shadow-sm"
              >
                + Nova Peça
              </button>
            </div>

            <div className={`max-h-80 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
              {safeProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">Nenhum produto cadastrado</div>
              ) : (
                safeProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          #{p.id}
                        </span>
                        <span className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{p.name}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] font-mono text-neutral-400 mt-0.5">
                        {p.brand && <span className="text-amber-400 font-semibold">{p.brand}</span>}
                        {p.brand && <span>•</span>}
                        <span className="text-purple-400 font-semibold">{p.category || 'Geral'}</span>
                        <span>•</span>
                        <span>Venda: R$ {Number(p.sale_price || 0).toFixed(2)}</span>
                        <span>•</span>
                        <span>Qtd: {p.stock}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditProduct(p)}
                        className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:opacity-95"
                        title="Editar produto"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1 rounded text-neutral-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
            isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
              <div>
                <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Serviços da Assistência</span>
                <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({safeServices.length})</span>
              </div>
              <button
                type="button"
                onClick={onOpenServiceModal}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-2.5 py-1 text-xs font-bold text-white hover:opacity-95 shadow-sm"
              >
                + Novo Serviço
              </button>
            </div>

            <div className={`max-h-80 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
              {safeServices.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">Nenhum serviço cadastrado</div>
              ) : (
                safeServices.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div>
                      <div className={`font-medium ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>{s.name}</div>
                      <div className="font-mono text-neutral-400">R$ {Number(s.default_price || 0).toFixed(2)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteService(s.id)}
                      className="p-1 rounded text-neutral-400 hover:text-red-500"
                      title="Excluir"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

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

            <div className={`max-h-80 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
              {safeStatuses.map(st => (
                <div key={st.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
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
      </div>
    </div>
  )
}

// ─── Modais de OS, Orçamento e Cliente ────────────────────────────────────────

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

  const [client, setClient] = useState(orderToEdit?.client || '')
  const [phone, setPhone] = useState(orderToEdit?.phone || '')
  const [device, setDevice] = useState(orderToEdit?.device || '')
  const [technician, setTechnician] = useState(orderToEdit?.technician || 'Admin')
  const [notes, setNotes] = useState(orderToEdit?.notes || '')
  const [status, setStatus] = useState(orderToEdit?.status || (safeStatuses.length > 0 ? safeStatuses[0].label : 'Entrada'))
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
  }, [client, safeClients, phone])

  const total = items.reduce((s, i) => s + (Number(i.qty || 1) * Number(i.unit || 0)), 0)

  const handleClientSelectChange = (name: string) => {
    setClient(name)
    const found = safeClients.find(c => c.name === name)
    if (found) {
      setPhone(found.phone)
    } else {
      setPhone('')
    }
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
                required
                value={client}
                onChange={e => handleClientSelectChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione um cliente...</option>
                {safeClients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}{c.phone ? ` — ${c.phone}` : ''}
                  </option>
                ))}
              </select>
              {safeClients.length === 0 && (
                <p className="mt-1 text-[10px] text-amber-500">Nenhum cliente cadastrado. Clique em "+ Cliente" para cadastrar.</p>
              )}
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
                                <option key={p.id} value={p.name}>📦 [{p.id}] {p.name} (R${p.sale_price})</option>
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

function QuoteModal({
  onClose,
  clients = [],
  services = [],
  products = [],
  onSave,
  onQuickNewClient,
  quoteToEdit,
  isDark,
}: {
  onClose: () => void
  clients: Client[]
  services: CustomService[]
  products: Product[]
  onSave: (quote: Quote) => void
  onQuickNewClient: () => void
  quoteToEdit?: Quote | null
  isDark: boolean
}) {
  const safeClients = Array.isArray(clients) ? clients : []
  const safeServices = Array.isArray(services) ? services : []
  const safeProducts = Array.isArray(products) ? products : []

  const [client, setClient] = useState(quoteToEdit?.client || '')
  const [phone, setPhone] = useState(quoteToEdit?.phone || '')
  const [device, setDevice] = useState(quoteToEdit?.device || '')
  const [description, setDescription] = useState(quoteToEdit?.description || '')
  const [validDays, setValidDays] = useState('7')
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
  }, [client, safeClients, phone])

  const total = items.reduce((s, i) => s + (Number(i.qty || 1) * Number(i.unit || 0)), 0)

  const handleClientSelectChange = (name: string) => {
    setClient(name)
    const found = safeClients.find(c => c.name === name)
    if (found) {
      setPhone(found.phone)
    } else {
      setPhone('')
    }
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
      status: quoteToEdit?.status || 'Pendente',
      items,
    }

    onSave(quoteData)

    if (sendWhatsApp && phone) {
      const msg = `*AndradeTech - Proposta de Orçamento #${quoteData.id}*\n\n` +
                  `Olá, *${client}*!\n` +
                  `*Aparelho:* ${device}\n` +
                  `*Descrição:* ${quoteData.description}\n` +
                  `*Valor Total:* R$ ${total.toFixed(2)}\n\n` +
                  `*Válido até:* ${quoteData.validUntil}\n\n` +
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
                <option value="">Selecione um cliente...</option>
                {safeClients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}{c.phone ? ` — ${c.phone}` : ''}
                  </option>
                ))}
              </select>
              {safeClients.length === 0 && (
                <p className="mt-1 text-[10px] text-amber-500">Nenhum cliente cadastrado. Clique em "+ Cliente" para cadastrar.</p>
              )}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                <option key={p.id} value={p.name}>📦 [{p.id}] {p.name} (R${p.sale_price})</option>
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
              Salvar Orçamento
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

// ─── Modal de Cliente ────────────────────────────────────────────────────────

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

// ─── Modais de Catálogo / Configurações ───────────────────────────────────────

function ProductModal({
  onClose,
  onSave,
  productToEdit,
  isDark,
  existingCategories = [],
  existingBrands = [],
}: {
  onClose: () => void
  onSave: (product: Product) => void
  productToEdit?: Product | null
  isDark: boolean
  existingCategories?: string[]
  existingBrands?: string[]
}) {
  const [customId, setCustomId] = useState(
    productToEdit?.id || String(Math.floor(1000 + Math.random() * 9000))
  )
  const [name, setName] = useState(productToEdit?.name || '')
  const [brand, setBrand] = useState(productToEdit?.brand || '')
  const [category, setCategory] = useState(productToEdit?.category || 'Acessórios')
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [costPrice, setCostPrice] = useState(productToEdit ? String(productToEdit.cost_price) : '')
  const [salePrice, setSalePrice] = useState(productToEdit ? String(productToEdit.sale_price) : '')
  const [stock, setStock] = useState(productToEdit ? String(productToEdit.stock) : '0')

  const mergedCategories = Array.from(
    new Set([...DEFAULT_PRODUCT_CATEGORIES, ...existingCategories.filter(Boolean)])
  )

  const mergedBrands = Array.from(
    new Set(['Kingston', 'Samsung', 'SanDisk', 'Apple', 'Xiaomi', 'Corsair', 'Asus', 'Dell', 'Lenovo', 'HP', ...existingBrands.filter(Boolean)])
  )

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark
      ? 'border-neutral-800 bg-[#181818] text-white focus:border-[#0066FF]'
      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-[#0066FF]'
  }`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedId = customId.trim()
    if (!trimmedName) return alert('Nome do produto é obrigatório')
    if (!trimmedId) return alert('ID do produto é obrigatório')

    const chosenCategory = isAddingNewCategory
      ? newCategoryName.trim() || 'Geral'
      : category.trim() || 'Geral'

    onSave({
      id: trimmedId,
      name: trimmedName,
      brand: brand.trim() || undefined,
      category: chosenCategory,
      cost_price: Math.max(0, Number(costPrice.replace(',', '.')) || 0),
      sale_price: Math.max(0, Number(salePrice.replace(',', '.')) || 0),
      stock: Math.max(0, Math.floor(Number(stock.replace(',', '.')) || 0)),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          isDark ? 'border-neutral-800 bg-[#111] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-[#0066FF]">
              {productToEdit ? `EDITANDO #${productToEdit.id}` : 'NOVO ITEM DE CATÁLOGO'}
            </div>
            <h2 className="text-base font-bold">{productToEdit ? 'Editar Produto / Peça' : 'Cadastrar Peça / Produto'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                ID / Código de Identificação (PDV) *
              </label>
              <button
                type="button"
                onClick={() => setCustomId(String(Math.floor(1000 + Math.random() * 9000)))}
                className="font-mono text-[10px] text-blue-400 hover:underline"
              >
                Gerar automático
              </button>
            </div>
            <input
              required
              value={customId}
              onChange={e => setCustomId(e.target.value)}
              placeholder="Ex: 1001, 7891234567..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome do Item *</label>
            <input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tela iPhone Incell" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                Marca (aberta)
              </label>
              <input
                list="brand-options-list"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="Ex: Apple, Kingston..."
                className={inputClass}
              />
              <datalist id="brand-options-list">
                {mergedBrands.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Categoria</label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                  className="text-[10px] font-bold text-[#0066FF] hover:underline"
                >
                  {isAddingNewCategory ? '← Escolher' : '+ Nova'}
                </button>
              </div>

              {isAddingNewCategory ? (
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Nova categoria..."
                  className={inputClass}
                />
              ) : (
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {mergedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Custo (R$)</label>
              <input inputMode="decimal" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0,00" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Venda (R$)</label>
              <input inputMode="decimal" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0,00" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Estoque</label>
              <input inputMode="numeric" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">Cancelar</button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95">
            {productToEdit ? 'Salvar Alterações' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ServiceModal({
  onClose,
  onSave,
  isDark,
}: {
  onClose: () => void
  onSave: (service: CustomService) => void
  isDark: boolean
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Manutenção')
  const [price, setPrice] = useState('')

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark
      ? 'border-neutral-800 bg-[#181818] text-white focus:border-[#0066FF]'
      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-[#0066FF]'
  }`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return alert('Nome do serviço é obrigatório')

    onSave({
      id: `SERV-${Date.now()}`,
      name: trimmedName,
      default_price: Math.max(0, Number(price.replace(',', '.')) || 0),
      category: category.trim() || 'Manutenção',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          isDark ? 'border-neutral-800 bg-[#111] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-[#0066FF]">SERVIÇOS</div>
            <h2 className="text-base font-bold">Novo Serviço</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome *</label>
            <input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Formatação + SO" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Categoria</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Software" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Preço padrão</label>
            <input inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" className={inputClass} />
          </div>
        </div>

        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">Cancelar</button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95">Salvar Serviço</button>
        </div>
      </form>
    </div>
  )
}

function StatusModal({
  onClose,
  onSave,
  isDark,
}: {
  onClose: () => void
  onSave: (status: CustomStatus) => void
  isDark: boolean
}) {
  const [label, setLabel] = useState('')
  const [dot, setDot] = useState('#0066FF')

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark
      ? 'border-neutral-800 bg-[#181818] text-white focus:border-[#0066FF]'
      : 'border-slate-300 bg-slate-50 text-slate-900 focus:border-[#0066FF]'
  }`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedLabel = label.trim()
    if (!trimmedLabel) return alert('Nome da situação é obrigatório')

    onSave({
      id: `STATUS-${Date.now()}`,
      label: trimmedLabel,
      dot,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          isDark ? 'border-neutral-800 bg-[#111] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase text-[#0066FF]">SITUAÇÕES DE OS</div>
            <h2 className="text-base font-bold">Nova Situação</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-red-400" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Nome *</label>
            <input autoFocus required value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Aguardando aprovação" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Cor</label>
            <div className="flex items-center gap-3">
              <input type="color" value={dot} onChange={e => setDot(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
              <span className="font-mono text-xs text-neutral-400">{dot.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">Cancelar</button>
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95">Salvar Situação</button>
        </div>
      </form>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

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
  const [quoteEditing, setQuoteEditing] = useState<Quote | null>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [productEditing, setProductEditing] = useState<Product | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)

  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [clientEditing, setClientEditing] = useState<Client | null>(null)
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null)
  const [printDocumentKind, setPrintDocumentKind] = useState<'order' | 'sale' | 'quote'>('order')

  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [sales, setSales] = useState<Sale[]>([])
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
      const { data: vData } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
      if (vData) {
        setSales(vData.map(v => ({
          id: v.id,
          client: v.client,
          phone: v.phone || '',
          cpf: v.cpf || '',
          payment_method: v.payment_method,
          items: Array.isArray(v.items) ? v.items : [],
          total: Number(v.total) || 0,
          date: v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : '',
        })))
      }
    } catch {}

    try {
      const { data: sData } = await supabase.from('services').select('*')
      if (sData && sData.length > 0) setServices(sData)
    } catch {}

    try {
      const { data: pData } = await supabase.from('products').select('*')
      if (pData && pData.length > 0) {
        setProducts(pData.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          category: p.category || 'Geral',
          cost_price: Number(p.cost_price) || 0,
          sale_price: Number(p.sale_price) || 0,
          stock: Number(p.stock) || 0,
        })))
      }
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
    const isReturningToQuote =
      orderData.status.toLowerCase() === 'orçamento' ||
      orderData.status.toLowerCase() === 'orcamento' ||
      orderData.status.toLowerCase() === 'aguardando aprovação' ||
      orderData.status.toLowerCase() === 'aguardando aprovacao'

    if (isReturningToQuote) {
      setOrders(prev => prev.filter(o => o.id !== orderData.id))
      await supabase.from('orders').delete().eq('id', orderData.id)

      const expDate = new Date()
      expDate.setDate(expDate.getDate() + 7)

      const returnedQuote: Quote = {
        id: `ORC-${Math.floor(1000 + Math.random() * 9000)}`,
        client: orderData.client,
        phone: orderData.phone,
        device: orderData.device,
        description: orderData.notes || orderData.service || 'Retornado de OS',
        value: orderData.value,
        validUntil: expDate.toLocaleDateString('pt-BR'),
        createdAt: new Date().toLocaleDateString('pt-BR'),
        status: 'Pendente',
        items: orderData.items || [],
      }

      setQuotes(prev => [returnedQuote, ...prev])
      await supabase.from('quotes').insert([{
        id: returnedQuote.id,
        client: returnedQuote.client,
        phone: returnedQuote.phone,
        device: returnedQuote.device,
        description: returnedQuote.description,
        value: returnedQuote.value,
        valid_until: returnedQuote.validUntil,
        status: returnedQuote.status,
        items: returnedQuote.items,
      }])

      alert(`A OS ${orderData.id} foi transferida de volta para a aba de Orçamentos (#${returnedQuote.id})!`)
      return
    }

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
    setQuotes(prev => prev.filter(q => q.id !== quote.id))
    await supabase.from('quotes').delete().eq('id', quote.id)

    const newOrder: Order = {
      id: `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      client: quote.client,
      phone: quote.phone,
      device: quote.device,
      service: (quote.items && quote.items[0]?.desc) || quote.description || 'Serviço Técnico',
      status: 'Entrada',
      value: quote.value,
      date: new Date().toLocaleDateString('pt-BR'),
      technician: 'Admin',
      notes: `Convertido do Orçamento #${quote.id}. ${quote.description || ''}`,
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
    alert(`Orçamento #${quote.id} aprovado e convertido com sucesso na Ordem #${newOrder.id}!`)
  }

  const handleUpdateQuoteStatus = async (quote: Quote, nextStatus: Quote['status']) => {
    if (nextStatus === 'Aprovado') {
      if (confirm(`Aprovar o orçamento ${quote.id} e transformá-lo imediatamente em uma Ordem de Serviço?`)) {
        await handleConvertToOrder(quote)
      }
      return
    }

    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: nextStatus } : q))
    const { error } = await supabase.from('quotes').update({ status: nextStatus }).eq('id', quote.id)
    if (error) {
      await fetchData()
      alert('Não foi possível atualizar o status do orçamento.')
    }
  }

  const handleDeleteQuote = async (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id))
    await supabase.from('quotes').delete().eq('id', id)
  }

  // ─── Lógica de PDV ─────────────────────────────────────────────────────────

  const handleDeleteSale = async (sale: Sale) => {
    const confirmed = confirm(
      `Excluir a venda #${sale.id}?\n\nO estoque dos produtos vendidos será devolvido automaticamente. Essa ação não pode ser desfeita.`
    )
    if (!confirmed) return

    setSales(prev => prev.filter(s => s.id !== sale.id))

    for (const item of sale.items || []) {
      const prod = products.find(p => p.name === item.desc || item.desc.includes(p.name))
      if (prod) {
        const restoredStock = prod.stock + Number(item.qty || 0)
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, stock: restoredStock } : p))
        await supabase.from('products').update({ stock: restoredStock }).eq('id', prod.id)
      }
    }

    const { error } = await supabase.from('sales').delete().eq('id', sale.id)
    if (error) {
      await fetchData()
      alert(`Não foi possível excluir a venda #${sale.id}. Verifique a conexão com o banco de dados.`)
      return
    }

    alert(`Venda #${sale.id} excluída com sucesso. O estoque foi restaurado.`)
  }

  const handleCompleteSale = async (saleData: Sale) => {
    setSales(prev => [saleData, ...prev])

    await supabase.from('sales').insert([{
      id: saleData.id,
      client: saleData.client,
      phone: saleData.phone,
      cpf: saleData.cpf,
      payment_method: saleData.payment_method,
      items: saleData.items,
      total: saleData.total,
    }])

    for (const item of saleData.items) {
      const prod = products.find(p => item.desc.includes(p.name) || item.desc.includes(p.id))
      if (prod) {
        const updatedStock = Math.max(0, prod.stock - item.qty)
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, stock: updatedStock } : p))
        await supabase.from('products').update({ stock: updatedStock }).eq('id', prod.id)
      }
    }

    if (confirm(`Venda #${saleData.id} concluída com sucesso!\nDeseja imprimir o cupom da venda?`)) {
      setPrintDocumentKind('sale')
      setOrderToPrint({
        id: saleData.id,
        client: saleData.client,
        phone: saleData.phone,
        device: 'Venda de Balcão (PDV)',
        service: `Pagamento: ${saleData.payment_method}`,
        status: saleData.payment_method,
        value: saleData.total,
        date: saleData.date,
        technician: 'Frente de Caixa',
        notes: `Comprovante de Compra emitido no PDV. Pagamento efetuado via ${saleData.payment_method}.`,
        items: saleData.items,
      })
    }
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
            onPrintOrder={(o) => { setOrderToPrint(o); setPrintDocumentKind('order') }}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
        {screen === 'orders' && (
          <OrdersScreen
            orders={orders}
            statuses={statuses}
            isDark={isDark}
            onNewOrder={() => { setOrderEditing(null); setShowOrderModal(true) }}
            onEditOrder={(o) => { setOrderEditing(o); setShowOrderModal(true) }}
            onPrintOrder={(o) => { setOrderToPrint(o); setPrintDocumentKind('order') }}
            onDeleteOrder={handleDeleteOrder}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
        {screen === 'quotes' && (
          <QuotesScreen
            quotes={quotes}
            isDark={isDark}
            onNewQuote={() => { setQuoteEditing(null); setShowQuoteModal(true) }}
            onEditQuote={(q) => {
              setQuoteEditing(q)
              setShowQuoteModal(true)
            }}
            onUpdateStatus={handleUpdateQuoteStatus}
            onPrintQuote={(q) => {
              setOrderToPrint({
                id: q.id,
                client: q.client,
                phone: q.phone,
                device: q.device,
                service: q.description,
                status: q.status,
                value: q.value,
                date: q.createdAt,
                technician: 'AndradeTech',
                notes: q.description,
                items: q.items,
              })
              setPrintDocumentKind('quote')
            }}
            onDeleteQuote={handleDeleteQuote}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
        {screen === 'pdv' && (
          <PDVScreen
            products={products}
            clients={clients}
            sales={sales}
            isDark={isDark}
            onCompleteSale={handleCompleteSale}
            onDeleteSale={handleDeleteSale}
            onPrintSale={(sale) => {
              setPrintDocumentKind('sale')
              setOrderToPrint({
                id: sale.id,
                client: sale.client,
                phone: sale.phone,
                device: 'Venda de Balcão (PDV)',
                service: `Pagamento: ${sale.payment_method}`,
                status: sale.payment_method,
                value: sale.total,
                date: sale.date,
                technician: 'Frente de Caixa',
                notes: `Comprovante de Compra no PDV. Pagamento via ${sale.payment_method}.`,
                items: sale.items,
              })
            }}
            onOpenMenu={() => setMobileMenuOpen(true)}
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
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            services={services}
            products={products}
            statuses={statuses}
            isDark={isDark}
            onOpenProductModal={() => { setProductEditing(null); setShowProductModal(true) }}
            onEditProduct={(p) => { setProductEditing(p); setShowProductModal(true) }}
            onOpenServiceModal={() => setShowServiceModal(true)}
            onOpenStatusModal={() => setShowStatusModal(true)}
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

      {/* Modais de Ajustes */}
      {showProductModal && (
        <ProductModal
          onClose={() => { setShowProductModal(false); setProductEditing(null) }}
          productToEdit={productEditing}
          existingCategories={products.map(p => p.category)}
          existingBrands={products.map(p => p.brand || '').filter(Boolean)}
          onSave={async (prod) => {
            const exists = products.some(p => p.id === prod.id)
            setProducts(prev => exists ? prev.map(p => p.id === prod.id ? prod : p) : [prod, ...prev])
            if (exists) {
              await supabase.from('products').update({
                name: prod.name,
                brand: prod.brand,
                category: prod.category,
                cost_price: prod.cost_price,
                sale_price: prod.sale_price,
                stock: prod.stock,
              }).eq('id', prod.id)
            } else {
              await supabase.from('products').insert([prod])
            }
          }}
          isDark={isDark}
        />
      )}

      {showServiceModal && (
        <ServiceModal
          onClose={() => setShowServiceModal(false)}
          onSave={async (svc) => {
            setServices(prev => [svc, ...prev])
            await supabase.from('services').insert([svc])
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
          onClose={() => { setOrderToPrint(null); setPrintDocumentKind('order') }}
          isDark={isDark}
          documentKind={printDocumentKind}
        />
      )}
    </div>
  )
}