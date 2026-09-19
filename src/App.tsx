import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Screen = 'dashboard' | 'orders' | 'quotes' | 'clients' | 'pdv' | 'revenue' | 'users' | 'settings'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'technician' | 'attendant'
  active: boolean
  modules: Screen[]
}

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
  items: OrderItem[]; publicToken?: string
}

interface Client {
  id: string
  name: string
  phone: string; email: string; cpf: string; cep: string; addressNumber: string; complement: string
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

// PIX estatico: preencha e altere enabled para true somente quando desejar receber pagamentos.
const PIX_CONFIG = {
  enabled: true,
  key: '09332276552',
  receiverName: 'Marcelo Andrade do Nascimento',
  city: 'Eunapolis',
  description: 'Pagamento AndradeTech',
}

const isPixConfigured = () => true

const pixField = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

const pixCrc16 = (payload: string) => {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

const createPixCopyPaste = (amount: number, transactionId: string) => {
  const clean = (value: string, max: number) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, max)
  const merchantAccount = pixField('00', 'BR.GOV.BCB.PIX') + pixField('01', PIX_CONFIG.key) + pixField('02', clean(PIX_CONFIG.description, 72))
  const payload = [
    pixField('00', '01'), pixField('26', merchantAccount), pixField('52', '0000'), pixField('53', '986'),
    pixField('54', amount.toFixed(2)), pixField('58', 'BR'), pixField('59', clean(PIX_CONFIG.receiverName, 25)),
    pixField('60', clean(PIX_CONFIG.city, 15)), pixField('62', pixField('05', clean(transactionId, 25))), '6304',
  ].join('')
  return `${payload}${pixCrc16(payload)}`
}

const ALL_MODULES: { id: Screen; label: string }[] = [
  { id: 'dashboard', label: 'Painel (Visão Geral)' },
  { id: 'orders', label: 'Ordens de Serviço' },
  { id: 'quotes', label: 'Orçamentos & Propostas' },
  { id: 'pdv', label: 'Frente de Caixa (PDV)' },
  { id: 'revenue', label: 'Faturamento & Relatórios' },
  { id: 'clients', label: 'Base de Clientes' },
  { id: 'users', label: 'Gestão de Usuários' },
  { id: 'settings', label: 'Configurações & Ajustes' },
]

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: '1', label: 'Entrada', dot: '#64748B' },
  { id: '2', label: 'Orçamento', dot: '#F59E0B' },
  { id: '3', label: 'Aprovado', dot: '#10B981' },
  { id: '4', label: 'Em Análise', dot: '#007BFF' },
  { id: '5', label: 'Aguardando Aprovação', dot: '#EAB308' },
  { id: '6', label: 'Aguardando Peça', dot: '#8A2BE2' },
  { id: '7', label: 'Finalizado', dot: '#10B981' },
  { id: '8', label: 'Entregue', dot: '#059669' },
  { id: '9', label: 'Cancelado', dot: '#EF4444' },
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
]

const BASE_NAV_ITEMS = [
  {
    id: 'dashboard' as Screen,
    label: 'Painel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
    ),
  },
  {
    id: 'orders' as Screen,
    label: 'Ordens',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>
    ),
  },
  {
    id: 'quotes' as Screen,
    label: 'Orçamentos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    ),
  },
  {
    id: 'pdv' as Screen,
    label: 'PDV (Vendas)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    ),
  },
  {
    id: 'clients' as Screen,
    label: 'Clientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    ),
  },
  {
    id: 'users' as Screen,
    label: 'Usuários',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  { id: 'revenue' as Screen, label: 'Faturamento', icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/></svg>) },
  {
    id: 'settings' as Screen,
    label: 'Ajustes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2" /></svg>
    ),
  },
]

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

// ─── Login Screen com Validação de Ativo/Bloqueado ────────────────────────────

