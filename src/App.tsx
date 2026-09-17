import React, { useState, useEffect } from 'react'

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
  description: string
  value: number
  validUntil: string
  createdAt: string
  status: 'Pendente' | 'Aprovado' | 'Expirado' | 'Cancelado'
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

// ─── Configurações Padrão ─────────────────────────────────────────────────────

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

// ─── Utilitários ──────────────────────────────────────────────────────────────

function StatusBadge({ status, statuses }: { status: string; statuses: CustomStatus[] }) {
  const current = statuses.find(s => s.label.toLowerCase() === status.toLowerCase()) || {
    label: status,
    dot: '#888888',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium whitespace-nowrap"
      style={{
        color: current.dot,
        background: `${current.dot}18`,
        border: `1px solid ${current.dot}33`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: current.dot }} />
      {current.label}
    </span>
  )
}

function WhatsAppBtn({ phone, label = '', orderDetails }: { phone: string; label?: string; orderDetails?: Partial<Order> }) {
  let msg = `Olá! Passando para informar sobre seu serviço na AndradeTech.`
  if (orderDetails) {
    msg = `*AndradeTech - Atualização de OS*\n\n` +
          `Olá, *${orderDetails.client || 'Cliente'}*!\n` +
          `*OS:* #${orderDetails.id || '---'}\n` +
          `*Aparelho:* ${orderDetails.device || 'N/A'}\n` +
          `*Serviço:* ${orderDetails.service || 'Em diagnóstico'}\n` +
          `*Situação Atual:* ${orderDetails.status || 'Em andamento'}\n` +
          (orderDetails.value ? `*Valor:* R$ ${orderDetails.value.toFixed(2)}\n\n` : '\n') +
          `Qualquer dúvida estamos à disposição!`
  } else if (label) {
    msg = `Olá! Referente a: ${label}.`
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
          alert('Telefone do cliente não cadastrado!')
        }
      }}
      title="Enviar mensagem no WhatsApp"
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0 cursor-pointer"
      style={{ background: '#25D366' }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span className="hidden sm:inline">{label || 'WhatsApp'}</span>
    </a>
  )
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-3 opacity-20">{icon}</div>
      <div className="text-sm font-medium mb-1 text-neutral-400">{title}</div>
      <div className="text-xs text-neutral-600">{sub}</div>
    </div>
  )
}

