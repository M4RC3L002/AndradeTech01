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
  { id: '3', name: 'Formatação + Instalação de SO', default_price: 150, category: 'Software' },
  { id: '4', name: 'Limpeza Interna e Troca de Pasta Térmica', default_price: 120, category: 'Manutenção' },
  { id: '5', name: 'Troca de Conector de Carga', default_price: 130, category: 'Hardware' },
  { id: '6', name: 'Diagnóstico e Orçamento Técnico', default_price: 0, category: 'Diagnóstico' },
]

// ─── Utilitários ──────────────────────────────────────────────────────────────

function StatusBadge({ status, statuses }: { status: string; statuses: CustomStatus[] }) {
  const current = statuses.find(s => s.label.toLowerCase() === status.toLowerCase()) || {
    label: status,
    dot: '#888888',
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium"
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
      title="Enviar mensagem formatada no WhatsApp"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95 flex-shrink-0 cursor-pointer"
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 opacity-20">{icon}</div>
      <div className="text-sm font-medium mb-1" style={{ color: '#888' }}>{title}</div>
      <div className="text-xs" style={{ color: '#555' }}>{sub}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <form onSubmit={(e) => handleSave(e, false)} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl flex flex-col" style={{ background: '#111111', borderColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#222' }}>
          <div>
            <div className="text-xs font-mono mb-0.5" style={{ color: '#555' }}>
              {orderToEdit ? `EDITANDO ${orderToEdit.id}` : 'NOVO REGISTRO'}
            </div>
            <h2 className="text-base font-bold" style={{ color: '#e5e5e5' }}>
              {orderToEdit ? 'Editar Ordem de Serviço' : 'Registrar Ordem de Serviço'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: '#555' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Cliente *</label>
              <input
                list="client-options"
                value={client}
                onChange={e => handleClientChange(e.target.value)}
                placeholder="Nome do cliente..."
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
              />
              <datalist id="client-options">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Telefone / WhatsApp</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(DDD) 99999-9999"
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Aparelho / Equipamento *</label>
              <input
                value={device}
                onChange={e => setDevice(e.target.value)}
                placeholder="Ex: Notebook Lenovo, Galaxy S21..."
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
              />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Situação da OS</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Técnico Responsável</label>
            <input
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
              style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Diagnóstico / Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Sintomas, avarias de entrada, detalhes do reparo..."
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none resize-none"
              style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }}
            />
          </div>

          {/* Lista de Serviços e Peças */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#555' }}>Serviços & Peças</label>
              <button
                type="button"
                onClick={() => setItems([...items, { desc: '', qty: 1, unit: 0 }])}
                className="text-xs font-medium transition-colors" style={{ color: '#2563EB' }}>
                + Adicionar Item
              </button>
            </div>

            <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#2a2a2a' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#0a0a0a' }}>
                    <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-left" style={{ color: '#555' }}>Descrição (ou selecione)</th>
                    <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-center w-16" style={{ color: '#555' }}>Qtd</th>
                    <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-right w-28" style={{ color: '#555' }}>Unit (R$)</th>
                    <th className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-right w-24" style={{ color: '#555' }}>Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: '#1a1a1a' }}>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <input
                            value={item.desc}
                            onChange={e => setItems(items.map((it, j) => j === i ? { ...it, desc: e.target.value } : it))}
                            placeholder="Serviço ou peça..."
                            className="w-full bg-transparent outline-none text-sm"
                            style={{ color: '#ccc' }}
                          />
                          {services.length > 0 && (
                            <select
                              onChange={e => {
                                if (e.target.value) handleApplyServicePreset(e.target.value, i)
                              }}
                              className="text-xs rounded bg-[#181818] border border-[#333] text-[#888] outline-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Catálogo</option>
                              {services.map(s => (
                                <option key={s.id} value={s.name}>{s.name} (R$ {s.default_price})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: Math.max(1, +e.target.value) } : it))}
                          className="w-full bg-transparent text-center outline-none text-sm font-mono"
                          style={{ color: '#ccc' }}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit || ''}
                          onChange={e => setItems(items.map((it, j) => j === i ? { ...it, unit: +e.target.value } : it))}
                          placeholder="0"
                          className="w-full bg-transparent text-right outline-none text-sm font-mono"
                          style={{ color: '#ccc' }}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm" style={{ color: '#aaa' }}>
                        R$ {((item.qty || 1) * (item.unit || 0)).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => items.length > 1 && setItems(items.filter((_, j) => j !== i))}
                          style={{ color: '#444' }}
                          className="hover:text-red-400"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t" style={{ borderColor: '#333', background: '#0a0a0a' }}>
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-mono uppercase tracking-wider" style={{ color: '#555' }}>Valor Total</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-sm" style={{ color: '#e5e5e5' }}>R$ {total.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: '#222' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm transition-colors" style={{ color: '#555' }}>
            Cancelar
          </button>
          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#2563EB' }}>
              Salvar Alterações
            </button>
            <button type="button" onClick={(e) => handleSave(e, true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
              Salvar e WhatsApp
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

    const newClient: Client = {
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
    }

    onSave(newClient)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl border shadow-2xl" style={{ background: '#111111', borderColor: '#2a2a2a' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#222' }}>
          <div>
            <div className="text-xs font-mono mb-0.5" style={{ color: '#555' }}>CADASTRO</div>
            <h2 className="text-base font-bold" style={{ color: '#e5e5e5' }}>Novo Cliente</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: '#555' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Nome Completo *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Rafael Mendonça" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Telefone / WhatsApp *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(DDD) 99999-9999" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>CPF / CNPJ</label>
              <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Endereço</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro..." className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
          </div>
          <div>
            <label className="block text-xs font-mono mb-1.5 uppercase tracking-wider" style={{ color: '#555' }}>Cidade / Estado</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Eunápolis, BA" className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none" style={{ background: '#181818', borderColor: '#2a2a2a', color: '#e5e5e5' }} />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: '#222' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm transition-colors" style={{ color: '#555' }}>
            Cancelar
          </button>
          <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: '#2563EB' }}>
            Salvar Cliente
          </button>
        </div>
      </form>
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
  { id: 'orders', label: 'Ordens de Serviço', sub: 'OS Ativas & Histórico', icon: (
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
  { id: 'settings', label: 'Cadastros Rápidos', sub: 'Serviços & Situações', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/>
    </svg>
  )},
] as const

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <aside className="flex flex-col h-screen border-r flex-shrink-0" style={{ width: 232, background: '#111111', borderColor: '#1e1e1e' }}>
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
            <div className="text-xs font-mono" style={{ color: '#444' }}>Gestão de OS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-xs font-mono uppercase tracking-widest px-3 mb-3" style={{ color: '#333' }}>Menu</div>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
              style={{
                background: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#fff' : '#666',
              }}
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

      <div className="px-2 py-3 border-t" style={{ borderColor: '#1e1e1e' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#2a2a2a', color: '#888' }}>
            AT
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#ccc' }}>Admin Técnico</div>
            <div className="text-xs truncate font-mono" style={{ color: '#444' }}>Sistema Ativo</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

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

function DashboardScreen({
  orders,
  quotes,
  statuses,
  onNewOrder,
  onNewClient,
  onEditOrder,
  onNavigate,
}: {
  orders: Order[]
  quotes: Quote[]
  statuses: CustomStatus[]
  onNewOrder: () => void
  onNewClient: () => void
  onEditOrder: (order: Order) => void
  onNavigate: (s: Screen) => void
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
      <Topbar section="PAINEL" title="Visão Geral" onNewOrder={onNewOrder} onNewClient={onNewClient}>
        <div className="relative ml-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#444' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar OS, cliente, aparelho..."
            className="rounded-lg pl-9 pr-4 py-2 text-sm border outline-none"
            style={{ background: '#111', borderColor: '#222', color: '#ccc', width: 260 }}
          />
        </div>
      </Topbar>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total em Aberto', value: openOrders.toString(), sub: `${openOrders} serviço(s) ativos`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Concluídos', value: completedOrders.toString(), sub: 'finalizados no sistema', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
            { label: 'Orçamentos', value: pendingQuotes.toString(), sub: `${pendingQuotes} em análise`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { label: 'Faturamento Previsto', value: `R$ ${totalRevenue.toFixed(2)}`, sub: 'soma das OS geradas', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
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

        <div className="rounded-xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#1a1a1a' }}>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest mr-3" style={{ color: '#444' }}>Recentes</span>
              <span className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Últimas Ordens de Serviço</span>
            </div>
            <span className="text-xs font-mono" style={{ color: '#444' }}>{orders.length} registros</span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#0d0d0d' }}>
                {['ID','Cliente','Aparelho / Serviço','Situação','Valor','Data','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: '#444' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
                      title="Nenhuma ordem de serviço cadastrada"
                      sub="Clique em '+ Nova OS' para registrar"
                    />
                  </td>
                </tr>
              )}
              {filteredOrders.slice(0, 8).map(order => (
                <tr key={order.id} className="border-t" style={{ borderColor: '#1a1a1a' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#2563EB' }}>{order.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: '#ccc' }}>{order.client}</div>
                    <div className="text-xs font-mono" style={{ color: '#444' }}>{order.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm" style={{ color: '#aaa' }}>{order.device}</div>
                    <div className="text-xs" style={{ color: '#555' }}>{order.service}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} statuses={statuses} /></td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: order.value > 0 ? '#e5e5e5' : '#444' }}>
                    {order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: '#555' }}>{order.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditOrder(order)}
                        className="p-1.5 rounded hover:bg-[#202020] text-[#888] hover:text-[#fff] transition-colors"
                        title="Editar OS"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <WhatsAppBtn phone={order.phone} orderDetails={order} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#444' }}>Ações Rápidas</div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={onNewOrder} className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
              <span style={{ color: '#444' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg></span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#ccc' }}>Nova Ordem de Serviço</div>
                <div className="text-xs mt-0.5" style={{ color: '#444' }}>Iniciar atendimento</div>
              </div>
            </button>
            <button onClick={onNewClient} className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
              <span style={{ color: '#444' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#ccc' }}>Cadastrar Cliente</div>
                <div className="text-xs mt-0.5" style={{ color: '#444' }}>Salvar novo contato</div>
              </div>
            </button>
            <button onClick={() => onNavigate('settings')} className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
              <span style={{ color: '#444' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2"/></svg></span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#ccc' }}>Serviços & Situações</div>
                <div className="text-xs mt-0.5" style={{ color: '#444' }}>Criar novos status e valores</div>
              </div>
            </button>
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
}: {
  orders: Order[]
  statuses: CustomStatus[]
  onNewOrder: () => void
  onEditOrder: (order: Order) => void
  onUpdateStatus: (id: string, status: string) => void
  onDeleteOrder: (id: string) => void
}) {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('Todos')

  const filtered = filterStatus === 'Todos' ? orders : orders.filter(o => o.status === filterStatus)

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
        <div className="flex items-center gap-2 flex-wrap">
          {['Todos', ...statuses.map(s => s.label)].map(s => {
            const isActive = filterStatus === s
            const currentObj = statuses.find(st => st.label === s)
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border"
                style={{
                  background: isActive ? (currentObj ? `${currentObj.dot}22` : 'rgba(37,99,235,0.15)') : 'transparent',
                  color: isActive ? (currentObj ? currentObj.dot : '#2563EB') : '#555',
                  borderColor: isActive ? (currentObj ? `${currentObj.dot}44` : '#2563EB44') : '#1e1e1e',
                }}>
                {s}
                <span className="ml-1.5 opacity-50">
                  {s === 'Todos' ? orders.length : orders.filter(o => o.status === s).length}
                </span>
              </button>
            )
          })}
        </div>

        {view === 'list' ? (
          <div className="rounded-xl border overflow-hidden" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0d0d0d' }}>
                  {['ID','Cliente','Aparelho','Serviço','Técnico','Situação','Valor','Data','Ações'].map(h => (
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
                  <tr key={order.id} className="border-t" style={{ borderColor: '#1a1a1a' }}>
                    <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#2563EB' }}>{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium" style={{ color: '#ccc' }}>{order.client}</div>
                      <div className="text-xs font-mono" style={{ color: '#444' }}>{order.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#aaa' }}>{order.device}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#777' }}>{order.service}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#555' }}>{order.technician}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e => onUpdateStatus(order.id, e.target.value)}
                        className="bg-transparent text-xs font-mono outline-none cursor-pointer border rounded px-1.5 py-0.5"
                        style={{ borderColor: '#2a2a2a', color: '#ccc' }}
                      >
                        {statuses.map(st => (
                          <option key={st.id} value={st.label} style={{ background: '#111' }}>{st.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>
                      {order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#555' }}>{order.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1.5 rounded hover:bg-[#202020] text-[#888] hover:text-[#fff] transition-colors"
                          title="Editar OS"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <WhatsAppBtn phone={order.phone} orderDetails={order} />
                        <button
                          onClick={() => { if(confirm(`Excluir ${order.id}?`)) onDeleteOrder(order.id) }}
                          className="p-1.5 rounded hover:text-red-400 transition-colors"
                          style={{ color: '#444' }}
                          title="Excluir OS"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {statuses.map(st => {
              const colOrders = orders.filter(o => o.status.toLowerCase() === st.label.toLowerCase())
              return (
                <div key={st.id} className="flex-shrink-0 w-64 rounded-xl border flex flex-col" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                      <span className="text-xs font-mono font-semibold" style={{ color: st.dot }}>{st.label}</span>
                    </div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#555' }}>
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 flex-1 min-h-[140px]">
                    {colOrders.length === 0 && (
                      <div className="text-center py-8 text-xs font-mono" style={{ color: '#2a2a2a' }}>vazio</div>
                    )}
                    {colOrders.map(order => (
                      <div key={order.id} className="p-3 rounded-lg border space-y-2" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold" style={{ color: '#2563EB' }}>{order.id}</span>
                          <span className="text-xs font-mono" style={{ color: '#444' }}>{order.date}</span>
                        </div>
                        <div className="text-sm font-medium" style={{ color: '#ccc' }}>{order.client}</div>
                        <div className="text-xs" style={{ color: '#666' }}>{order.device}</div>
                        <div className="text-xs" style={{ color: '#444' }}>{order.service}</div>
                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#1a1a1a' }}>
                          <span className="font-mono text-xs font-semibold" style={{ color: '#e5e5e5' }}>
                            {order.value > 0 ? `R$ ${order.value.toFixed(2)}` : '—'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onEditOrder(order)}
                              className="p-1 rounded text-[#777] hover:text-[#fff]"
                              title="Editar OS"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <WhatsAppBtn phone={order.phone} orderDetails={order} />
                          </div>
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

function QuotesScreen({ quotes }: { quotes: Quote[] }) {
  const [selected, setSelected] = useState<Quote | null>(quotes[0] ?? null)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar section="GESTÃO" title="Orçamentos & Propostas" />
      <div className="flex flex-1 overflow-hidden">
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
              {quotes.length === 0 && (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                    title="Nenhum orçamento cadastrado"
                    sub="Propostas criadas aparecerão nesta tabela"
                  />
                </td></tr>
              )}
              {quotes.map(q => (
                <tr key={q.id} onClick={() => setSelected(q)}
                  className="border-t cursor-pointer"
                  style={{ borderColor: '#1a1a1a', background: selected?.id === q.id ? '#141414' : 'transparent' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#2563EB' }}>{q.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: '#ccc' }}>{q.client}</div>
                    <div className="text-xs font-mono" style={{ color: '#444' }}>{q.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: '#777' }}>{q.description}</td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>R$ {q.value.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: '#888' }}>{q.validUntil}</td>
                  <td className="px-4 py-3 font-mono text-xs">{q.status}</td>
                  <td className="px-4 py-3"><WhatsAppBtn phone={q.phone} label={`Orçamento ${q.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-72 flex-shrink-0 overflow-y-auto border-l" style={{ background: '#0e0e0e', borderColor: '#1a1a1a' }}>
          {selected ? (
            <div className="p-5 space-y-4">
              <div className="border-b pb-3" style={{ borderColor: '#1a1a1a' }}>
                <span className="font-mono text-sm font-semibold" style={{ color: '#2563EB' }}>{selected.id}</span>
                <div className="text-sm font-bold text-white mt-1">{selected.client}</div>
              </div>
              <div className="text-xs text-[#888]">{selected.description}</div>
              <div className="text-sm font-mono font-bold text-white">R$ {selected.value.toFixed(2)}</div>
              <WhatsAppBtn phone={selected.phone} label={`Orçamento ${selected.id} de R$ ${selected.value.toFixed(2)}`} />
            </div>
          ) : (
            <EmptyState
              icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>}
              title="Selecione um orçamento"
              sub="Clique em uma linha para ver detalhes"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tela: Clientes ───────────────────────────────────────────────────────────

function ClientsScreen({ clients, onNewClient }: { clients: Client[]; onNewClient: () => void }) {
  const [search, setSearch] = useState('')
  const filtered = clients.filter(c =>
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
                {['ID','Nome','Contato','Endereço / Cidade','Último Registro','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider whitespace-nowrap" style={{ color: '#444' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
                    title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    sub={search ? 'Tente outro termo' : "Clique em '+ Novo Cliente' para adicionar"}
                  />
                </td></tr>
              )}
              {filtered.map(client => (
                <tr key={client.id} className="border-t" style={{ borderColor: '#1a1a1a' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#444' }}>{client.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold" style={{ color: '#ccc' }}>{client.name}</div>
                    <div className="text-xs font-mono" style={{ color: '#555' }}>{client.cpf || 'Sem CPF'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono" style={{ color: '#888' }}>{client.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#777' }}>
                    {client.address ? `${client.address}, ` : ''}{client.city}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: '#555' }}>{client.lastService}</td>
                  <td className="px-4 py-3">
                    <WhatsAppBtn phone={client.phone} label={`Olá ${client.name}!`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Tela: Cadastros Rápidos (Serviços & Situações) ────────────────────────────

function SettingsScreen({
  services,
  statuses,
  onAddService,
  onDeleteService,
  onAddStatus,
  onDeleteStatus,
}: {
  services: CustomService[]
  statuses: CustomStatus[]
  onAddService: (svc: CustomService) => void
  onDeleteService: (id: string) => void
  onAddStatus: (st: CustomStatus) => void
  onDeleteStatus: (id: string) => void
}) {
  // Estado local para criação de novo serviço
  const [newSvcName, setNewSvcName] = useState('')
  const [newSvcPrice, setNewSvcPrice] = useState('')
  const [newSvcCategory, setNewSvcCategory] = useState('Hardware')
  const [showAddService, setShowAddService] = useState(false)

  // Estado local para criação de novo status
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
      category: newSvcCategory || 'Geral',
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
      <Topbar section="CONFIGURAÇÃO" title="Cadastros Rápidos" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <div className="grid grid-cols-2 gap-5">
          {/* Card: Gerenciamento de Serviços */}
          <div className="rounded-xl border flex flex-col" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: '#444' }}>CATÁLOGO</div>
                <div className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Cadastro de Serviços</div>
              </div>
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                style={{ background: '#2563EB22', color: '#3B82F6' }}
              >
                {showAddService ? 'Fechar' : '+ Novo Serviço'}
              </button>
            </div>

            {showAddService && (
              <form onSubmit={handleCreateService} className="p-4 border-b bg-[#0d0d0d] space-y-3" style={{ borderColor: '#1e1e1e' }}>
                <div className="text-xs font-mono text-[#aaa]">Adicionar novo tipo de serviço:</div>
                <input
                  required
                  placeholder="Nome do Serviço (ex: Troca de Cooler)"
                  value={newSvcName}
                  onChange={e => setNewSvcName(e.target.value)}
                  className="w-full rounded px-3 py-1.5 text-xs bg-[#181818] border border-[#2a2a2a] text-[#e5e5e5] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Preço Base (R$)"
                    value={newSvcPrice}
                    onChange={e => setNewSvcPrice(e.target.value)}
                    className="w-full rounded px-3 py-1.5 text-xs bg-[#181818] border border-[#2a2a2a] text-[#e5e5e5] outline-none"
                  />
                  <select
                    value={newSvcCategory}
                    onChange={e => setNewSvcCategory(e.target.value)}
                    className="w-full rounded px-3 py-1.5 text-xs bg-[#181818] border border-[#2a2a2a] text-[#ccc] outline-none"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Diagnóstico">Diagnóstico</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-1.5 rounded text-xs font-bold text-white bg-[#2563EB] hover:opacity-90">
                  Salvar Serviço
                </button>
              </form>
            )}

            <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: '#1a1a1a' }}>
              {services.map(svc => (
                <div key={svc.id} className="flex items-center px-5 py-3 hover:bg-[#151515] transition-colors">
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: '#ccc' }}>{svc.name}</div>
                    <div className="text-xs font-mono" style={{ color: '#444' }}>{svc.category}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm" style={{ color: '#888' }}>
                      {svc.default_price > 0 ? `R$ ${svc.default_price.toFixed(2)}` : 'A combinar'}
                    </span>
                    <button
                      onClick={() => onDeleteService(svc.id)}
                      className="p-1 rounded text-[#444] hover:text-red-400"
                      title="Excluir Serviço"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Gerenciamento de Situação da OS */}
          <div className="rounded-xl border flex flex-col" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: '#444' }}>FLUXO</div>
                <div className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Situações da Ordem (Status)</div>
              </div>
              <button
                onClick={() => setShowAddStatus(!showAddStatus)}
                className="text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                style={{ background: '#2563EB22', color: '#3B82F6' }}
              >
                {showAddStatus ? 'Fechar' : '+ Nova Situação'}
              </button>
            </div>

            {showAddStatus && (
              <form onSubmit={handleCreateStatus} className="p-4 border-b bg-[#0d0d0d] space-y-3" style={{ borderColor: '#1e1e1e' }}>
                <div className="text-xs font-mono text-[#aaa]">Criar nova situação de trabalho:</div>
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="Ex: Orçamento, Aguardando Cliente..."
                    value={newStatusLabel}
                    onChange={e => setNewStatusLabel(e.target.value)}
                    className="flex-1 rounded px-3 py-1.5 text-xs bg-[#181818] border border-[#2a2a2a] text-[#e5e5e5] outline-none"
                  />
                  <div className="flex items-center gap-1.5 bg-[#181818] border border-[#2a2a2a] px-2 rounded">
                    <span className="text-[10px] font-mono text-[#666]">Cor</span>
                    <input
                      type="color"
                      value={newStatusColor}
                      onChange={e => setNewStatusColor(e.target.value)}
                      className="w-6 h-6 rounded border-none cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-1.5 rounded text-xs font-bold text-white bg-[#2563EB] hover:opacity-90">
                  Cadastrar Situação
                </button>
              </form>
            )}

            <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: '#1a1a1a' }}>
              {statuses.map(st => (
                <div key={st.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#151515] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: st.dot }} />
                    <span className="text-sm font-medium text-[#ccc]">{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-0.5 rounded text-xs font-mono"
                      style={{ color: st.dot, background: `${st.dot}18`, border: `1px solid ${st.dot}33` }}
                    >
                      {st.label}
                    </span>
                    <button
                      onClick={() => {
                        if (statuses.length <= 1) return alert('Mantenha ao menos uma situação ativa!')
                        onDeleteStatus(st.id)
                      }}
                      className="p-1 rounded text-[#444] hover:text-red-400"
                      title="Excluir Situação"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="rounded-xl border p-5" style={{ background: '#111111', borderColor: '#1e1e1e' }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#444' }}>Controle de Armazenamento</div>
          <div className="flex items-center justify-between text-xs text-[#666]">
            <div>Todos os dados (Clientes, Ordens, Serviços e Situações) estão gravados em tempo real na memória do seu navegador.</div>
            <button
              onClick={() => {
                if (confirm('Atenção: deseja restaurar todos os serviços e situações para o padrão?')) {
                  localStorage.removeItem('andrade_services')
                  localStorage.removeItem('andrade_statuses')
                  window.location.reload()
                }
              }}
              className="px-3 py-1.5 rounded border border-[#333] hover:text-white transition-colors"
            >
              Restaurar Catálogo Padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Raiz da Aplicação ────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderEditing, setOrderEditing] = useState<Order | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)

  // ─── Estados com persistência no LocalStorage ───
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

  // Salvar Cliente
  const handleSaveClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev])
  }

  // Criar ou Atualizar Ordem de Serviço
  const handleSaveOrder = (orderData: Order) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === orderData.id)
      if (exists) {
        return prev.map(o => o.id === orderData.id ? orderData : o)
      }
      return [orderData, ...prev]
    })

    // Atualiza histórico do cliente
    setClients(prev => prev.map(c => {
      if (c.name.toLowerCase() === orderData.client.toLowerCase()) {
        return {
          ...c,
          totalOrders: c.totalOrders + 1,
          totalSpent: c.totalSpent + orderData.value,
          lastService: orderData.date,
          devices: Array.from(new Set([...c.devices, orderData.device]))
        }
      }
      return c
    }))
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar active={screen} onNavigate={setScreen} />

      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0a0a' }}>
        {screen === 'dashboard' && (
          <DashboardScreen
            orders={orders}
            quotes={quotes}
            statuses={statuses}
            onNewOrder={handleOpenNewOrder}
            onNewClient={() => setShowNewClient(true)}
            onEditOrder={handleOpenEditOrder}
            onNavigate={setScreen}
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
          />
        )}
        {screen === 'quotes' && <QuotesScreen quotes={quotes} />}
        {screen === 'clients' && (
          <ClientsScreen
            clients={clients}
            onNewClient={() => setShowNewClient(true)}
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
          />
        )}
      </main>

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