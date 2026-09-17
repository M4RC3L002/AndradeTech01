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

interface CustomStatus {
  id: string
  label: string
  dot: string
}

// ─── Padrões Iniciais ─────────────────────────────────────────────────────────

const DEFAULT_STATUSES: CustomStatus[] = [
  { id: '1', label: 'Entrada', dot: '#64748B' },
  { id: '2', label: 'Orçamento', dot: '#F59E0B' },
  { id: '3', label: 'Em Análise', dot: '#3B82F6' },
  { id: '4', label: 'Aguardando Peça', dot: '#A855F7' },
  { id: '5', label: 'Concluído', dot: '#10B981' },
  { id: '6', label: 'Entregue', dot: '#059669' },
  { id: '7', label: 'Cancelado', dot: '#EF4444' },
]

const DEFAULT_SERVICES: CustomService[] = [
  { id: '1', name: 'Troca de Tela', default_price: 350, category: 'Hardware' },
  { id: '2', name: 'Reparo de Bateria', default_price: 180, category: 'Hardware' },
  { id: '3', name: 'Formatação + SO', default_price: 150, category: 'Software' },
  { id: '4', name: 'Limpeza Interna e Pasta', default_price: 120, category: 'Manutenção' },
  { id: '5', name: 'Troca de Conector de Carga', default_price: 130, category: 'Hardware' },
  { id: '6', name: 'Diagnóstico e Orçamento', default_price: 0, category: 'Diagnóstico' },
]

