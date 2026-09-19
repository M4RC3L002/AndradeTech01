type Req = { method?: string; query?: any; body?: any }
type Res = { status: (n: number) => Res; json: (v: any) => void; setHeader: (n: string, v: string) => void }

const cfg = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
})

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store')

  try {
    const token = String(req.method === 'GET' ? req.query?.token || '' : req.body?.token || '')
    const { url, key } = cfg()
    if (!token || !url || !key) return res.status(400).json({ error: 'Link inválido.' })

    const headers = { apikey: key, Authorization: 'Bearer ' + key }
    const read = await fetch(
      url + '/rest/v1/quotes?public_token=eq.' + encodeURIComponent(token) + '&select=id,client,phone,device,description,value,status,link_expires_at,items',
      { headers },
    )
    const q = (await read.json())[0]
    if (!q || (q.link_expires_at && new Date(q.link_expires_at).getTime() < Date.now())) {
      return res.status(404).json({ error: 'Este link expirou ou não está disponível.' })
    }

    if (req.method === 'GET') return res.status(200).json({ quote: q })

    const action = req.body?.action
    if (action !== 'approve' && action !== 'reject') return res.status(400).json({ error: 'Ação inválida.' })

    if (action === 'reject') {
      const update = await fetch(url + '/rest/v1/quotes?public_token=eq.' + encodeURIComponent(token), {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'Reprovado' }),
      })
      if (!update.ok) throw new Error('Não foi possível registrar a reprovação.')
      return res.status(200).json({ quote: (await update.json())[0] })
    }

    const order = {
      id: 'OS-' + Math.floor(1000 + Math.random() * 9000),
      client: q.client,
      phone: q.phone || '',
      device: q.device || '',
      service: Array.isArray(q.items) && q.items[0]?.desc ? q.items[0].desc : q.description || 'Serviço Técnico',
      status: 'Aprovado',
      value: Number(q.value) || 0,
      date: new Date().toLocaleDateString('pt-BR'),
      technician: 'Aguardando atribuição',
      notes: 'Aprovado pelo cliente pelo link público. Convertido do orçamento #' + q.id + '. ' + (q.description || ''),
      items: Array.isArray(q.items) ? q.items : [],
    }

    const createOrder = await fetch(url + '/rest/v1/orders', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(order),
    })
    if (!createOrder.ok) throw new Error('Não foi possível criar a Ordem de Serviço.')

    const deleteQuote = await fetch(url + '/rest/v1/quotes?public_token=eq.' + encodeURIComponent(token), {
      method: 'DELETE',
      headers,
    })
    if (!deleteQuote.ok) throw new Error('A OS foi criada, mas não foi possível remover o orçamento.')

    return res.status(200).json({ quote: { ...q, status: 'Aprovado' }, order: (await createOrder.json())[0], converted: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Erro ao consultar orçamento.' })
  }
}
