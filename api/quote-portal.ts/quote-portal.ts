type RequestLike = { method?: string; query?: Record<string, string | string[]>; body?: any }
type ResponseLike = { status: (code: number) => ResponseLike; json: (data: unknown) => void; setHeader: (name: string, value: string) => void }

const config = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
})

async function readQuote(token: string) {
  const { url, key } = config()
  if (!url || !key) throw new Error('Configuração segura do Supabase ausente.')
  const response = await fetch(url + '/rest/v1/quotes?public_token=eq.' + encodeURIComponent(token) + '&select=id,client,device,description,value,valid_until,status,items,link_expires_at', {
    headers: { apikey: key, Authorization: 'Bearer ' + key },
  })
  if (!response.ok) throw new Error('Não foi possível consultar o orçamento.')
  const rows = await response.json()
  return rows[0]
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const token = String(req.method === 'GET' ? req.query?.token || '' : req.body?.token || '')
    if (!token || token.length < 24) return res.status(400).json({ error: 'Link inválido.' })

    const quote = await readQuote(token)
    if (!quote || (quote.link_expires_at && new Date(quote.link_expires_at).getTime() < Date.now())) {
      return res.status(404).json({ error: 'Este link expirou ou não está disponível.' })
    }
    if (req.method === 'GET') return res.status(200).json({ quote })
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })

    const status = req.body?.action === 'approve' ? 'Aprovado' : req.body?.action === 'reject' ? 'Reprovado' : null
    if (!status) return res.status(400).json({ error: 'Ação inválida.' })
    if (quote.status === 'Aprovado' || quote.status === 'Reprovado') {
      return res.status(409).json({ error: 'Este orçamento já recebeu uma resposta.' })
    }

    const { url, key } = config()
    const update = await fetch(url + '/rest/v1/quotes?public_token=eq.' + encodeURIComponent(token), {
      method: 'PATCH',
      headers: { apikey: key!, Authorization: 'Bearer ' + key!, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ status }),
    })
    if (!update.ok) throw new Error('Não foi possível registrar a resposta.')
    const rows = await update.json()
    return res.status(200).json({ quote: rows[0] })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Erro ao consultar orçamento.' })
  }
}
