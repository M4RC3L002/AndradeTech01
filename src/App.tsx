import { useState } from 'react'

// ─── Paleta monocromática ─────────────────────────────────────────────────────
// BG principal:   #0a0a0a  (quase preto)
// Superfície 1:   #111111  (sidebar, cards)
// Superfície 2:   #181818  (painéis internos)
// Superfície 3:   #202020  (linhas de tabela hover, inputs)
// Borda sutil:    #2a2a2a
// Borda normal:   #333333
// Texto primário: #e5e5e5
// Texto secundário:#888888
// Texto mínimo:   #555555
// Acento azul:    #2563EB  (apenas botões primários e active state)
// WhatsApp:       #25D366  (exclusivo para ação WhatsApp)

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'dashboard' | 'orders' | 'quotes' | 'clients' | 'settings'
type OrderStatus = 'Entrada' | 'Em Análise' | 'Aguardando Peça' | 'Concluído' | 'Entregue' | 'Cancelado'
type QuoteStatus = 'Pendente' | 'Aprovado' | 'Expirado' | 'Cancelado'

interface Order {
  id: string
  client: string
  phone: string
  device: string
  service: string
  status: OrderStatus
  value: number
  date: string
  technician: string
  notes: string
}

interface Quote {
  id: string
  client: string
  phone: string
  description: string
  value: number
  validUntil: string
  createdAt: string
  status: QuoteStatus
  items: { desc: string; qty: number; unit: number }[]
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

// ─── Dados zerados ─────────────────────────────────────────────────────────────

const ORDERS: Order[] = []
const QUOTES: Quote[] = []
const CLIENTS: Client[] = []

// ─── Status Config — monocromático com variações sutis de cinza ───────────────

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; dot: string; text: string; bg: string }> = {
  'Entrada':         { label: 'Entrada',         dot: '#555',    text: '#aaa',   bg: 'rgba(255,255,255,0.04)' },
  'Em Análise':      { label: 'Em Análise',      dot: '#888',    text: '#bbb',   bg: 'rgba(255,255,255,0.06)' },
  'Aguardando Peça': { label: 'Aguardando Peça', dot: '#aaa',    text: '#ccc',   bg: 'rgba(255,255,255,0.06)' },
  'Concluído':       { label: 'Concluído',       dot: '#e5e5e5', text: '#e5e5e5',bg: 'rgba(255,255,255,0.08)' },
  'Entregue':        { label: 'Entregue',        dot: '#e5e5e5', text: '#e5e5e5',bg: 'rgba(255,255,255,0.05)' },
  'Cancelado':       { label: 'Cancelado',       dot: '#444',    text: '#666',   bg: 'rgba(255,255,255,0.03)' },
}

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { text: string; bg: string }> = {
  'Pendente':  { text: '#999', bg: 'rgba(255,255,255,0.05)' },
  'Aprovado':  { text: '#e5e5e5', bg: 'rgba(255,255,255,0.08)' },
  'Expirado':  { text: '#555', bg: 'rgba(255,255,255,0.03)' },
  'Cancelado': { text: '#444', bg: 'rgba(255,255,255,0.03)' },
}

// ─── Componentes utilitários ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium"
      style={{ color: cfg.text, background: cfg.bg, border: `1px solid ${cfg.dot}22` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const cfg = QUOTE_STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium"
      style={{ color: cfg.text, background: cfg.bg }}
    >
      {status}
    </span>
  )
}