// ─── Modal: Ordem de Serviço (Criar & Editar) ─────────────────────────────────

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
      alert('Preencha o nome do cliente e o aparelho!')
      return
    }

    const firstService = items[0]?.desc?.trim() || 'Serviço Geral'
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
      const msg = `*AndradeTech - Informações da Ordem #${savedOrder.id}*\n\n` +
                  `Olá, *${client}*!\n` +
                  `*Aparelho:* ${device}\n` +
                  `*Serviço:* ${firstService}\n` +
                  `*Situação Atual:* ${status}\n` +
                  `*Valor Total:* R$ ${total.toFixed(2)}\n\n` +
                  `Estamos à disposição!`
      window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 overflow-y-auto">
      <form onSubmit={(e) => handleSave(e, false)} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-[#111] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
          <div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase">
              {orderToEdit ? `EDITANDO ${orderToEdit.id}` : 'NOVO REGISTRO'}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-100">
              {orderToEdit ? 'Editar Ordem de Serviço' : 'Registrar Ordem de Serviço'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Cliente *</label>
              <input
                list="client-options"
                value={client}
                onChange={e => handleClientChange(e.target.value)}
                placeholder="Nome do cliente..."
                className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none"
              />
              <datalist id="client-options">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">WhatsApp / Tel</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Aparelho *</label>
              <input
                value={device}
                onChange={e => setDevice(e.target.value)}
                placeholder="Ex: Notebook Lenovo, Galaxy S21..."
                className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Situação</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none"
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Técnico Responsável</label>
            <input
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Diagnóstico / Defeito</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Relato do cliente ou laudo inicial..."
              className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none resize-none"
            />
          </div>

          {/* Itens e Peças */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Serviços / Peças</label>
              <button
                type="button"
                onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="rounded-lg border border-neutral-800 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/60 text-neutral-500">
                    <th className="px-3 py-2 text-left font-mono uppercase">Item / Serviço</th>
                    <th className="px-2 py-2 text-center w-12 font-mono uppercase">Qtd</th>
                    <th className="px-2 py-2 text-right w-20 font-mono uppercase">Unit</th>
                    <th className="px-2 py-2 text-right w-20 font-mono uppercase">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-neutral-800">
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col sm:flex-row gap-1">
                          <input
                            value={item.desc}
                            onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                            placeholder="Descrição..."
                            className="w-full bg-transparent outline-none text-neutral-200"
                          />
                          {services.length > 0 && (
                            <select
                              onChange={e => {
                                if (e.target.value) handleApplyServicePreset(e.target.value, i)
                              }}
                              className="text-[10px] rounded bg-[#222] border border-neutral-700 text-neutral-400 outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Predefinições</option>
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
                          className="w-full bg-transparent text-center outline-none font-mono text-neutral-200"
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
                          className="w-full bg-transparent text-right outline-none font-mono text-neutral-200"
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
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-700 bg-black/40">
                    <td colSpan={3} className="px-3 py-2 text-right font-mono text-neutral-500 uppercase">Total:</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-white">R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-xs text-neutral-500 hover:text-white">
            Cancelar
          </button>
          <div className="flex w-full sm:w-auto gap-2">
            <button type="submit" className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500">
              Salvar
            </button>
            <button type="button" onClick={(e) => handleSave(e, true)} className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-500">
              Salvar & Whats
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Modal: Novo Cliente ──────────────────────────────────────────────────────

function NewClientModal({ onClose, onSave }: { onClose: () => void; onSave: (client: Client) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Nome do cliente é obrigatório')

    onSave({
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name,
      phone,
      cpf,
      address,
      city: city || 'Local',
      totalOrders: 0,
      totalSpent: 0,
      lastService: 'Novo cadastro',
      devices: [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85">
      <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
          <div>
            <div className="text-[10px] font-mono text-neutral-500">CADASTRO</div>
            <h2 className="text-base font-bold text-neutral-100">Novo Cliente</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-500 hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Nome Completo *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Rafael Mendonça" className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Telefone / WhatsApp *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(DDD) 99999-9999" className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">CPF / CNPJ</label>
              <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Endereço</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro..." className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-mono mb-1 uppercase tracking-wider text-neutral-500">Cidade / Estado</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Eunápolis, BA" className="w-full rounded-lg px-3 py-2 text-sm border border-neutral-800 bg-[#181818] text-white outline-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-neutral-800 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-neutral-500 hover:text-white">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500">
            Salvar Cliente
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Navegação Mobile & Desktop ───────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { id: 'orders', label: 'Ordens', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
  )},
  { id: 'quotes', label: 'Orçamentos', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  )},
  { id: 'clients', label: 'Clientes', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  )} as any,
  { id: 'settings', label: 'Ajustes', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2"/></svg>
  )},
] as const

function Topbar({
  title,
  onOpenMobileMenu,
  onNewOrder,
  onNewClient,
  children,
}: {
  title: string
  onOpenMobileMenu: () => void
  onNewOrder?: () => void
  onNewClient?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-neutral-900 bg-[#0a0a0a]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="truncate">
          <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-neutral-500">AndradeTech</div>
          <div className="text-xs sm:text-sm font-bold text-white truncate">{title}</div>
        </div>
        {children}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onNewClient && (
          <button
            onClick={onNewClient}
            title="Cadastrar novo cliente"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-neutral-800 bg-[#141414] text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            <span className="text-[11px] sm:text-xs">Cliente</span>
          </button>
        )}
        {onNewOrder && (
          <button
            onClick={onNewOrder}
            title="Cadastrar nova OS"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
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
  onNewClient,
  onEditOrder,
  onOpenMenu,
}: {
  orders: Order[]
  quotes: Quote[]
  statuses: CustomStatus[]
  onNewOrder: () => void
  onNewClient: () => void
  onEditOrder: (order: Order) => void
  onOpenMenu: () => void
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Visão Geral" onOpenMobileMenu={onOpenMenu} onNewOrder={onNewOrder} onNewClient={onNewClient} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar por OS, cliente, aparelho..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-neutral-800 bg-[#111] text-white outline-none"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            { label: 'Em Aberto', value: openOrders.toString(), sub: 'serviços ativos', color: 'text-blue-500' },
            { label: 'Concluídos', value: completedOrders.toString(), sub: 'finalizados', color: 'text-green-500' },
            { label: 'Orçamentos', value: pendingQuotes.toString(), sub: 'pendentes', color: 'text-amber-500' },
            { label: 'Previsto', value: `R$ ${totalRevenue.toFixed(0)}`, sub: 'total acumulado', color: 'text-neutral-100' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-3 sm:p-4 border border-neutral-900 bg-[#111]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">{kpi.label}</span>
              <div className={`text-lg sm:text-2xl font-bold tracking-tight mt-1 ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[10px] sm:text-xs font-mono text-neutral-600 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-900 bg-[#111] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900">
            <span className="text-xs font-semibold text-neutral-200">Ordens de Serviço Recentes</span>
            <span className="text-[11px] font-mono text-neutral-500">{orders.length} cadastradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead>
                <tr className="bg-[#0c0c0c] text-neutral-500 border-b border-neutral-900 text-left">
                  <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cliente / Contato</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Aparelho</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Situação</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                  <th className="px-3 py-2.5 font-mono uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
                        title="Nenhuma ordem recente"
                        sub="Toque em '+ Nova OS' para registrar"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 10).map(order => (
                    <tr key={order.id} className="hover:bg-neutral-900/50">
                      <td className="px-3 py-2.5 font-mono text-blue-500 font-bold">{order.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-neutral-200">{order.client}</div>
                        <div className="text-[10px] font-mono text-neutral-500">{order.phone || 'Sem telefone'}</div>
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
                            className="p-1 rounded text-neutral-400 hover:text-white"
                            title="Editar OS"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

// ─── Tela: Ordens de Serviço (Modo Lista / Kanban) ────────────────────────────

function OrdersScreen({
  orders,
  statuses,
  onNewOrder,
  onEditOrder,
  onUpdateStatus,
  onDeleteOrder,
  onOpenMenu,
}: {
  orders: Order[]
  statuses: CustomStatus[]
  onNewOrder: () => void
  onEditOrder: (order: Order) => void
  onUpdateStatus: (id: string, status: string) => void
  onDeleteOrder: (id: string) => void
  onOpenMenu: () => void
}) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('Todos')

  const filtered = filterStatus === 'Todos' ? orders : orders.filter(o => o.status === filterStatus)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Ordens de Serviço" onOpenMobileMenu={onOpenMenu} onNewOrder={onNewOrder}>
        <div className="flex items-center gap-1 rounded-lg border border-neutral-800 p-0.5 bg-[#111] ml-2">
          {(['list','kanban'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-2 py-1 rounded text-[11px] font-medium"
              style={{ background: view === v ? '#2563EB' : 'transparent', color: view === v ? '#fff' : '#666' }}
            >
              {v === 'list' ? 'Lista' : 'Quadro'}
            </button>
          ))}
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['Todos', ...statuses.map(s => s.label)].map(s => {
            const isActive = filterStatus === s
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap border"
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
          <div className="rounded-xl border border-neutral-900 bg-[#111] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-[#0c0c0c] text-neutral-500 border-b border-neutral-900 text-left">
                    <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Cliente</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Aparelho</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Situação</th>
                    <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                    <th className="px-3 py-2.5 font-mono uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
                          title="Nenhuma ordem encontrada"
                          sub="Crie uma nova OS ou mude o filtro"
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-900/50">
                        <td className="px-3 py-2.5 font-mono text-blue-500 font-bold">{order.id}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-neutral-200">{order.client}</div>
                          <div className="text-[10px] font-mono text-neutral-500">{order.phone || '—'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-neutral-400">{order.device}</td>
                        <td className="px-3 py-2.5">
                          <select
                            value={order.status}
                            onChange={e => onUpdateStatus(order.id, e.target.value)}
                            className="bg-transparent text-xs font-mono outline-none border border-neutral-800 rounded px-1.5 py-0.5 text-neutral-300"
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
                              className="p-1 rounded text-neutral-400 hover:text-white"
                              title="Editar OS"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <WhatsAppBtn phone={order.phone} orderDetails={order} />
                            <button
                              onClick={() => { if(confirm(`Excluir ${order.id}?`)) onDeleteOrder(order.id) }}
                              className="p-1 rounded text-neutral-500 hover:text-red-400"
                              title="Excluir OS"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
                <div key={st.id} className="flex-shrink-0 w-64 rounded-xl border border-neutral-900 bg-[#111] flex flex-col">
                  <div className="px-3.5 py-2.5 border-b border-neutral-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                      <span className="text-xs font-mono font-semibold" style={{ color: st.dot }}>{st.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500">{colOrders.length}</span>
                  </div>
                  <div className="p-2 space-y-2 flex-1 min-h-[140px]">
                    {colOrders.length === 0 ? (
                      <div className="text-center py-8 text-xs font-mono text-neutral-700">vazio</div>
                    ) : (
                      colOrders.map(order => (
                        <div key={order.id} className="p-3 rounded-lg border border-neutral-800 bg-[#0d0d0d] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-blue-500">{order.id}</span>
                            <span className="text-[10px] font-mono text-neutral-500">{order.date}</span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-200">{order.client}</div>
                          <div className="text-[11px] text-neutral-400">{order.device}</div>
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                            <span className="font-mono text-xs text-white">R$ {order.value.toFixed(2)}</span>
                            <div className="flex gap-1">
                              <button onClick={() => onEditOrder(order)} className="p-1 text-neutral-400 hover:text-white">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

function QuotesScreen({ quotes, onOpenMenu }: { quotes: Quote[]; onOpenMenu: () => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Orçamentos & Propostas" onOpenMobileMenu={onOpenMenu} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="rounded-xl border border-neutral-900 bg-[#111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-xs">
              <thead>
                <tr className="bg-[#0c0c0c] text-neutral-500 border-b border-neutral-900 text-left">
                  <th className="px-3 py-2.5 font-mono uppercase">ID</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cliente</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Descrição</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Valor</th>
                  <th className="px-3 py-2.5 font-mono uppercase text-right">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>}
                        title="Nenhum orçamento cadastrado"
                        sub="Propostas criadas aparecerão aqui"
                      />
                    </td>
                  </tr>
                ) : (
                  quotes.map(q => (
                    <tr key={q.id} className="hover:bg-neutral-900/50">
                      <td className="px-3 py-2.5 font-mono text-blue-500">{q.id}</td>
                      <td className="px-3 py-2.5 font-semibold text-neutral-200">{q.client}</td>
                      <td className="px-3 py-2.5 text-neutral-400 truncate max-w-xs">{q.description}</td>
                      <td className="px-3 py-2.5 font-mono text-white">R$ {q.value.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right"><WhatsAppBtn phone={q.phone} label={`Orçamento ${q.id}`} /></td>
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

function ClientsScreen({ clients, onNewClient, onOpenMenu }: { clients: Client[]; onNewClient: () => void; onOpenMenu: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Base de Clientes" onOpenMobileMenu={onOpenMenu} onNewClient={onNewClient} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {/* Barra de pesquisa + botão de Novo Cliente garantido no Mobile */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente ou tel..."
              className="w-full rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm border border-neutral-800 bg-[#111] text-white outline-none"
            />
          </div>
          <button
            onClick={onNewClient}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span>+ Cliente</span>
          </button>
        </div>

        <div className="rounded-xl border border-neutral-900 bg-[#111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead>
                <tr className="bg-[#0c0c0c] text-neutral-500 border-b border-neutral-900 text-left">
                  <th className="px-3 py-2.5 font-mono uppercase">Nome</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Telefone</th>
                  <th className="px-3 py-2.5 font-mono uppercase">Cidade</th>
                  <th className="px-3 py-2.5 font-mono uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
                        title="Nenhum cliente cadastrado"
                        sub="Toque em '+ Cliente' para adicionar"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-900/50">
                      <td className="px-3 py-2.5 font-semibold text-neutral-200">{c.name}</td>
                      <td className="px-3 py-2.5 font-mono text-neutral-400">{c.phone || 'Sem número'}</td>
                      <td className="px-3 py-2.5 text-neutral-500">{c.city}</td>
                      <td className="px-3 py-2.5 text-right"><WhatsAppBtn phone={c.phone} label={`Olá ${c.name}!`} /></td>
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
}: {
  services: CustomService[]
  statuses: CustomStatus[]
  onAddService: (svc: CustomService) => void
  onDeleteService: (id: string) => void
  onAddStatus: (st: CustomStatus) => void
  onDeleteStatus: (id: string) => void
  onOpenMenu: () => void
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Configurações & Catálogo" onOpenMobileMenu={onOpenMenu} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Serviços */}
          <div className="rounded-xl border border-neutral-900 bg-[#111] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-900 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">Serviços Cadastrados</span>
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-400"
              >
                {showAddService ? 'Fechar' : '+ Novo Serviço'}
              </button>
            </div>

            {showAddService && (
              <form onSubmit={handleCreateService} className="p-3 border-b border-neutral-900 bg-black/40 space-y-2">
                <input
                  required
                  placeholder="Nome do serviço..."
                  value={newSvcName}
                  onChange={e => setNewSvcName(e.target.value)}
                  className="w-full rounded px-2.5 py-1.5 text-xs bg-[#181818] border border-neutral-800 text-white outline-none"
                />
                <input
                  type="number"
                  placeholder="Preço padrão (R$)"
                  value={newSvcPrice}
                  onChange={e => setNewSvcPrice(e.target.value)}
                  className="w-full rounded px-2.5 py-1.5 text-xs bg-[#181818] border border-neutral-800 text-white outline-none"
                />
                <button type="submit" className="w-full py-1.5 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-500">
                  Adicionar
                </button>
              </form>
            )}

            <div className="divide-y divide-neutral-900 max-h-72 overflow-y-auto">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div>
                    <div className="text-neutral-200 font-medium">{s.name}</div>
                    <div className="font-mono text-neutral-500">R$ {s.default_price.toFixed(2)}</div>
                  </div>
                  <button onClick={() => onDeleteService(s.id)} className="text-neutral-600 hover:text-red-400">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card Situações / Status */}
          <div className="rounded-xl border border-neutral-900 bg-[#111] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-900 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200">Situações de OS</span>
              <button
                onClick={() => setShowAddStatus(!showAddStatus)}
                className="text-[11px] font-semibold text-blue-500 hover:text-blue-400"
              >
                {showAddStatus ? 'Fechar' : '+ Nova Situação'}
              </button>
            </div>

            {showAddStatus && (
              <form onSubmit={handleCreateStatus} className="p-3 border-b border-neutral-900 bg-black/40 space-y-2">
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="Ex: Em Garantia, Retorno..."
                    value={newStatusLabel}
                    onChange={e => setNewStatusLabel(e.target.value)}
                    className="flex-1 rounded px-2.5 py-1.5 text-xs bg-[#181818] border border-neutral-800 text-white outline-none"
                  />
                  <input
                    type="color"
                    value={newStatusColor}
                    onChange={e => setNewStatusColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>
                <button type="submit" className="w-full py-1.5 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-500">
                  Adicionar Situação
                </button>
              </form>
            )}

            <div className="divide-y divide-neutral-900 max-h-72 overflow-y-auto">
              {statuses.map(st => (
                <div key={st.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                    <span className="text-neutral-200">{st.label}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (statuses.length <= 1) return alert('Mantenha pelo menos um status!')
                      onDeleteStatus(st.id)
                    }}
                    className="text-neutral-600 hover:text-red-400"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('andrade_clients')
    return saved ? JSON.parse(saved) : []
  })

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('andrade_orders')
    return saved ? JSON.parse(saved) : []
  })

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('andrade_quotes')
    return saved ? JSON.parse(saved) : []
  })

  const [services, setServices] = useState<CustomService[]>(() => {
    const saved = localStorage.getItem('andrade_services')
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES
  })

  const [statuses, setStatuses] = useState<CustomStatus[]>(() => {
    const saved = localStorage.getItem('andrade_statuses')
    return saved ? JSON.parse(saved) : DEFAULT_STATUSES
  })

  useEffect(() => {
    localStorage.setItem('andrade_clients', JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    localStorage.setItem('andrade_orders', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem('andrade_quotes', JSON.stringify(quotes))
  }, [quotes])

  useEffect(() => {
    localStorage.setItem('andrade_services', JSON.stringify(services))
  }, [services])

  useEffect(() => {
    localStorage.setItem('andrade_statuses', JSON.stringify(statuses))
  }, [statuses])

  const handleSaveClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev])
  }

  const handleSaveOrder = (orderData: Order) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === orderData.id)
      if (exists) {
        return prev.map(o => o.id === orderData.id ? orderData : o)
      }
      return [orderData, ...prev]
    })
  }

  const handleOpenEditOrder = (order: Order) => {
    setOrderEditing(order)
    setShowOrderModal(true)
  }

  const handleOpenNewOrder = () => {
    setOrderEditing(null)
    setShowOrderModal(true)
  }

  const handleUpdateOrderStatus = (orderId: string, nextStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
  }

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Sidebar Lateral (Desktop) */}
      <aside className="hidden md:flex flex-col h-screen border-r border-neutral-900 bg-[#111] flex-shrink-0" style={{ width: 220 }}>
        <div className="px-5 py-4 border-b border-neutral-900 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
          </div>
          <div>
            <div className="font-bold text-sm text-neutral-100">AndradeTech</div>
            <div className="text-[10px] font-mono text-neutral-500">Gestão de OS</div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = screen === item.id
            return (
              <button
                key={item.id}
                onClick={() => setScreen(item.id as Screen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-colors"
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
      </aside>

      {/* Drawer Menu (Mobile) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/80">
          <div className="w-64 h-full bg-[#111] border-r border-neutral-800 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <span className="font-bold text-sm text-white">AndradeTech OS</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-neutral-400 hover:text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-1 flex-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setScreen(item.id as Screen)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    screen === item.id ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Área Principal */}
      <main className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0">
        {screen === 'dashboard' && (
          <DashboardScreen
            orders={orders}
            quotes={quotes}
            statuses={statuses}
            onNewOrder={handleOpenNewOrder}
            onNewClient={() => setShowNewClient(true)}
            onEditOrder={handleOpenEditOrder}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
        {screen === 'orders' && (
          <OrdersScreen
            orders={orders}
            statuses={statuses}
            onNewOrder={handleOpenNewOrder}
            onEditOrder={handleOpenEditOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
        {screen === 'quotes' && <QuotesScreen quotes={quotes} onOpenMenu={() => setMobileMenuOpen(true)} />}
        {screen === 'clients' && (
          <ClientsScreen
            clients={clients}
            onNewClient={() => setShowNewClient(true)}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            services={services}
            statuses={statuses}
            onAddService={svc => setServices(prev => [svc, ...prev])}
            onDeleteService={id => setServices(prev => prev.filter(s => s.id !== id))}
            onAddStatus={st => setStatuses(prev => [...prev, st])}
            onDeleteStatus={id => setStatuses(prev => prev.filter(s => s.id !== id))}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}
      </main>

      {/* Barra Inferior (Celular) */}
      <nav className="fixed bottom-0 inset-x-0 h-14 bg-[#0d0d0d] border-t border-neutral-900 flex md:hidden items-center justify-around z-40 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id as Screen)}
              className="flex flex-col items-center justify-center flex-1 py-1"
              style={{ color: isActive ? '#3B82F6' : '#666' }}
            >
              {item.icon}
              <span className="text-[10px] font-mono mt-0.5">{item.label}</span>
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

      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onSave={handleSaveClient}
        />
      )}
    </div>
  )
}