// ─── Tela de Login ───────────────────────────────────────────────────────────

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
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
      setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.')
      setLoading(false)
    } else {
      onLoginSuccess()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl" style={{ background: '#111111', borderColor: '#222222' }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#2563EB' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-neutral-100">AndradeTech</h1>
          <p className="font-mono text-xs text-neutral-500">Acesso Restrito ao Sistema</p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-2.5 text-center text-xs text-red-400">
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
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
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
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#2563EB' }}
          >
            {loading ? 'Validando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function StatusBadge({ status, statuses }: { status: string; statuses: CustomStatus[] }) {
  const current = statuses.find(s => s.label.toLowerCase() === status.toLowerCase()) || {
    label: status,
    dot: '#888888',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 font-mono text-xs font-medium"
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
          (orderDetails.value ? `*Valor Total:* R$ ${orderDetails.value.toFixed(2)}\n\n` : '\n') +
          `Estamos à disposição!`
  } else if (quoteDetails) {
    msg = `*AndradeTech - Proposta de Orçamento*\n\n` +
          `Olá, *${quoteDetails.client || 'Cliente'}*!\n` +
          `*Orçamento:* #${quoteDetails.id || '---'}\n` +
          `*Aparelho:* ${quoteDetails.device || 'N/A'}\n` +
          `*Descrição:* ${quoteDetails.description || 'Reparo técnico'}\n` +
          `*Valor Total:* R$ ${(quoteDetails.value || 0).toFixed(2)}\n` +
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
      className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      style={{ background: '#25D366' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span className="hidden sm:inline">{label || 'WhatsApp'}</span>
    </a>
  )
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 opacity-20">{icon}</div>
      <div className="mb-1 text-sm font-medium text-neutral-400">{title}</div>
      <div className="text-xs text-neutral-600">{sub}</div>
    </div>
  )
}

// ─── Modal: Ordem de Serviço ──────────────────────────────────────────────────

function OrderModal({
  onClose,
  clients,
  statuses,
  services,
  onSave,
  orderToEdit,
}: {
  onClose: () => void
  clients: Client[]
  statuses: CustomStatus[]
  services: CustomService[]
  onSave: (order: Order) => void
  orderToEdit?: Order | null
}) {
  const [client, setClient] = useState(orderToEdit?.client || '')
  const [phone, setPhone] = useState(orderToEdit?.phone || '')
  const [device, setDevice] = useState(orderToEdit?.device || '')
  const [technician, setTechnician] = useState(orderToEdit?.technician || 'Admin')
  const [notes, setNotes] = useState(orderToEdit?.notes || '')
  const [status, setStatus] = useState(orderToEdit?.status || (statuses[0]?.label ?? 'Entrada'))
  const [items, setItems] = useState<OrderItem[]>(
    orderToEdit?.items && orderToEdit.items.length > 0
      ? orderToEdit.items
      : [{ desc: orderToEdit?.service || '', qty: 1, unit: orderToEdit?.value || 0 }]
  )

  const total = items.reduce((s, i) => s + (i.qty || 1) * (i.unit || 0), 0)

  const handleClientChange = (name: string) => {
    setClient(name)
    const found = clients.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (found) setPhone(found.phone)
  }

  const handleApplyServicePreset = (serviceName: string, index: number) => {
    const svc = services.find(s => s.name === serviceName)
    if (svc) {
      setItems(items.map((it, idx) => idx === index ? { ...it, desc: svc.name, unit: svc.default_price } : it))
    }
  }

  const handleSave = (e: React.FormEvent, sendToWhatsApp = false) => {
    e.preventDefault()
    if (!client.trim() || !device.trim()) {
      alert('Preencha o cliente e o aparelho!')
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-4">
      <form onSubmit={(e) => handleSave(e, false)} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl border border-neutral-800 bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5">
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">
              {orderToEdit ? `EDITANDO ${orderToEdit.id}` : 'NOVO REGISTRO'}
            </div>
            <h2 className="text-sm font-bold text-neutral-100 sm:text-base">
              {orderToEdit ? 'Editar Ordem de Serviço' : 'Registrar Ordem de Serviço'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Cliente *</label>
              <input
                list="client-options"
                value={client}
                onChange={e => handleClientChange(e.target.value)}
                placeholder="Nome do cliente..."
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
              <datalist id="client-options">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">WhatsApp / Tel</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Aparelho *</label>
              <input
                value={device}
                onChange={e => setDevice(e.target.value)}
                placeholder="Ex: Notebook Lenovo, Galaxy S21..."
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Situação</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Técnico Responsável</label>
            <input
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Diagnóstico / Defeito</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Relato do problema, observações do aparelho..."
              className="w-full resize-none rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Itens / Serviços</label>
              <button
                type="button"
                onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/60 text-neutral-500">
                    <th className="px-3 py-2 text-left font-mono uppercase">Item / Serviço</th>
                    <th className="w-12 px-2 py-2 text-center font-mono uppercase">Qtd</th>
                    <th className="w-20 px-2 py-2 text-right font-mono uppercase">Unit</th>
                    <th className="w-20 px-2 py-2 text-right font-mono uppercase">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-neutral-800">
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row">
                          <input
                            value={item.desc}
                            onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                            placeholder="Descrição..."
                            className="w-full bg-transparent text-neutral-200 outline-none"
                          />
                          {services.length > 0 && (
                            <select
                              onChange={e => {
                                if (e.target.value) handleApplyServicePreset(e.target.value, i)
                              }}
                              className="rounded border border-neutral-700 bg-[#222] text-[10px] text-neutral-400 outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Catálogo</option>
                              {services.map(s => (
                                <option key={s.id} value={s.name}>{s.name} (R${s.default_price})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: Math.max(1, +e.target.value) } : it))}
                          className="w-full bg-transparent text-center font-mono text-neutral-200 outline-none"
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
                          className="w-full bg-transparent text-right font-mono text-neutral-200 outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-neutral-400">
                        R$ {((item.qty || 1) * (item.unit || 0)).toFixed(2)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => items.length > 1 && setItems(items.filter((_, j) => j !== i))}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-700 bg-black/40">
                    <td colSpan={3} className="px-3 py-2 text-right font-mono uppercase text-neutral-500">Total:</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-white">R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center justify-between gap-2 border-t border-neutral-800 px-5 py-3 sm:flex-row">
          <button type="button" onClick={onClose} className="w-full px-4 py-2 text-xs text-neutral-500 hover:text-white sm:w-auto">
            Cancelar
          </button>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 sm:flex-initial">
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
  clients,
  services,
  onSave,
}: {
  onClose: () => void
  clients: Client[]
  services: CustomService[]
  onSave: (quote: Quote) => void
}) {
  const [client, setClient] = useState('')
  const [phone, setPhone] = useState('')
  const [device, setDevice] = useState('')
  const [description, setDescription] = useState('')
  const [validDays, setValidDays] = useState('7')
  const [items, setItems] = useState<OrderItem[]>([{ desc: '', qty: 1, unit: 0 }])

  const total = items.reduce((s, i) => s + (i.qty || 1) * (i.unit || 0), 0)

  const handleClientChange = (name: string) => {
    setClient(name)
    const found = clients.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (found) setPhone(found.phone)
  }

  const handleApplyServicePreset = (serviceName: string, index: number) => {
    const svc = services.find(s => s.name === serviceName)
    if (svc) {
      setItems(items.map((it, idx) => idx === index ? { ...it, desc: svc.name, unit: svc.default_price } : it))
    }
  }

  const handleSave = (e: React.FormEvent, sendWhatsApp = false) => {
    e.preventDefault()
    if (!client.trim() || !device.trim()) {
      alert('Informe o cliente e o aparelho!')
      return
    }

    const expDate = new Date()
    expDate.setDate(expDate.getDate() + (Number(validDays) || 7))

    const newQuote: Quote = {
      id: `ORC-${Math.floor(1000 + Math.random() * 9000)}`,
      client,
      phone,
      device,
      description: description || items[0]?.desc || 'Proposta de serviço',
      value: total,
      validUntil: expDate.toLocaleDateString('pt-BR'),
      createdAt: new Date().toLocaleDateString('pt-BR'),
      status: 'Pendente',
      items,
    }

    onSave(newQuote)

    if (sendWhatsApp && phone) {
      const msg = `*AndradeTech - Proposta de Orçamento #${newQuote.id}*\n\n` +
                  `Olá, *${client}*!\n` +
                  `*Aparelho:* ${device}\n` +
                  `*Descrição:* ${newQuote.description}\n` +
                  `*Valor Total:* R$ ${total.toFixed(2)}\n` +
                  `*Válido até:* ${newQuote.validUntil}\n\n` +
                  `Aguardamos sua aprovação para iniciar o trabalho!`
      window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-4">
      <form onSubmit={(e) => handleSave(e, false)} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl border border-neutral-800 bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5">
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">PROPOSTA COMERCIAL</div>
            <h2 className="text-sm font-bold text-neutral-100 sm:text-base">Criar Novo Orçamento</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Cliente *</label>
              <input
                list="client-options-quote"
                value={client}
                onChange={e => handleClientChange(e.target.value)}
                placeholder="Nome do cliente..."
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
              <datalist id="client-options-quote">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">WhatsApp / Tel</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Aparelho *</label>
              <input
                value={device}
                onChange={e => setDevice(e.target.value)}
                placeholder="Ex: iPhone 12, Notebook Acer..."
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Validade da Proposta</label>
              <select
                value={validDays}
                onChange={e => setValidDays(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="3">3 dias</option>
                <option value="7">7 dias (padrão)</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Resumo do Diagnóstico</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva a falha constatada e o que precisa ser substituído..."
              className="w-full resize-none rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Itens / Peças / Serviços</label>
              <button
                type="button"
                onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/60 text-neutral-500">
                    <th className="px-3 py-2 text-left font-mono uppercase">Item</th>
                    <th className="w-12 px-2 py-2 text-center font-mono uppercase">Qtd</th>
                    <th className="w-20 px-2 py-2 text-right font-mono uppercase">Unit</th>
                    <th className="w-20 px-2 py-2 text-right font-mono uppercase">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-neutral-800">
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col gap-1 sm:flex-row">
                          <input
                            value={item.desc}
                            onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                            placeholder="Peça ou mão de obra..."
                            className="w-full bg-transparent text-neutral-200 outline-none"
                          />
                          {services.length > 0 && (
                            <select
                              onChange={e => {
                                if (e.target.value) handleApplyServicePreset(e.target.value, i)
                              }}
                              className="rounded border border-neutral-700 bg-[#222] text-[10px] text-neutral-400 outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Catálogo</option>
                              {services.map(s => (
                                <option key={s.id} value={s.name}>{s.name} (R${s.default_price})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: Math.max(1, +e.target.value) } : it))}
                          className="w-full bg-transparent text-center font-mono text-neutral-200 outline-none"
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
                          className="w-full bg-transparent text-right font-mono text-neutral-200 outline-none"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-neutral-400">
                        R$ {((item.qty || 1) * (item.unit || 0)).toFixed(2)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => items.length > 1 && setItems(items.filter((_, j) => j !== i))}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-700 bg-black/40">
                    <td colSpan={3} className="px-3 py-2 text-right font-mono uppercase text-neutral-500">Total:</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-white">R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center justify-between gap-2 border-t border-neutral-800 px-5 py-3 sm:flex-row">
          <button type="button" onClick={onClose} className="w-full px-4 py-2 text-xs text-neutral-500 hover:text-white sm:w-auto">
            Cancelar
          </button>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 sm:flex-initial">
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

// ─── Modal: Cliente ───────────────────────────────────────────────────────────

function ClientModal({
  onClose,
  onSave,
  clientToEdit,
}: {
  onClose: () => void
  onSave: (client: Client) => void
  clientToEdit?: Client | null
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
      city: city || 'Local',
      totalOrders: clientToEdit?.totalOrders || 0,
      totalSpent: clientToEdit?.totalSpent || 0,
      lastService: clientToEdit?.lastService || 'Cadastrado no sistema',
      devices: clientToEdit?.devices || [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4">
      <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3.5">
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-500">
              {clientToEdit ? `EDITANDO ${clientToEdit.id}` : 'CADASTRO'}
            </div>
            <h2 className="text-base font-bold text-neutral-100">
              {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-500 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Nome Completo *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Rafael Mendonça" className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Telefone / WhatsApp *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(DDD) 99999-9999" className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">CPF / CNPJ</label>
              <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Endereço</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro..." className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-neutral-500">Cidade / Estado</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Eunápolis, BA" className="w-full rounded-lg border border-neutral-800 bg-[#181818] px-3 py-2 text-sm text-white outline-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-800 px-5 py-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-500 hover:text-white">
            Cancelar
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">
            {clientToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Navegação e Topbar ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
  )},
  { id: 'orders', label: 'Ordens', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>
  )},
  { id: 'quotes', label: 'Orçamentos', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
  )},
  { id: 'clients', label: 'Clientes', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
  )} as any,
  { id: 'settings', label: 'Ajustes', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2" /></svg>
  )},
] as const

function Topbar({
  title,
  onOpenMobileMenu,
  onNewOrder,
  onNewQuote,
  onNewClient,
  onLogout,
  children,
}: {
  title: string
  onOpenMobileMenu: () => void
  onNewOrder?: () => void
  onNewQuote?: () => void
  onNewClient?: () => void
  onLogout?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-neutral-900 bg-[#0a0a0a] px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex-shrink-0 rounded-lg bg-neutral-900 p-1.5 text-neutral-400 hover:text-white md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div className="truncate">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 sm:text-[10px]">AndradeTech</div>
          <div className="truncate text-xs font-bold text-white sm:text-sm">{title}</div>
        </div>
        {children}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        {onNewClient && (
          <button
            onClick={onNewClient}
            title="Novo Cliente"
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-[#141414] px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /></svg>
            <span className="text-[11px] sm:text-xs">Cliente</span>
          </button>
        )}
        {onNewQuote && (
          <button
            onClick={onNewQuote}
            title="Novo Orçamento"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-900/60 bg-amber-950/20 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-950/40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>
            <span className="text-[11px] sm:text-xs">Orçamento</span>
          </button>
        )}
        {onNewOrder && (
          <button
            onClick={onNewOrder}
            title="Nova OS"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            <span className="text-[11px] sm:text-xs">Nova OS</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tela: Painel ────────────────────────────────────────────────────────────

function DashboardScreen({
  orders,
  quotes,
  statuses,
  onNewOrder,
  onNewQuote,
  onNewClient,
  onEditOrder,
  onOpenMenu,
  onLogout,
}: {
  orders: Order[]
  quotes: Quote[]
  statuses: CustomStatus[]
  onNewOrder: () => void
  onNewQuote: () => void
  onNewClient: () => void
  onEditOrder: (order: Order) => void
  onOpenMenu: () => void
  onLogout: () => void
}) {
  const [search, setSearch] = useState('')

  const openOrders = orders.filter(o => o.status !== 'Concluído' && o.status !== 'Entregue' && o.status !== 'Cancelado').length
  const completedOrders = orders.filter(o => o.status === 'Concluído' || o.status === 'Entregue').length
  const pendingQuotes = quotes.filter(q => q.status === 'Pendente').length
  const totalRevenue = orders.filter(o => o.status !== 'Cancelado').reduce((sum, o) => sum + (o.value || 0), 0)

  const filteredOrders = orders.filter(o =>
    o.client.toLowerCase().includes(search.toLowerCase()) ||
    o.device.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Visão Geral"
        onOpenMobileMenu={onOpenMenu}
        onNewOrder={onNewOrder}
        onNewQuote={onNewQuote}
        onNewClient={onNewClient}
        onLogout={onLogout}
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por OS, cliente, aparelho..."
            className="w-full rounded-xl border border-neutral-800 bg-[#111] py-2.5 pl-9 pr-4 text-xs text-white outline-none sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {[
            { label: 'Em Aberto', value: openOrders.toString(), sub: 'serviços ativos', color: 'text-blue-500' },
            { label: 'Concluídos', value: completedOrders.toString(), sub: 'finalizados', color: 'text-green-500' },
            { label: 'Orçamentos', value: pendingQuotes.toString(), sub: 'pendentes', color: 'text-amber-500' },
            { label: 'Previsto', value: `R$ ${totalRevenue.toFixed(0)}`, sub: 'total faturado', color: 'text-neutral-100' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-neutral-900 bg-[#111] p-3 sm:p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{kpi.label}</span>
              <div className={`mt-1 text-lg font-bold tracking-tight sm:text-2xl ${kpi.color}`}>{kpi.value}</div>
              <div className="mt-0.5 font-mono text-[10px] text-neutral-600 sm:text-xs">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-900 bg-[#111]">
          <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
            <span className="text-xs font-semibold text-neutral-200">Ordens de Serviço Recentes</span>
            <span className="font-mono text-[11px] text-neutral-500">{orders.length} cadastradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#0c0c0c] text-left text-neutral-500">
                  <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cliente / Contato</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Aparelho</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Situação</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                  <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>}
                        title="Nenhuma ordem recente"
                        sub="Registre uma nova OS ou Orçamento"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 10).map(order => (
                    <tr key={order.id} className="hover:bg-neutral-900/50">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-500">{order.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-neutral-200">{order.client}</div>
                        <div className="font-mono text-[10px] text-neutral-500">{order.phone || 'Sem telefone'}</div>
                      </td>
                      <td className="px-3 py-2.5 text-neutral-400">{order.device}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={order.status} statuses={statuses} /></td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-neutral-200">
                        {order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onEditOrder(order)}
                            className="rounded p-1 text-neutral-400 hover:text-white"
                            title="Editar OS"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <WhatsAppBtn phone={order.phone} orderDetails={order} />
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

// ─── Tela: Ordens de Serviço ──────────────────────────────────────────────────

function OrdersScreen({
  orders,
  statuses,
  onNewOrder,
  onEditOrder,
  onUpdateStatus,
  onDeleteOrder,
  onOpenMenu,
  onLogout,
}: {
  orders: Order[]
  statuses: CustomStatus[]
  onNewOrder: () => void
  onEditOrder: (order: Order) => void
  onUpdateStatus: (id: string, status: string) => void
  onDeleteOrder: (id: string) => void
  onOpenMenu: () => void
  onLogout: () => void
}) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('Todos')

  const filtered = filterStatus === 'Todos' ? orders : orders.filter(o => o.status === filterStatus)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Ordens de Serviço" onOpenMobileMenu={onOpenMenu} onNewOrder={onNewOrder} onLogout={onLogout}>
        <div className="ml-2 flex items-center gap-1 rounded-lg border border-neutral-800 bg-[#111] p-0.5">
          {(['list','kanban'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded px-2 py-1 text-[11px] font-medium"
              style={{ background: view === v ? '#2563EB' : 'transparent', color: view === v ? '#fff' : '#666' }}
            >
              {v === 'list' ? 'Lista' : 'Quadro'}
            </button>
          ))}
        </div>
      </Topbar>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {['Todos', ...statuses.map(s => s.label)].map(s => {
            const isActive = filterStatus === s
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="whitespace-nowrap rounded-full border px-3 py-1 font-mono text-xs"
                style={{
                  background: isActive ? 'rgba(37,99,235,0.2)' : 'transparent',
                  color: isActive ? '#3B82F6' : '#666',
                  borderColor: isActive ? '#2563EB' : '#222',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {view === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-neutral-900 bg-[#111]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="border-b border-neutral-900 bg-[#0c0c0c] text-left text-neutral-500">
                    <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Cliente</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Aparelho</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Situação</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                    <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>}
                          title="Nenhuma ordem encontrada"
                          sub="Crie uma nova OS para começar"
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-900/50">
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-500">{order.id}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-neutral-200">{order.client}</div>
                          <div className="font-mono text-[10px] text-neutral-500">{order.phone || '—'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-neutral-400">{order.device}</td>
                        <td className="px-3 py-2.5">
                          <select
                            value={order.status}
                            onChange={e => onUpdateStatus(order.id, e.target.value)}
                            className="rounded border border-neutral-800 bg-transparent px-1.5 py-0.5 font-mono text-xs text-neutral-300 outline-none"
                          >
                            {statuses.map(st => (
                              <option key={st.id} value={st.label} style={{ background: '#111' }}>{st.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-neutral-200">
                          {order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onEditOrder(order)}
                              className="rounded p-1 text-neutral-400 hover:text-white"
                              title="Editar OS"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <WhatsAppBtn phone={order.phone} orderDetails={order} />
                            <button
                              onClick={() => { if(confirm(`Excluir ${order.id}?`)) onDeleteOrder(order.id) }}
                              className="rounded p-1 text-neutral-500 hover:text-red-400"
                              title="Excluir OS"
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
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {statuses.map(st => {
              const colOrders = orders.filter(o => o.status.toLowerCase() === st.label.toLowerCase())
              return (
                <div key={st.id} className="flex w-64 flex-shrink-0 flex-col rounded-xl border border-neutral-900 bg-[#111]">
                  <div className="flex items-center justify-between border-b border-neutral-900 px-3.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
                      <span className="font-mono text-xs font-semibold" style={{ color: st.dot }}>{st.label}</span>
                    </div>
                    <span className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">{colOrders.length}</span>
                  </div>
                  <div className="min-h-[140px] flex-1 space-y-2 p-2">
                    {colOrders.length === 0 ? (
                      <div className="py-8 text-center font-mono text-xs text-neutral-700">vazio</div>
                    ) : (
                      colOrders.map(order => (
                        <div key={order.id} className="space-y-1.5 rounded-lg border border-neutral-800 bg-[#0d0d0d] p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-500">{order.id}</span>
                            <span className="font-mono text-[10px] text-neutral-500">{order.date}</span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-200">{order.client}</div>
                          <div className="text-[11px] text-neutral-400">{order.device}</div>
                          <div className="flex items-center justify-between border-t border-neutral-900 pt-2">
                            <span className="font-mono text-xs text-white">R$ {order.value.toFixed(2)}</span>
                            <div className="flex gap-1">
                              <button onClick={() => onEditOrder(order)} className="p-1 text-neutral-400 hover:text-white">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                              <WhatsAppBtn phone={order.phone} orderDetails={order} />
                            </div>
                          </div>
                        </div>
                      ))
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

// ─── Tela: Orçamentos ─────────────────────────────────────────────────────────

function QuotesScreen({
  quotes,
  onNewQuote,
  onConvertToOrder,
  onDeleteQuote,
  onOpenMenu,
  onLogout,
}: {
  quotes: Quote[]
  onNewQuote: () => void
  onConvertToOrder: (quote: Quote) => void
  onDeleteQuote: (id: string) => void
  onOpenMenu: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Orçamentos & Propostas" onOpenMobileMenu={onOpenMenu} onNewQuote={onNewQuote} onLogout={onLogout} />

      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        <div className="flex items-center justify-between sm:hidden">
          <span className="font-mono text-xs text-neutral-400">{quotes.length} orçamentos</span>
          <button
            onClick={onNewQuote}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
          >
            + Novo Orçamento
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-900 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#0c0c0c] text-left text-neutral-500">
                  <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cliente / Aparelho</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Resumo</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Validade</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Status</th>
                  <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /></svg>}
                        title="Nenhum orçamento cadastrado"
                        sub="Clique em '+ Orçamento' para gerar uma proposta"
                      />
                    </td>
                  </tr>
                ) : (
                  quotes.map(q => (
                    <tr key={q.id} className="hover:bg-neutral-900/50">
                      <td className="px-3 py-2.5 font-mono font-bold text-amber-500">{q.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-neutral-200">{q.client}</div>
                        <div className="text-[10px] text-neutral-400">{q.device}</div>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-neutral-400">{q.description}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-white">R$ {q.value.toFixed(2)}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">{q.validUntil}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                          q.status === 'Aprovado' ? 'border border-green-800/40 bg-green-950/60 text-green-400' :
                          q.status === 'Cancelado' ? 'border border-red-800/40 bg-red-950/60 text-red-400' :
                          'border border-amber-800/40 bg-amber-950/60 text-amber-400'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {q.status !== 'Aprovado' && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja converter o orçamento ${q.id} em uma Ordem de Serviço?`)) {
                                  onConvertToOrder(q)
                                }
                              }}
                              className="rounded border border-blue-600/40 bg-blue-600/30 px-2 py-1 text-[11px] font-semibold text-blue-400 transition-colors hover:bg-blue-600 hover:text-white"
                              title="Converter para OS"
                            >
                              Virar OS
                            </button>
                          )}
                          <WhatsAppBtn phone={q.phone} quoteDetails={q} />
                          <button
                            onClick={() => { if(confirm(`Descartar o orçamento ${q.id}?`)) onDeleteQuote(q.id) }}
                            className="rounded p-1 text-neutral-500 transition-colors hover:text-red-400"
                            title="Descartar orçamento"
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

// ─── Tela: Clientes ───────────────────────────────────────────────────────────

function ClientsScreen({
  clients,
  onNewClient,
  onEditClient,
  onDeleteClient,
  onOpenMenu,
  onLogout,
}: {
  clients: Client[]
  onNewClient: () => void
  onEditClient: (client: Client) => void
  onDeleteClient: (id: string) => void
  onOpenMenu: () => void
  onLogout: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Base de Clientes" onOpenMobileMenu={onOpenMenu} onNewClient={onNewClient} onLogout={onLogout} />

      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente ou tel..."
              className="w-full rounded-xl border border-neutral-800 bg-[#111] py-2 pl-9 pr-3 text-xs text-white outline-none sm:text-sm"
            />
          </div>
          <button
            onClick={onNewClient}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            <span>+ Cliente</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-900 bg-[#111]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#0c0c0c] text-left text-neutral-500">
                  <th className="px-3 py-2.5 font-mono uppercase">Nome</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Telefone</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cidade</th>
                  <th className="px-3 py-2.5 text-right font-mono uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                        title="Nenhum cliente cadastrado"
                        sub="Toque em '+ Cliente' para cadastrar"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-900/50">
                      <td className="px-3 py-2.5 font-semibold text-neutral-200">{c.name}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">{c.phone || 'Sem número'}</td>
                      <td className="px-3 py-2.5 text-neutral-500">{c.city}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onEditClient(c)}
                            className="rounded p-1 text-neutral-400 transition-colors hover:text-white"
                            title="Editar Cliente"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <WhatsAppBtn phone={c.phone} label={`Olá ${c.name}!`} />
                          <button
                            onClick={() => { if(confirm(`Deseja realmente excluir o cliente ${c.name}?`)) onDeleteClient(c.id) }}
                            className="rounded p-1 text-neutral-500 transition-colors hover:text-red-400"
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

// ─── Tela: Cadastros Rápidos ──────────────────────────────────────────────────

function SettingsScreen({
  services,
  statuses,
  onAddService,
  onDeleteService,
  onAddStatus,
  onDeleteStatus,
  onOpenMenu,
  onLogout,
}: {
  services: CustomService[]
  statuses: CustomStatus[]
  onAddService: (svc: CustomService) => void
  onDeleteService: (id: string) => void
  onAddStatus: (st: CustomStatus) => void
  onDeleteStatus: (id: string) => void
  onOpenMenu: () => void
  onLogout: () => void
}) {
  const [newSvcName, setNewSvcName] = useState('')
  const [newSvcPrice, setNewSvcPrice] = useState('')
  const [showAddService, setShowAddService] = useState(false)

  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#2563EB')
  const [showAddStatus, setShowAddStatus] = useState(false)

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSvcName.trim()) return
    onAddService({
      id: Date.now().toString(),
      name: newSvcName.trim(),
      default_price: Number(newSvcPrice) || 0,
      category: 'Geral',
    })
    setNewSvcName('')
    setNewSvcPrice('')
    setShowAddService(false)
  }

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatusLabel.trim()) return
    onAddStatus({
      id: Date.now().toString(),
      label: newStatusLabel.trim(),
      dot: newStatusColor,
    })
    setNewStatusLabel('')
    setShowAddStatus(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Configurações & Catálogo" onOpenMobileMenu={onOpenMenu} onLogout={onLogout} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-900 bg-[#111]">
            <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
              <span className="text-xs font-semibold text-neutral-200">Serviços Cadastrados</span>
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-400"
              >
                {showAddService ? 'Fechar' : '+ Novo Serviço'}
              </button>
            </div>

            {showAddService && (
              <form onSubmit={handleCreateService} className="space-y-2 border-b border-neutral-900 bg-black/40 p-3">
                <input
                  required
                  placeholder="Nome do serviço..."
                  value={newSvcName}
                  onChange={e => setNewSvcName(e.target.value)}
                  className="w-full rounded border border-neutral-800 bg-[#181818] px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="number"
                  placeholder="Preço padrão (R$)"
                  value={newSvcPrice}
                  onChange={e => setNewSvcPrice(e.target.value)}
                  className="w-full rounded border border-neutral-800 bg-[#181818] px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <button type="submit" className="w-full rounded bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-500">
                  Adicionar
                </button>
              </form>
            )}

            <div className="max-h-72 divide-y divide-neutral-900 overflow-y-auto">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div>
                    <div className="font-medium text-neutral-200">{s.name}</div>
                    <div className="font-mono text-neutral-500">R$ {s.default_price.toFixed(2)}</div>
                  </div>
                  <button onClick={() => onDeleteService(s.id)} className="text-neutral-600 hover:text-red-400">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-900 bg-[#111]">
            <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
              <span className="text-xs font-semibold text-neutral-200">Situações de OS</span>
              <button
                onClick={() => setShowAddStatus(!showAddStatus)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-400"
              >
                {showAddStatus ? 'Fechar' : '+ Nova Situação'}
              </button>
            </div>

            {showAddStatus && (
              <form onSubmit={handleCreateStatus} className="space-y-2 border-b border-neutral-900 bg-black/40 p-3">
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="Ex: Em Garantia, Retorno..."
                    value={newStatusLabel}
                    onChange={e => setNewStatusLabel(e.target.value)}
                    className="flex-1 rounded border border-neutral-800 bg-[#181818] px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={e => setNewStatusColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                  />
                </div>
                <button type="submit" className="w-full rounded bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-500">
                  Adicionar Situação
                </button>
              </form>
            )}

            <div className="max-h-72 divide-y divide-neutral-900 overflow-y-auto">
              {statuses.map(st => (
                <div key={st.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: st.dot }} />
                    <span className="text-neutral-200">{st.label}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (statuses.length <= 1) return alert('Mantenha ao menos uma situação!')
                      onDeleteStatus(st.id)
                    }}
                    className="text-neutral-600 hover:text-red-400"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
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

// ─── Raiz da Aplicação ────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [clientEditing, setClientEditing] = useState<Client | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [services, setServices] = useState<CustomService[]>(DEFAULT_SERVICES)
  const [statuses, setStatuses] = useState<CustomStatus[]>(DEFAULT_STATUSES)

  // 1. Verificação de Sessão do Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Rastreador em Tempo Real de Presença (Técnicos Online)
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
        const presenceState = room.presenceState()
        // Extrai a primeira conexão de cada ID agrupado
        const users = Object.keys(presenceState).map(key => presenceState[key][0] as any)
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            user_id: session.user.id,
            email: session.user.email,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(room)
    }
  }, [session])

  // 3. Carregar dados da Nuvem
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

      const { data: sData } = await supabase.from('services').select('*')
      if (sData && sData.length > 0) setServices(sData)

      const { data: stData } = await supabase.from('statuses').select('*')
      if (stData && stData.length > 0) setStatuses(stData)
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err)
    }
  }

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  // Logout
  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut()
    }
  }

  // Ações de Clientes
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

  // Ações de Ordens
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

  // Ações de Orçamentos
  const handleSaveQuote = async (quoteData: Quote) => {
    setQuotes(prev => [quoteData, ...prev])
    await supabase.from('quotes').insert([{
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

  // Se estiver verificando autenticação
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] font-mono text-xs text-neutral-500">
        Conectando com o banco de dados...
      </div>
    )
  }

  // Se não estiver logado, exibe tela de login
  if (!session) {
    return <LoginScreen onLoginSuccess={() => fetchData()} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden h-screen flex-shrink-0 flex-col border-r border-neutral-900 bg-[#111] md:flex" style={{ width: 220 }}>
        <div className="flex items-center gap-2.5 border-b border-neutral-900 px-5 py-4">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-100">AndradeTech</div>
            <div className="font-mono text-[10px] text-neutral-500">Acesso Autenticado</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {NAV_ITEMS.map(item => {
            const isActive = screen === item.id
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id as Screen)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors"
                style={{
                  background: isActive ? '#2563EB' : 'transparent',
                  color: isActive ? '#fff' : '#888',
                }}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Indicador de Técnicos Online - PC */}
        <div className="border-t border-neutral-900 p-3 pb-0">
          <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">Técnicos Online ({onlineUsers.length})</div>
          <div className="mb-3 max-h-24 space-y-1.5 overflow-y-auto px-1">
            {onlineUsers.map(u => (
              <div key={u.user_id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                <span className="truncate text-[11px] font-semibold text-neutral-300" title={u.email}>{u.email.split('@')[0]}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-red-400"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 md:hidden">
          <div className="flex h-full w-64 flex-col border-r border-neutral-800 bg-[#111] p-4">
            <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-4">
              <span className="text-sm font-bold text-white">AndradeTech OS</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-neutral-400 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setScreen(item.id as Screen)
                    setMobileMenuOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                    screen === item.id ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Indicador de Técnicos Online - Mobile */}
            <div className="mt-auto border-t border-neutral-800 pt-3">
              <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">Técnicos Online ({onlineUsers.length})</div>
              <div className="mb-3 max-h-24 space-y-1.5 overflow-y-auto px-1">
                {onlineUsers.map(u => (
                  <div key={u.user_id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                    <span className="truncate text-[11px] font-semibold text-neutral-300" title={u.email}>{u.email.split('@')[0]}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-red-400"
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
            onNewOrder={() => { setOrderEditing(null); setShowOrderModal(true) }}
            onNewQuote={() => setShowQuoteModal(true)}
            onNewClient={handleOpenNewClient}
            onEditOrder={(o) => { setOrderEditing(o); setShowOrderModal(true) }}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'orders' && (
          <OrdersScreen
            orders={orders}
            statuses={statuses}
            onNewOrder={() => { setOrderEditing(null); setShowOrderModal(true) }}
            onEditOrder={(o) => { setOrderEditing(o); setShowOrderModal(true) }}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'quotes' && (
          <QuotesScreen
            quotes={quotes}
            onNewQuote={() => setShowQuoteModal(true)}
            onConvertToOrder={handleConvertToOrder}
            onDeleteQuote={handleDeleteQuote}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {screen === 'clients' && (
          <ClientsScreen
            clients={clients}
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
            statuses={statuses}
            onAddService={async (svc) => {
              setServices(prev => [svc, ...prev])
              await supabase.from('services').insert([svc])
            }}
            onDeleteService={async (id) => {
              setServices(prev => prev.filter(s => s.id !== id))
              await supabase.from('services').delete().eq('id', id)
            }}
            onAddStatus={async (st) => {
              setStatuses(prev => [...prev, st])
              await supabase.from('statuses').insert([st])
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
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-neutral-900 bg-[#0d0d0d] px-2 md:hidden">
        {NAV_ITEMS.map(item => {
          const isActive = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id as Screen)}
              className="flex flex-1 flex-col items-center justify-center py-1"
              style={{ color: isActive ? '#3B82F6' : '#666' }}
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
          onSave={handleSaveOrder}
          orderToEdit={orderEditing}
        />
      )}

      {showQuoteModal && (
        <QuoteModal
          onClose={() => setShowQuoteModal(false)}
          clients={clients}
          services={services}
          onSave={handleSaveQuote}
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
        />
      )}
    </div>
  )
}