function WhatsAppBtn({ phone, label = '' }: { phone: string; label?: string }) {
  const msg = encodeURIComponent(`Olá! Passando para informar sobre seu serviço. ${label}`)
  return (
    <a
      href={`https://wa.me/55${phone.replace(/\D/g, '')}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Compartilhar via WhatsApp com mensagem formatada automaticamente"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95 flex-shrink-0"
      style={{ background: '#25D366' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      {label || 'WhatsApp'}
    </a>
  )
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 opacity-20">{icon}</div>
      <div className="text-sm font-medium mb-1" style={{ color: '#888' }}>{title}</div>
      <div className="text-xs" style={{ color: '#555' }}>{sub}</div>
    </div>
  )
}

// ─── Modal: Nova OS ───────────────────────────────────────────────────────────

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<OrderStatus>('Entrada')
  const [items, setItems] = useState([{ desc: '', qty: 1, unit: 0 }])
  const total = items.reduce((s, i) => s + i.qty * i.unit, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl" style={{ background: '#111111', borderColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#222' }}>
          <div>
            <div className="text-xs font-mono mb-0.5" style={{ color: '#555' }}>NOVA ORDEM</div>
            <h2 className="text-base font-bold" style={{ color: '#e5e5e5' }}>Registrar Ordem de Serviço</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: '#555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e5e5e5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Cliente *</label>
              <input placeholder="Buscar por nome..." className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none transition-colors" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Telefone / WhatsApp</label>
              <input placeholder="11 99999-9999" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Aparelho / Equipamento *</label>
              <input placeholder="Ex: iPhone 14 Pro" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Status Inicial</label>
              <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none appearance-none"
                style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}>
                {(['Entrada','Em Análise','Aguardando Peça','Concluído','Entregue'] as OrderStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Descrição / Diagnóstico</label>
            <textarea rows={3} placeholder="Descreva o problema relatado, diagnóstico inicial, observações..."
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none resize-none"
              style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#555' }}>Itens / Serviços</label>
              <button onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-medium transition-colors" style={{ color: '#2563EB' }}>
                + Adicionar Item
              </button>
            </div>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#2a2a2a' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#0a0a0a' }}>
                    {['Descrição','Qtd','Unit (R$)','Total',''].map(h => (
                      <th key={h} className={`px-3 py-2 text-xs font-mono uppercase tracking-wider ${h === 'Qtd' ? 'text-center w-16' : h === '' ? 'w-10' : h !== 'Descrição' ? 'text-right w-28' : 'text-left'}`}
                        style={{ color: '#555' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: '#1a1a1a' }}>
                      <td className="px-3 py-2">
                        <input value={item.desc} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                          placeholder="Descrição do serviço/peça"
                          className="w-full bg-transparent outline-none text-sm placeholder-[#333]" style={{ color: '#ccc' }} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" min="1" value={item.qty}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: +e.target.value } : it))}
                          className="w-full bg-transparent text-center outline-none text-sm font-mono" style={{ color: '#ccc' }} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min="0" value={item.unit || ''}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, unit: +e.target.value } : it))}
                          placeholder="0" className="w-full bg-transparent text-right outline-none text-sm font-mono" style={{ color: '#ccc' }} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm" style={{ color: '#aaa' }}>
                        R$ {(item.qty * item.unit).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ color: '#333' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#333')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t" style={{ borderColor: '#333', background: '#0a0a0a' }}>
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-mono uppercase tracking-wider" style={{ color: '#555' }}>Total Geral</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-sm" style={{ color: '#e5e5e5' }}>R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: '#222' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm transition-colors" style={{ color: '#555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
            Cancelar
          </button>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#2563EB' }}>
              Salvar no Sistema
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Novo Cliente ──────────────────────────────────────────────────────

function NewClientModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl" style={{ background: '#111111', borderColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#222' }}>
          <div>
            <div className="text-xs font-mono mb-0.5" style={{ color: '#555' }}>CADASTRO</div>
            <h2 className="text-base font-bold" style={{ color: '#e5e5e5' }}>Novo Cliente</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: '#555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e5e5e5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Nome Completo *', placeholder: 'Ex: Rafael Mendonça', cols: 1 },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>{f.label}</label>
              <input placeholder={f.placeholder} className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Telefone / WhatsApp *</label>
              <input placeholder="11 99999-9999" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>CPF / CNPJ</label>
              <input placeholder="000.000.000-00" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Endereço</label>
            <input placeholder="Rua, número, complemento" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Cidade</label>
              <input placeholder="São Paulo" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Estado</label>
              <input placeholder="SP" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: '#222' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm transition-colors" style={{ color: '#555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
            Cancelar
          </button>
          <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: '#2563EB' }}>
            Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Painel', sub: 'Visão Geral', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { id: 'orders', label: 'Ordens de Serviço', sub: 'OS Ativas', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  )},
  { id: 'quotes', label: 'Orçamentos', sub: 'Propostas', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )},
  { id: 'clients', label: 'Clientes', sub: 'Base de Clientes', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )},
  { id: 'settings', label: 'Cadastros Rápidos', sub: 'Serviços & Status', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/>
    </svg>
  )},
] as const

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <aside className="flex flex-col h-screen border-r flex-shrink-0" style={{ width: 232, background: '#111111', borderColor: '#1e1e1e' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: '#1e1e1e' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: '#2563EB' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#e5e5e5' }}>AndradeTech</div>
            <div className="text-xs font-mono" style={{ color: '#444' }}>Assistência Técnica</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-xs font-mono uppercase tracking-widest px-3 mb-3" style={{ color: '#333' }}>Menu</div>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group"
              style={{
                background: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#fff' : '#666',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#181818'; if (!isActive) e.currentTarget.style.color = '#ccc' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; if (!isActive) e.currentTarget.style.color = '#666' }}
            >
              <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs truncate" style={{ color: isActive ? 'rgba(255,255,255,0.5)' : '#444' }}>{item.sub}</div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t" style={{ borderColor: '#1e1e1e' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = '#181818')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#2a2a2a', color: '#888' }}>
            AT
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#ccc' }}>Admin Técnico</div>
            <div className="text-xs truncate font-mono" style={{ color: '#444' }}>admin@osmanager.app</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#333', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
      </div>
    </aside>
  )
}

// ─── Topbar compartilhado ─────────────────────────────────────────────────────

function Topbar({ section, title, onNewOrder, onNewClient, children }: {
  section: string; title: string; onNewOrder?: () => void; onNewClient?: () => void; children?: React.ReactNode
}) {
  return (
    <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
      <div className="flex-1 flex items-center gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: '#444' }}>{section}</div>
          <div className="text-sm font-bold" style={{ color: '#e5e5e5' }}>{title}</div>
        </div>
        {children}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onNewClient && (
          <button onClick={onNewClient}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 border"
            style={{ background: 'transparent', borderColor: '#2a2a2a', color: '#888' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Novo Cliente
          </button>
        )}
        {onNewOrder && (
          <button onClick={onNewOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#2563EB' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Nova OS
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tela: Painel ────────────────────────────────────────────────────────────

function DashboardScreen({ onNewOrder }: { onNewOrder: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar section="PAINEL" title="Visão Geral" onNewOrder={onNewOrder}>
        <div className="relative ml-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#444' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Buscar OS, cliente, aparelho..." className="rounded-lg pl-9 pr-4 py-2 text-sm border outline-none" style={{ background: '#111', borderColor: '#222', color: '#ccc', width: 260 }} />
        </div>
        <select className="rounded-lg px-3 py-2 text-sm border outline-none" style={{ background: '#111', borderColor: '#222', color: '#888' }}>
          <option>Setembro 2026</option>
          <option>Agosto 2026</option>
          <option>Julho 2026</option>
        </select>
      </Topbar>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total em Aberto',         value: '0', sub: 'nenhuma OS ativa',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Concluídos (mês)',         value: '0', sub: 'nenhum este mês',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
            { label: 'Orçamentos Pendentes',     value: '0', sub: 'nenhum em análise',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { label: 'Faturamento Previsto',     value: 'R$ 0,00', sub: 'sem serviços aprovados', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-4 border" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#444' }}>{kpi.label}</span>
                <span style={{ color: '#333' }}>{kpi.icon}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: '#e5e5e5' }}>{kpi.value}</div>
              <div className="text-xs mt-1 font-mono" style={{ color: '#444' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabela OS recentes */}
        <div className="rounded-xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#1a1a1a' }}>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest mr-3" style={{ color: '#444' }}>Recentes</span>
              <span className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Últimas Ordens de Serviço</span>
            </div>
            <span className="text-xs font-mono" style={{ color: '#444' }}>0 registros</span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0d0d0d' }}>
                {['ID','Cliente','Aparelho / Serviço','Status','Valor','Data','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: '#444' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDERS.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
                      title="Nenhuma ordem de serviço cadastrada"
                      sub="Clique em '+ Nova OS' para começar"
                    />
                  </td>
                </tr>
              )}
              {ORDERS.map(order => (
                <tr key={order.id} className="border-t" style={{ borderColor: '#1a1a1a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#141414')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#2563EB' }}>{order.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: '#ccc' }}>{order.client}</div>
                    <div className="text-xs font-mono" style={{ color: '#444' }}>{order.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm" style={{ color: '#aaa' }}>{order.device}</div>
                    <div className="text-xs" style={{ color: '#555' }}>{order.service}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: order.value > 0 ? '#e5e5e5' : '#444' }}>
                    {order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: '#555' }}>{order.date}</td>
                  <td className="px-4 py-3"><WhatsAppBtn phone={order.phone} label={`OS ${order.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ações rápidas */}
        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#444' }}>Ações Rápidas</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Novo Orçamento',    sub: 'Criar proposta de serviço',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
              { label: 'Cadastrar Cliente', sub: 'Registrar novo cliente',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
              { label: 'Atualizar Status',  sub: 'Alterar status de OS ativa',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> },
            ].map(a => (
              <button key={a.label} className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                style={{ background: '#111111', borderColor: '#1e1e1e' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}>
                <span style={{ color: '#444' }}>{a.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#ccc' }}>{a.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#444' }}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tela: Ordens de Serviço ──────────────────────────────────────────────────

function OrdersScreen({ onNewOrder }: { onNewOrder: () => void }) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('Todos')
  const statuses: OrderStatus[] = ['Entrada', 'Em Análise', 'Aguardando Peça', 'Concluído', 'Entregue', 'Cancelado']
  const filtered = filterStatus === 'Todos' ? ORDERS : ORDERS.filter(o => o.status === filterStatus)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar section="GESTÃO" title="Ordens de Serviço" onNewOrder={onNewOrder}>
        <div className="flex items-center gap-1.5 rounded-lg border p-1 ml-4" style={{ borderColor: '#222', background: '#111' }}>
          {(['list','kanban'] as const).map((v, i) => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ background: view === v ? '#2563EB' : 'transparent', color: view === v ? '#fff' : '#555' }}>
              {i === 0 ? 'Lista' : 'Quadro'}
            </button>
          ))}
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Filtros de status */}
        <div className="flex items-center gap-2 flex-wrap">
          {['Todos', ...statuses].map(s => {
            const isActive = filterStatus === s
            const cfg = s !== 'Todos' ? ORDER_STATUS_CONFIG[s as OrderStatus] : null
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border"
                style={{
                  background: isActive && cfg ? cfg.bg : isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
                  color: isActive && cfg ? cfg.text : isActive ? '#2563EB' : '#555',
                  borderColor: isActive ? (cfg?.dot ?? '#2563EB') + '44' : '#1e1e1e',
                }}>
                {s}
                <span className="ml-1.5 opacity-50">{s === 'Todos' ? ORDERS.length : ORDERS.filter(o => o.status === s).length}</span>
              </button>
            )
          })}
        </div>

        {view === 'list' ? (
          <div className="rounded-xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0d0d0d' }}>
                  {['ID','Cliente','Aparelho','Serviço','Técnico','Status','Valor','Data','Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: '#444' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9}>
                    <EmptyState
                      icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
                      title="Nenhuma ordem encontrada"
                      sub="Crie uma nova OS para começar"
                    />
                  </td></tr>
                )}
                {filtered.map(order => (
                  <tr key={order.id} className="border-t" style={{ borderColor: '#1a1a1a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#141414')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#2563EB' }}>{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: '#ccc' }}>{order.client}</div>
                      <div className="text-xs font-mono" style={{ color: '#444' }}>{order.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#aaa' }}>{order.device}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#777' }}>{order.service}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#555' }}>{order.technician}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>{order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#555' }}>{order.date}</td>
                    <td className="px-4 py-3"><WhatsAppBtn phone={order.phone} label={`OS ${order.id}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {statuses.map(col => {
              const colOrders = ORDERS.filter(o => o.status === col)
              const cfg = ORDER_STATUS_CONFIG[col]
              return (
                <div key={col} className="flex-shrink-0 w-56 rounded-xl border" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                      <span className="text-xs font-mono font-semibold" style={{ color: cfg.text }}>{col}</span>
                    </div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#555' }}>{colOrders.length}</span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[80px]">
                    {colOrders.length === 0 && (
                      <div className="text-center py-8 text-xs font-mono" style={{ color: '#2a2a2a' }}>vazio</div>
                    )}
                    {colOrders.map(order => (
                      <div key={order.id} className="p-3 rounded-lg border cursor-pointer transition-all" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}>
                        <div className="flex justify-between mb-1.5">
                          <span className="font-mono text-xs" style={{ color: '#2563EB' }}>{order.id}</span>
                          <span className="text-xs font-mono" style={{ color: '#444' }}>{order.date}</span>
                        </div>
                        <div className="text-sm font-medium mb-0.5" style={{ color: '#ccc' }}>{order.client}</div>
                        <div className="text-xs mb-0.5" style={{ color: '#666' }}>{order.device}</div>
                        <div className="text-xs mb-3" style={{ color: '#444' }}>{order.service}</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold" style={{ color: '#e5e5e5' }}>{order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}</span>
                          <WhatsAppBtn phone={order.phone} />
                        </div>
                      </div>
                    ))}
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

function QuotesScreen() {
  const [selected, setSelected] = useState<Quote | null>(QUOTES[0] ?? null)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar section="GESTÃO" title="Orçamentos & Propostas">
        <div className="ml-4" />
      </Topbar>

      <div className="flex flex-1 overflow-hidden">
        {/* Tabela */}
        <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: '#1a1a1a' }}>
          <table className="w-full">
            <thead className="sticky top-0" style={{ background: '#0a0a0a' }}>
              <tr>
                {['ID','Cliente','Descrição','Valor','Validade','Status',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider" style={{ color: '#444' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUOTES.length === 0 && (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                    title="Nenhum orçamento cadastrado"
                    sub="Crie um novo orçamento para começar"
                  />
                </td></tr>
              )}
              {QUOTES.map(q => (
                <tr key={q.id} onClick={() => setSelected(q)}
                  className="border-t cursor-pointer"
                  style={{ borderColor: '#1a1a1a', background: selected?.id === q.id ? '#141414' : 'transparent' }}
                  onMouseEnter={e => { if (selected?.id !== q.id) e.currentTarget.style.background = '#111' }}
                  onMouseLeave={e => { if (selected?.id !== q.id) e.currentTarget.style.background = 'transparent' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#2563EB' }}>{q.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: '#ccc' }}>{q.client}</div>
                    <div className="text-xs font-mono" style={{ color: '#444' }}>{q.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: '#777' }}>{q.description}</td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>R$ {q.value.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono" style={{ color: '#888' }}>{q.validUntil}</div>
                    <div className="text-xs" style={{ color: '#444' }}>válido até</div>
                  </td>
                  <td className="px-4 py-3"><QuoteStatusBadge status={q.status} /></td>
                  <td className="px-4 py-3"><WhatsAppBtn phone={q.phone} label={`Orçamento ${q.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Painel de detalhe */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l" style={{ background: '#0e0e0e', borderColor: '#1a1a1a' }}>
          {selected ? (
            <>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#1a1a1a' }}>
                <div className="text-xs font-mono mb-1" style={{ color: '#444' }}>DETALHES</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold" style={{ color: '#2563EB' }}>{selected.id}</span>
                  <QuoteStatusBadge status={selected.status} />
                </div>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: '#444' }}>Cliente</div>
                  <div className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>{selected.client}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: '#555' }}>{selected.phone}</div>
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: '#444' }}>Serviço</div>
                  <div className="text-sm" style={{ color: '#aaa' }}>{selected.description}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ l: 'Criado em', v: selected.createdAt, c: '#888' }, { l: 'Válido até', v: selected.validUntil, c: selected.status === 'Expirado' ? '#555' : '#aaa' }].map(i => (
                    <div key={i.l} className="rounded-lg p-3" style={{ background: '#141414' }}>
                      <div className="text-xs font-mono mb-1" style={{ color: '#444' }}>{i.l}</div>
                      <div className="text-xs font-mono" style={{ color: i.c }}>{i.v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: '#444' }}>Itens</div>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#1e1e1e' }}>
                    {selected.items.map((item, i) => (
                      <div key={i} className={`flex items-start justify-between px-3 py-2.5 ${i > 0 ? 'border-t' : ''}`} style={{ borderColor: '#1a1a1a' }}>
                        <div className="flex-1 pr-2">
                          <div className="text-xs" style={{ color: '#ccc' }}>{item.desc}</div>
                          <div className="text-xs font-mono mt-0.5" style={{ color: '#444' }}>{item.qty}× R$ {item.unit.toFixed(2)}</div>
                        </div>
                        <div className="text-xs font-mono font-semibold flex-shrink-0" style={{ color: '#aaa' }}>R$ {(item.qty * item.unit).toFixed(2)}</div>
                      </div>
                    ))}
                    <div className="border-t px-3 py-2.5 flex justify-between items-center" style={{ borderColor: '#2a2a2a', background: '#0a0a0a' }}>
                      <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#555' }}>Total</span>
                      <span className="font-mono font-bold text-sm" style={{ color: '#e5e5e5' }}>R$ {selected.value.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <WhatsAppBtn phone={selected.phone} label={`Orçamento ${selected.id} — R$ ${selected.value.toFixed(2)}`} />
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all" style={{ borderColor: '#2a2a2a', color: '#666' }}>Editar</button>
                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90" style={{ background: '#2563EB' }}>Converter em OS</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              title="Selecione um orçamento"
              sub="Clique em uma linha para ver os detalhes"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tela: Clientes ───────────────────────────────────────────────────────────

function ClientsScreen({ onNewClient }: { onNewClient: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar section="GESTÃO" title="Base de Clientes" onNewClient={onNewClient}>
        <div className="relative ml-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#444' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
            className="rounded-lg pl-9 pr-4 py-2 text-sm border outline-none" style={{ background: '#111', borderColor: '#222', color: '#ccc', width: 220 }} />
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="rounded-xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0d0d0d' }}>
                {['ID','Nome','Contato','Dispositivos','Total OS','Gasto Total','Último Serviço','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: '#444' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <EmptyState
                    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
                    title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    sub={search ? 'Tente outro termo de busca' : "Clique em '+ Novo Cliente' para começar"}
                  />
                </td></tr>
              )}
              {filtered.map(client => {
                const initials = client.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                return (
                  <tr key={client.id} className="border-t" style={{ borderColor: '#1a1a1a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#141414')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#444' }}>{client.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1e1e1e', color: '#888' }}>{initials}</div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: '#ccc' }}>{client.name}</div>
                          <div className="text-xs" style={{ color: '#444' }}>{client.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono" style={{ color: '#888' }}>{client.phone}</div>
                      <div className="text-xs font-mono" style={{ color: '#444' }}>{client.cpf}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {client.devices.map(d => (
                          <span key={d} className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: '#1a1a1a', color: '#666' }}>{d}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-bold" style={{ color: '#aaa' }}>{client.totalOrders}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>R$ {client.totalSpent.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#555' }}>{client.lastService}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded transition-colors" style={{ color: '#444' }} title="Ver histórico do cliente"
                          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <WhatsAppBtn phone={client.phone} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="mt-3 flex items-center gap-5">
            <span className="text-xs font-mono" style={{ color: '#444' }}>{filtered.length} clientes</span>
            <span className="text-xs font-mono" style={{ color: '#444' }}>Total gasto: <span style={{ color: '#888' }}>R$ {filtered.reduce((s, c) => s + c.totalSpent, 0).toLocaleString('pt-BR')}</span></span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tela: Cadastros Rápidos ──────────────────────────────────────────────────

function SettingsScreen() {
  const services = [
    { name: 'Troca de Tela',       default_price: 350, category: 'Hardware' },
    { name: 'Reparo de Bateria',    default_price: 180, category: 'Hardware' },
    { name: 'Formatação + SO',      default_price: 200, category: 'Software' },
    { name: 'Limpeza Interna',      default_price: 90,  category: 'Manutenção' },
    { name: 'Troca de Conector',    default_price: 150, category: 'Hardware' },
    { name: 'Diagnóstico',          default_price: 0,   category: 'Diagnóstico' },
  ]

  const statusList: { label: OrderStatus }[] = [
    { label: 'Entrada' }, { label: 'Em Análise' }, { label: 'Aguardando Peça' },
    { label: 'Concluído' }, { label: 'Entregue' }, { label: 'Cancelado' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar section="CONFIGURAÇÃO" title="Cadastros Rápidos" />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-2 gap-5">
          {/* Serviços */}
          <div className="rounded-xl border" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: '#444' }}>CATÁLOGO</div>
                <div className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Serviços Cadastrados</div>
              </div>
              <button className="text-xs font-medium transition-colors" style={{ color: '#2563EB' }}>+ Adicionar</button>
            </div>
            {services.map((svc, i) => (
              <div key={svc.name} className={`flex items-center px-5 py-3.5 ${i > 0 ? 'border-t' : ''}`} style={{ borderColor: '#1a1a1a' }}>
                <div className="flex-1">
                  <div className="text-sm" style={{ color: '#ccc' }}>{svc.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: '#444' }}>{svc.category}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm" style={{ color: '#888' }}>
                    {svc.default_price > 0 ? `R$ ${svc.default_price},00` : 'Sob consulta'}
                  </span>
                  <button className="p-1.5 rounded transition-colors" style={{ color: '#333' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#333')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="rounded-xl border" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a1a' }}>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: '#444' }}>FLUXO</div>
                <div className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Status de OS</div>
              </div>
              <button className="text-xs font-medium transition-colors" style={{ color: '#2563EB' }}>+ Novo Status</button>
            </div>
            {statusList.map((s, i) => {
              const cfg = ORDER_STATUS_CONFIG[s.label]
              return (
                <div key={s.label} className={`flex items-center px-5 py-3.5 ${i > 0 ? 'border-t' : ''}`} style={{ borderColor: '#1a1a1a' }}>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                    <div className="text-sm" style={{ color: '#ccc' }}>{s.label}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium" style={{ color: cfg.text, background: cfg.bg }}>{s.label}</span>
                    <button className="p-1.5 rounded transition-colors" style={{ color: '#333' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#333')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Info do sistema */}
          <div className="col-span-2 rounded-xl border p-5" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#444' }}>Informações do Sistema</div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Versão', value: 'AndradeTech v2.4.1' },
                { label: 'Técnicos Cadastrados', value: '0 ativos' },
                { label: 'Banco de Dados', value: 'SQLite Local' },
                { label: 'Última Sincronização', value: '—' },
              ].map(info => (
                <div key={info.label} className="rounded-lg p-3" style={{ background: '#0a0a0a' }}>
                  <div className="text-xs font-mono mb-1" style={{ color: '#444' }}>{info.label}</div>
                  <div className="text-sm font-medium font-mono" style={{ color: '#888' }}>{info.value}</div>
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
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar active={screen} onNavigate={setScreen} />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0a0a' }}>
        {screen === 'dashboard' && <DashboardScreen onNewOrder={() => setShowNewOrder(true)} />}
        {screen === 'orders'    && <OrdersScreen onNewOrder={() => setShowNewOrder(true)} />}
        {screen === 'quotes'    && <QuotesScreen />}
        {screen === 'clients'   && <ClientsScreen onNewClient={() => setShowNewClient(true)} />}
        {screen === 'settings'  && <SettingsScreen />}
      </main>

      {showNewOrder  && <NewOrderModal  onClose={() => setShowNewOrder(false)} />}
      {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} />}
    </div>
  )
}