function LoginScreen({ onLoginSuccess, isDark }: { onLoginSuccess: (user: any) => void; isDark: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      setErrorMsg('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    if (data?.user) {
      // Checa se o usuário está ativo no banco
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile && profile.active === false) {
        setErrorMsg('Esta conta foi desativada pelo administrador.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      onLoginSuccess(data.user)
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

// ─── Modal de Edição de Usuário & Permissões (Dentro do Sistema) ──────────────

function UserModal({
  userToEdit,
  onClose,
  onSave,
  isDark,
}: {
  userToEdit?: UserProfile | null
  onClose: () => void
  onSave: (data: Partial<UserProfile> & { password?: string }) => Promise<void>
  isDark: boolean
}) {
  const [name, setName] = useState(userToEdit?.name || '')
  const [email, setEmail] = useState(userToEdit?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserProfile['role']>(userToEdit?.role || 'technician')
  const [active, setActive] = useState(userToEdit ? userToEdit.active : true)
  const [selectedModules, setSelectedModules] = useState<Screen[]>(
    userToEdit?.modules || ['dashboard', 'orders', 'pdv']
  )
  const [loading, setLoading] = useState(false)

  const toggleModule = (modId: Screen) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return alert('E-mail obrigatorio')
    if (!userToEdit && password.length < 6) return alert('A senha provisoria deve ter no minimo 6 caracteres')
    if (!name.trim()) return alert('Nome é obrigatório')
    if (selectedModules.length === 0) return alert('Selecione pelo menos 1 módulo de acesso!')

    setLoading(true)
    await onSave({
      id: userToEdit?.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password ? password.trim() : undefined,
      role,
      active,
      modules: selectedModules,
    })
    setLoading(false)
    onClose()
  }

  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    isDark ? 'bg-[#181818] border-neutral-800 text-white focus:border-[#0066FF]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#0066FF]'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <form onSubmit={handleSubmit} className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#111] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <div>
            <div className="font-mono text-[10px] uppercase text-[#0066FF] font-bold">GESTÃO DE ACESSO</div>
            <h2 className="text-base font-bold">{userToEdit ? 'Editar Usuário & Permissões' : 'Cadastrar Novo Usuário'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-neutral-400 hover:text-red-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-xs">
          <div>
            <label className="block mb-1 font-mono uppercase text-neutral-400">Nome do Operador *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Lucas Silva" className={inputClass} />
          </div>

          <div>
            <label className="block mb-1 font-mono uppercase text-neutral-400">E-mail de Acesso *</label>
            <input required type="email" disabled={!!userToEdit} value={email} onChange={e => setEmail(e.target.value)} placeholder="lucas@andradetech.com" className={`${inputClass} ${userToEdit ? 'opacity-60 cursor-not-allowed' : ''}`} />
          </div>

          {!userToEdit && (
            <div>
              <label className="block mb-1 font-mono uppercase text-neutral-400">Senha Provisória *</label>
              <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={inputClass} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-mono uppercase text-neutral-400">Cargo / Função</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className={inputClass}>
                <option value="technician">Técnico</option>
                <option value="attendant">Atendente / Caixa</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-mono uppercase text-neutral-400">Status da Conta</label>
              <select value={active ? 'true' : 'false'} onChange={e => setActive(e.target.value === 'true')} className={inputClass}>
                <option value="true">🟢 Ativo</option>
                <option value="false">🔴 Desativado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-mono uppercase text-neutral-400 font-bold">Módulos Permitidos para este usuário:</label>
            <div className="space-y-1.5 rounded-xl border p-3 border-neutral-700/40">
              {ALL_MODULES.map(m => {
                const isChecked = selectedModules.includes(m.id)
                return (
                  <label key={m.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleModule(m.id)}
                      className="rounded border-neutral-700 text-blue-600 focus:ring-0"
                    />
                    <span className={isChecked ? 'font-bold text-blue-400' : 'text-neutral-400'}>{m.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className={`flex justify-end gap-2 border-t px-5 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-600">Cancelar</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-95">
            {loading ? 'Salvando...' : userToEdit ? 'Salvar Alterações' : 'Criar Conta de Usuário'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Modal de Emissão ─────────────────────────────────────────────────────────

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
        <style>{`
          .a4-sheet {
            width: 210mm;
            min-height: 297mm;
            box-sizing: border-box;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
              position: fixed;
              left: 0;
              top: 0;
              width: 100% !important;
              min-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
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
            <div id="print-area" className="a4-sheet flex w-full max-w-[210mm] flex-col bg-white p-8 text-xs text-black rounded border border-neutral-300 font-sans shadow-md print:m-0 print:border-none print:p-0 print:shadow-none sm:p-10">
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

              <div className="mt-auto grid grid-cols-2 gap-10 pt-8 text-center">
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Telas Principais (Dashboard, Orders, Quotes, PDV, Clients, Settings) ─────

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

  const sendQuoteOnWhatsApp = async (q: Quote) => {
    const phone = (q.phone || '').replace(/\D/g, '')
    if (!phone) {
      alert('Este orçamento não possui telefone cadastrado. Edite o orçamento e informe o telefone do cliente.')
      return
    }

    const token = q.publicToken || crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const parts = (q.validUntil || '').split('/')
    const expiry = parts.length === 3
      ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 23, 59, 59, 999)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const link = window.location.origin + '?orcamento=' + token
    const message = 'Segue orçamento da ' + (q.device || 'máquina') + ' que você trouxe na AndradeTech. ' + link
    const whatsappUrl = 'https://wa.me/' + (phone.startsWith('55') ? phone : '55' + phone) + '?text=' + encodeURIComponent(message)

    // Abre dentro do gesto do clique; assim o navegador não bloqueia o WhatsApp após o await.
    const whatsappWindow = window.open('about:blank', '_blank')

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ public_token: token, link_expires_at: expiry.toISOString() })
        .eq('id', q.id)
      if (error) throw error

      if (whatsappWindow) whatsappWindow.location.replace(whatsappUrl)
      else window.location.assign(whatsappUrl)
    } catch (error: any) {
      whatsappWindow?.close()
      alert('Não foi possível gerar o link de consulta: ' + (error?.message || 'erro desconhecido'))
    }
  }

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
                            <button type="button" disabled={isRejected} onClick={() => sendQuoteOnWhatsApp(q)} className="rounded p-1 text-[#25D366] transition-colors hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30" title="Enviar link no WhatsApp"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button><button
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
                              title={isRejected ? "Orçamento reprovado/desabilitado" : "Editar orçamento"}
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

function PixPaymentModal({ payment, onClose, isDark }: { payment: { id: string; total: number; customer?: { name: string; phone: string; email?: string; cep?: string; addressNumber?: string; complement?: string } }; onClose: () => void; isDark: boolean }) {
  const pixCode = createPixCopyPaste(payment.total, payment.id); useEffect(() => { let cancelled = false; (async () => { try { const response = await fetch('/api/infinitepay/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referenceType: payment.id.toUpperCase().startsWith('OS') ? 'order' : 'sale', referenceId: payment.id, amount: payment.total, description: 'Pagamento AndradeTech #' + payment.id, customer: payment.customer ? { name: payment.customer.name, email: payment.customer.email || undefined, phone: '+55' + payment.customer.phone.replace(/\D/g, '') } : undefined, address: payment.customer?.cep && payment.customer?.addressNumber ? { cep: payment.customer.cep.replace(/\D/g, ''), number: payment.customer.addressNumber, complement: payment.customer.complement || undefined } : undefined }) }); const data = await response.json(); if (!response.ok || !data.url) throw new Error(data.error || 'Não foi possível iniciar o pagamento.'); if (!cancelled) window.location.assign(data.url); } catch (error) { if (!cancelled) alert(error instanceof Error ? error.message : 'Falha ao iniciar pagamento.'); } })(); return () => { cancelled = true }; }, [payment.id, payment.total])
  return null; const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=svg&data=${encodeURIComponent(pixCode)}`
  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      alert('Codigo PIX copiado!')
    } catch {
      alert('Nao foi possivel copiar automaticamente. Selecione e copie o codigo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-neutral-800 bg-[#111] text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
        <div className="mb-4 flex items-start justify-between"><div><div className="font-mono text-[10px] font-bold uppercase text-[#0066FF]">Cobranca PIX</div><h2 className="text-base font-bold">Pagamento #{payment.id}</h2></div><button type="button" onClick={onClose} className="text-neutral-400 hover:text-red-500">✕</button></div>
        <div className={`mb-4 rounded-xl border p-4 text-center ${isDark ? 'border-neutral-800 bg-black/20' : 'border-slate-200 bg-slate-50'}`}><div className="text-xs text-neutral-400">Valor a receber</div><div className="mt-1 font-mono text-2xl font-black text-green-500">R$ {payment.total.toFixed(2)}</div><img src={qrCodeUrl} alt="QR Code PIX" className="mx-auto mt-3 h-48 w-48 rounded-lg bg-white p-2"/><div className="mt-2 text-[11px] text-neutral-400">Aponte a camera do banco para o QR Code ou use o Copia e Cola.</div></div>
        <label className="mb-1 block font-mono text-[10px] uppercase text-neutral-400">PIX Copia e Cola</label>
        <textarea readOnly value={pixCode} rows={4} className={`w-full resize-none rounded-lg border p-2 font-mono text-[10px] outline-none ${isDark ? 'border-neutral-800 bg-black text-neutral-300' : 'border-slate-300 bg-slate-50 text-slate-700'}`} />
        <button type="button" onClick={copyPixCode} className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2.5 text-sm font-bold text-white">Copiar codigo PIX</button>
      </div>
    </div>
  )
}

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
  const [pixSale, setPixSale] = useState<Sale | null>(null)
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
    if (paymentMethod === 'PIX' && isPixConfigured()) {
      setPixSale(saleData)
    }
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
      {pixSale && <PixPaymentModal payment={pixSale} onClose={() => setPixSale(null)} isDark={isDark} />}
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

function UsersScreen({
  profiles = [], onlineUsers = [], currentUserProfile, isDark,
  onOpenNewUser, onEditUser, onForceDisconnect, onDeleteUser, onOpenMenu,
}: {
  profiles: UserProfile[]
  onlineUsers: any[]
  currentUserProfile: UserProfile | null
  isDark: boolean
  onOpenNewUser: () => void
  onEditUser: (user: UserProfile) => void
  onForceDisconnect: (userId: string) => void
  onDeleteUser: (user: UserProfile) => void
  onOpenMenu: () => void
}) {
  const [search, setSearch] = useState('')
  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Gestao de Usuarios & Operadores" isDark={isDark} onOpenMobileMenu={onOpenMenu} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="relative w-full sm:w-80">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou cargo..." className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-xs outline-none transition-colors sm:text-sm ${isDark ? 'border-neutral-800 bg-[#111] text-white focus:border-[#0066FF]' : 'border-slate-200 bg-white text-slate-900 focus:border-[#0066FF]'}`} />
          </div>
          <button type="button" onClick={onOpenNewUser} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#8A2BE2] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-95 sm:w-auto">
            <span>+ Novo Usuario</span>
          </button>
        </div>
        <div className={`overflow-hidden rounded-xl border transition-colors ${isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs">
              <thead><tr className={`border-b text-left text-neutral-400 ${isDark ? 'border-neutral-800 bg-[#0e0e0e]' : 'border-slate-200 bg-slate-50'}`}><th className="px-4 py-3 font-mono uppercase">Usuario / Nome</th><th className="px-4 py-3 font-mono uppercase">E-mail</th><th className="px-4 py-3 font-mono uppercase">Cargo</th><th className="px-4 py-3 font-mono uppercase">Status</th><th className="px-4 py-3 font-mono uppercase">Modulos liberados</th><th className="px-4 py-3 text-right font-mono uppercase">Acoes</th></tr></thead>
              <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
                {filteredProfiles.length === 0 ? <tr><td colSpan={6}><EmptyState icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} title="Nenhum usuario encontrado" sub="Clique em '+ Novo Usuario' para cadastrar operadores" isDark={isDark} /></td></tr> : filteredProfiles.map(u => {
                  const isOnline = onlineUsers.some(onU => onU.user_id === u.id || onU.email === u.email)
                  return <tr key={u.id} className={isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 font-semibold"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-neutral-600'}`} /><span className={isDark ? 'text-white' : 'text-slate-900'}>{u.name}</span></div></td>
                    <td className="px-4 py-3 font-mono text-neutral-400">{u.email}</td><td className="px-4 py-3"><span className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-purple-400">{u.role}</span></td>
                    <td className="px-4 py-3"><span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${u.active ? 'border-green-500/20 bg-green-500/10 text-green-500' : 'border-red-500/20 bg-red-500/10 text-red-500'}`}>{u.active ? 'Ativo' : 'Desativado'}</span></td>
                    <td className="max-w-xs truncate px-4 py-3 text-neutral-400">{u.modules?.join(', ') || 'Nenhum'}</td><td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-2">{isOnline && u.id !== currentUserProfile?.id && <button type="button" onClick={() => onForceDisconnect(u.id)} className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-500 hover:text-white">Desconectar</button>}<button type="button" onClick={() => onEditUser(u)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800/50 hover:text-[#0066FF]" title="Editar usuario e permissoes"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>{currentUserProfile?.role === 'admin' && u.id !== currentUserProfile.id && <button type="button" onClick={() => onDeleteUser(u)} className="rounded p-1.5 text-neutral-400 hover:bg-red-500/10 hover:text-red-500" title="Apagar usuario"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg></button>}</div></td>
                  </tr>
                })}
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
      <Topbar title="Configurações & Catálogo" isDark={isDark} onOpenMobileMenu={onOpenMenu} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        
        {/* Gestão de usuários movida para a aba Usuários. */}
        {/*
        <div className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
          isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
            <div>
              <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Gestão de Usuários & Permissões</span>
              <span className="ml-1.5 text-[10px] font-mono text-neutral-400">({safeProfiles.length} cadastrados)</span>
            </div>
            <span className="text-[10px] text-neutral-400">Para cadastrar novos: use Authentication &gt; Users no Supabase</span>
          </div>

          <div className={`max-h-64 divide-y overflow-y-auto ${isDark ? 'divide-neutral-800' : 'divide-slate-100'}`}>
            {safeProfiles.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400">Nenhum perfil carregado</div>
            ) : (
              safeProfiles.map(u => {
                const isOnline = onlineUsers.some(onU => onU.user_id === u.id || onU.email === u.email)
                return (
                  <div key={u.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-neutral-600'}`} />
                        <span className="font-bold">{u.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400">({u.email})</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${u.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {u.active ? 'Ativo' : 'Desativado'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        Módulos liberados: {u.modules?.join(', ') || 'Nenhum'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOnline && u.id !== currentUserProfile?.id && (
                        <button
                          type="button"
                          onClick={() => onForceDisconnect(u.id)}
                          className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-500 hover:text-white"
                          title="Desconectar sessão imediatamente"
                        >
                          Desconectar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditUser(u)}
                        className="rounded p-1.5 text-neutral-400 hover:text-[#0066FF]"
                        title="Editar permissões"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Card Produtos */}
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

          {/* Card Serviços */}
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

          {/* Card Situações */}
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

// ─── Modais de Cadastro ───────────────────────────────────────────────────────

function OrderModal({
  onClose,
  clients = [],
  statuses = [],
  services = [],
  products = [],
  profiles = [],
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
  profiles: UserProfile[]
  onSave: (order: Order) => void
  onQuickNewClient: () => void
  orderToEdit?: Order | null
  isDark: boolean
}) {
  const safeClients = Array.isArray(clients) ? clients : []
  const safeStatuses = Array.isArray(statuses) ? statuses : []
  const safeServices = Array.isArray(services) ? services : []
  const safeProducts = Array.isArray(products) ? products : []
  const availableOperators = (Array.isArray(profiles) ? profiles : []).filter(profile =>
    profile.active && (profile.role === 'technician' || profile.role === 'attendant')
  )

  const [client, setClient] = useState(orderToEdit?.client || '')
  const [phone, setPhone] = useState(orderToEdit?.phone || '')
  const [device, setDevice] = useState(orderToEdit?.device || '')
  const [technician, setTechnician] = useState(orderToEdit?.technician || availableOperators[0]?.name || '')
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
    if (!client.trim() || !device.trim() || !technician) {
      alert('Selecione o cliente, informe o aparelho e escolha o responsável!')
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
      technician,
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
            <select value={technician} onChange={e => setTechnician(e.target.value)} className={inputClass}>
              <option value="">Selecione o técnico ou atendente...</option>
              {availableOperators.map(operator => (
                <option key={operator.id} value={operator.name}>
                  {operator.name} — {operator.role === 'technician' ? 'Técnico' : 'Atendente'}
                </option>
              ))}
            </select>
            {availableOperators.length === 0 && (
              <p className="mt-1 text-[10px] text-amber-500">Nenhum técnico ou atendente ativo cadastrado.</p>
            )}
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
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits ? `(${digits}` : ''
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const [name, setName] = useState(clientToEdit?.name || '')
  const [phone, setPhone] = useState(() => formatPhone(clientToEdit?.phone || ''))
  const [email, setEmail] = useState(clientToEdit?.email || ''); const [cpf, setCpf] = useState(() => formatCpf(clientToEdit?.cpf || ''))
  const [cep, setCep] = useState(clientToEdit?.cep || ''); const [addressNumber, setAddressNumber] = useState(clientToEdit?.addressNumber || ''); const [complement, setComplement] = useState(clientToEdit?.complement || ''); const [address, setAddress] = useState(clientToEdit?.address || '')
  const [city, setCity] = useState(clientToEdit?.city || ''); useEffect(() => { const digits = cep.replace(/\D/g, ''); if (digits.length !== 8) return; let cancelled = false; fetch(`https://viacep.com.br/ws/${digits}/json/`).then(response => response.json()).then(data => { if (!cancelled && !data.erro) { if (data.logradouro) setAddress(data.logradouro); if (data.localidade || data.uf) setCity([data.localidade, data.uf].filter(Boolean).join(', ')); } }).catch(() => {}); return () => { cancelled = true }; }, [cep])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Nome do cliente é obrigatório')

    onSave({
      id: clientToEdit?.id || `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name, phone, email, cpf, cep, addressNumber, complement, address,
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
              <input value={phone} inputMode="numeric" maxLength={15} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">CPF</label>
              <input value={cpf} inputMode="numeric" maxLength={14} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className={inputClass} />
            </div>
          </div>
          <div><label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@exemplo.com" className={inputClass} /></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div><label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">CEP</label><input value={cep} inputMode="numeric" maxLength={9} onChange={e => { const d=e.target.value.replace(/\D/g,'').slice(0,8); setCep(d.length > 5 ? d.slice(0,5)+'-'+d.slice(5) : d) }} placeholder="00000-000" className={inputClass} /></div><div><label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Número</label><input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="Ex: 123" className={inputClass} /></div><div><label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Complemento</label><input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto, bloco..." className={inputClass} /></div></div><div><label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-400">Endereço</label>
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


function RevenueScreen({ sales = [], orders = [], isDark, onOpenMenu }: { sales: Sale[]; orders: Order[]; isDark: boolean; onOpenMenu: () => void }) {
  const [months, setMonths] = useState<1 | 2 | 3>(1)
  const parseDate = (value: string) => { const p = (value || '').split('/'); return p.length === 3 ? new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]), 12) : new Date(0) }
  const today = new Date(); const monday = new Date(today); monday.setHours(0,0,0,0); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); const start = new Date(today); start.setHours(0,0,0,0); start.setMonth(start.getMonth() - months + 1); start.setDate(1)
  const finalized = (status: string) => ['finalizado','concluído','concluido','entregue'].includes((status || '').toLowerCase())
  const records = [...sales.map(s => ({ id:s.id, date:s.date, client:s.client, payment:s.payment_method, total:Number(s.total||0), source:'PDV' })), ...orders.filter(o => finalized(o.status)).map(o => ({ id:o.id, date:o.date, client:o.client, payment:o.status, total:Number(o.value||0), source:'OS' }))]
  const inRange = records.filter(r => parseDate(r.date) >= start); const sameDay = (d: Date, n: Date) => d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); const total = (list: any[]) => list.reduce((v,r) => v + r.total, 0); const money = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); const todayTotal=total(records.filter(r=>sameDay(parseDate(r.date),today))); const weekTotal=total(records.filter(r=>parseDate(r.date)>=monday)); const monthTotal=total(records.filter(r=>{const d=parseDate(r.date);return d.getFullYear()===today.getFullYear()&&d.getMonth()===today.getMonth()})); const panel = isDark ? 'border-neutral-800 bg-[#111]' : 'border-slate-200 bg-white shadow-sm';
  return <div className="flex flex-1 flex-col overflow-hidden"><Topbar title="Faturamento" isDark={isDark} onOpenMobileMenu={onOpenMenu}/><div className="flex-1 overflow-y-auto p-4 sm:p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-bold">Relatório de Faturamento</h2><p className="text-xs text-neutral-400">Vendas do PDV e Ordens de Serviço concluídas</p></div><select value={months} onChange={e=>setMonths(Number(e.target.value) as 1|2|3)} className={isDark ? 'rounded-lg border border-neutral-800 bg-[#111] px-3 py-2 text-xs text-white' : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs'}><option value={1}>Este mês</option><option value={2}>Últimos 2 meses</option><option value={3}>Últimos 3 meses</option></select></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{l:'Hoje',v:todayTotal,c:'#0066FF'},{l:'Esta semana',v:weekTotal,c:'#8A2BE2'},{l:'Este mês',v:monthTotal,c:'#10B981'},{l:'Período selecionado',v:total(inRange),c:'#F59E0B'}].map(x=><div key={x.l} className={'rounded-xl border p-4 '+panel}><div className="font-mono text-[10px] uppercase text-neutral-400">{x.l}</div><div className="mt-2 text-xl font-black" style={{color:x.c}}>{money(x.v)}</div></div>)}</div><div className={'mt-5 overflow-hidden rounded-xl border '+panel}><div className="border-b px-4 py-3 text-sm font-bold">Movimentações <span className="font-mono text-xs text-neutral-400">({inRange.length})</span></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-xs"><thead className={isDark?'bg-[#0e0e0e] text-neutral-400':'bg-slate-50 text-slate-400'}><tr><th className="px-4 py-3 text-left font-mono uppercase">Data</th><th className="px-4 py-3 text-left font-mono uppercase">Origem</th><th className="px-4 py-3 text-left font-mono uppercase">Cliente</th><th className="px-4 py-3 text-left font-mono uppercase">Identificação</th><th className="px-4 py-3 text-right font-mono uppercase">Faturamento</th></tr></thead><tbody className={isDark?'divide-y divide-neutral-800':'divide-y divide-slate-100'}>{inRange.sort((a,b)=>parseDate(b.date).getTime()-parseDate(a.date).getTime()).map(r=><tr key={r.source+r.id}><td className="px-4 py-3 font-mono text-neutral-400">{r.date}</td><td className="px-4 py-3"><span className="rounded bg-blue-500/10 px-2 py-1 font-mono text-[10px] text-blue-500">{r.source}</span></td><td className="px-4 py-3 font-semibold">{r.client}</td><td className="px-4 py-3 font-mono text-neutral-400">#{r.id}</td><td className="px-4 py-3 text-right font-mono font-bold text-green-500">{money(r.total)}</td></tr>)}</tbody></table>{!inRange.length&&<div className="p-10 text-center text-xs text-neutral-400">Nenhum faturamento registrado no período.</div>}</div></div></div></div>
}

function QuotePortal({ token }: { token: string }) { const [quote, setQuote] = useState<any>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); useEffect(() => { fetch('/api/quote-portal?token=' + encodeURIComponent(token)).then(r => r.json()).then(data => { if (data.error) setError(data.error); else setQuote(data.quote) }).catch(() => setError('Não foi possível carregar este orçamento.')).finally(() => setLoading(false)) }, [token]); const decide = async (action: 'approve' | 'reject') => { setSending(true); const response = await fetch('/api/quote-portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action }) }); const data = await response.json(); if (data.error) setError(data.error); else setQuote(data.quote); setSending(false) }; if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 font-mono text-sm text-slate-500">Carregando orçamento...</div>; if (error || !quote) return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-center text-sm text-slate-600">{error || 'Link não encontrado.'}</div>; const contact = 'https://wa.me/5573988343028?text=' + encodeURIComponent('Olá! Estou falando sobre o orçamento ' + quote.id + '.'); const decided = quote.status === 'Aprovado' || quote.status === 'Reprovado'; return <div className="min-h-screen bg-slate-100 p-4 text-slate-900"><div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"><div className="mb-6 text-center"><div className="text-lg font-black text-blue-600">ANDRADETECH</div><div className="mt-1 text-sm text-slate-500">Consulta de orçamento</div></div><div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><div><span className="text-slate-400">Orçamento</span><div className="font-bold">{quote.id}</div></div><div><span className="text-slate-400">Equipamento</span><div className="font-bold">{quote.device}</div></div><div><span className="text-slate-400">Descrição</span><div>{quote.description}</div></div><div className="border-t pt-3"><span className="text-slate-400">Valor do orçamento</span><div className="text-2xl font-black text-blue-600">R$ {Number(quote.value || 0).toFixed(2)}</div></div></div>{decided ? <div className="mt-5 rounded-xl bg-green-50 p-3 text-center text-sm font-semibold text-green-700">Resposta registrada: {quote.status}. O pagamento será realizado somente na retirada do equipamento.</div> : <div className="mt-5 space-y-2"><button disabled={sending} onClick={() => decide('approve')} className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white">Aprovar orçamento</button><a href={contact} target="_blank" rel="noreferrer" className="block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-bold text-white">Entrar em contato</a><button disabled={sending} onClick={() => decide('reject')} className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600">Reprovar orçamento</button><p className="pt-2 text-center text-xs text-slate-400">Nenhum pagamento é solicitado nesta página.</p></div>}</div></div> } function ProductModal({
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
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)
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
  const [showUserModal, setShowUserModal] = useState(false)
  const [userEditing, setUserEditing] = useState<UserProfile | null>(null)

  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [clientEditing, setClientEditing] = useState<Client | null>(null)
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null)
  const [printDocumentKind, setPrintDocumentKind] = useState<'order' | 'sale' | 'quote'>('order')
  const [pixOrderPayment, setPixOrderPayment] = useState<{ id: string; total: number; customer?: { name: string; phone: string; email?: string; cep?: string; addressNumber?: string; complement?: string } } | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [services, setServices] = useState<CustomService[]>(DEFAULT_SERVICES)
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS)
  const [statuses, setStatuses] = useState<CustomStatus[]>(DEFAULT_STATUSES)
  const [profiles, setProfiles] = useState<UserProfile[]>([])

  // Autenticação inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setAuthLoading(false)
    }).catch(() => {
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Presença online & Canal de Desconexão Forçada
  useEffect(() => {
    if (!session?.user) return

    const room = supabase.channel('online-presence', {
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
      .on('broadcast', { event: 'force-disconnect' }, payload => {
        if (payload.payload?.userId === session.user.id) {
          alert('Sua sessão foi encerrada pelo administrador.')
          supabase.auth.signOut()
        }
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
    if (!session?.user) return

    // Busca o perfil do usuário logado
    try {
      const { data: myProf } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (myProf) {
        if (myProf.active === false) {
          alert('Sua conta foi desativada.')
          await supabase.auth.signOut()
          return
        }
        setCurrentUserProfile(myProf)
        // Se a tela atual não for permitida, vai para a primeira liberada
        if (myProf.modules && myProf.modules.length > 0 && !myProf.modules.includes(screen)) {
          setScreen(myProf.modules[0])
        }
      }
    } catch {}

    // Lista de todos os perfis
    try {
      const { data: profData } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
      if (profData) setProfiles(profData)
    } catch {}

    try {
      const { data: cData } = await supabase.from('clients').select('*')
      if (cData) {
        setClients(cData.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '', email: c.email || '',
          cpf: c.cpf || '',
          address: c.address || '', cep: c.cep || '', addressNumber: c.address_number || '', complement: c.complement || '',
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
          status: q.status || 'Pendente', publicToken: q.public_token || '',
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

    setAuthLoading(false)
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

  // Desconecta remotamente um usuário via broadcast
  const handleForceDisconnect = async (userId: string) => {
    if (!confirm('Deseja realmente derrubar a conexão deste usuário?')) return
    const channel = supabase.channel('online-presence')
    await channel.send({
      type: 'broadcast',
      event: 'force-disconnect',
      payload: { userId },
    })
    alert('Comando de desconexão enviado.')
  }

  const handleDeleteUser = async (user: UserProfile) => {
    if (currentUserProfile?.role !== 'admin') return
    if (user.id === session?.user?.id) return alert('Não é permitido apagar o próprio usuário.')
    if (!confirm(`Deseja realmente apagar o usuário ${user.name}?`)) return

    const { data: deletedProfiles, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)
      .select('id')

    if (error || !deletedProfiles?.some(profile => profile.id === user.id)) {
      alert(`Não foi possível apagar o usuário${error ? `: ${error.message}` : '. Verifique a política de exclusão no Supabase.'}`)
      return
    }
    setProfiles(prev => prev.filter(profile => profile.id !== user.id))
    alert('Usuário apagado com sucesso.')
  }

  // Atualiza perfil e permissões do usuário
  const handleSaveUser = async (data: Partial<UserProfile> & { password?: string }) => {
    if (!data.id) {
      try {
        const supabaseUrl = (supabase as any).supabaseUrl
        const supabaseKey = (supabase as any).supabaseKey
        if (!supabaseUrl || !supabaseKey) throw new Error('Nao foi possivel obter a configuracao do Supabase.')

        const tempAuthClient = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
        const { data: authData, error: authError } = await tempAuthClient.auth.signUp({
          email: data.email!, password: data.password!, options: { data: { name: data.name } },
        })
        if (authError) throw authError

        if (authData.user) {
          const { error } = await supabase.from('profiles').upsert([{
            id: authData.user.id,
            email: data.email!,
            name: data.name!,
            role: data.role || 'technician',
            active: data.active ?? true,
            modules: data.modules || ['dashboard', 'orders', 'pdv'],
          }])
          if (error) throw error
          alert(`Usuario ${data.name} cadastrado com sucesso! Ja pode realizar o login.`)
          await fetchData()
        }
      } catch (err: any) {
        alert(`Falha no cadastro: ${err.message}`)
        throw err
      }
      return
    }
    setProfiles(prev => prev.map(p => p.id === data.id ? { ...p, ...data } as UserProfile : p))
    await supabase.from('profiles').update({
      name: data.name,
      role: data.role,
      active: data.active,
      modules: data.modules,
    }).eq('id', data.id)
    alert('Usuario atualizado com sucesso!')

    // Se editou o próprio perfil, atualiza na hora
    if (data.id === session?.user?.id) {
      setCurrentUserProfile(prev => prev ? ({ ...prev, ...data } as UserProfile) : null)
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
      phone: clientData.phone, email: clientData.email,
      cpf: clientData.cpf,
      address: clientData.address, cep: clientData.cep, address_number: clientData.addressNumber, complement: clientData.complement,
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

    if (isOrderFinalized(orderData.status) && isPixConfigured()) {
      setPixOrderPayment({ id: orderData.id, total: orderData.value, customer: { name: orderData.client, phone: orderData.phone, email: clients.find(c => c.name === orderData.client)?.email, cep: clients.find(c => c.name === orderData.client)?.cep, addressNumber: clients.find(c => c.name === orderData.client)?.addressNumber, complement: clients.find(c => c.name === orderData.client)?.complement } })
    }
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

    const approvedStatus = statuses.find(s => s.label.toLowerCase() === 'aprovado')?.label || 'Aprovado'

    const newOrder: Order = {
      id: `OS-${Math.floor(1000 + Math.random() * 9000)}`,
      client: quote.client,
      phone: quote.phone,
      device: quote.device,
      service: (quote.items && quote.items[0]?.desc) || quote.description || 'Serviço Técnico',
      status: approvedStatus,
      value: quote.value,
      date: new Date().toLocaleDateString('pt-BR'),
      technician: currentUserProfile?.name || 'Admin',
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
    alert(`Orçamento #${quote.id} aprovado e cadastrado nas Ordens como ${approvedStatus}!`)
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
      alert(`Não foi possível excluir a venda #${sale.id}.`)
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

    if (saleData.payment_method === 'PIX') {
      setPixOrderPayment({ id: saleData.id, total: saleData.total, customer: { name: saleData.client, phone: saleData.phone, email: clients.find(c => c.name === saleData.client)?.email, cep: clients.find(c => c.name === saleData.client)?.cep, addressNumber: clients.find(c => c.name === saleData.client)?.addressNumber, complement: clients.find(c => c.name === saleData.client)?.complement } })
      return
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
        technician: currentUserProfile?.name || 'Frente de Caixa',
        notes: `Comprovante de Compra emitido no PDV. Pagamento efetuado via ${saleData.payment_method}.`,
        items: saleData.items,
      })
    }
  }

  const quotePortalToken = new URLSearchParams(window.location.search).get('orcamento'); if (quotePortalToken) return <QuotePortal token={quotePortalToken} />; if (authLoading) {
    return (
      <div className={`flex h-screen items-center justify-center font-mono text-xs ${isDark ? 'bg-[#0a0a0a] text-neutral-400' : 'bg-slate-100 text-slate-500'}`}>
        Conectando com o banco de dados...
      </div>
    )
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={() => fetchData()} isDark={isDark} />
  }

  // Filtra itens de menu de acordo com as permissões do perfil do usuário logado
  const allowedNavItems = BASE_NAV_ITEMS.filter(item =>
    item.id === 'users' || item.id === 'revenue'
      ? currentUserProfile?.role === 'admin'
      : currentUserProfile?.modules ? currentUserProfile.modules.includes(item.id) : true
  )

  const safeClients = Array.isArray(clients) ? clients : []
  const selectedClientForPrint = orderToPrint ? safeClients.find(c => c.name.toLowerCase() === (orderToPrint.client || '').toLowerCase()) : undefined

  return (
    <div className={`flex h-screen overflow-hidden transition-colors ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-slate-100 text-slate-900'}`}>
      <aside className={`hidden h-screen flex-shrink-0 flex-col border-r transition-colors md:flex ${
        [Truncated]
