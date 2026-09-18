const INFINITEPAY_API = 'https://api.checkout.infinitepay.io/links'

const getOrigin = (req: any) => {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return protocol + '://' + host
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { referenceType, referenceId, amount, description, customer } = req.body || {}
  if (!['sale', 'order'].includes(referenceType) || !referenceId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Dados de cobrança inválidos.' })
  }

  const handle = process.env.INFINITEPAY_HANDLE
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!handle || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Variáveis de pagamento não configuradas.' })
  }

  const origin = getOrigin(req)
  const orderNsu = referenceType + ':' + referenceId
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const price = Math.round(Number(amount) * 100)

  const checkoutResponse = await fetch(INFINITEPAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle,
      order_nsu: orderNsu,
      redirect_url: origin + '/?payment_return=1',
      webhook_url: origin + '/api/infinitepay/webhook',
      customer: customer?.name ? {
        name: customer.name,
        email: customer.email || undefined,
        phone_number: customer.phone || undefined,
      } : undefined,
      items: [{ quantity: 1, price, description: String(description || 'Pagamento AndradeTech').slice(0, 120) }],
    }),
  })

  const checkout = await checkoutResponse.json().catch(() => ({}))
  if (!checkoutResponse.ok || !checkout.url) {
    return res.status(502).json({ error: checkout.message || 'Não foi possível criar a cobrança na InfinitePay.' })
  }

  const paymentResponse = await fetch(supabaseUrl + '/rest/v1/payment_transactions?on_conflict=reference_type,reference_id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      reference_type: referenceType,
      reference_id: referenceId,
      amount: Number(amount),
      status: 'pending',
      expires_at: expiresAt,
    }),
  })

  if (!paymentResponse.ok) return res.status(502).json({ error: 'Checkout criado, mas não foi possível registrar a cobrança.' })
  return res.status(200).json({ url: checkout.url, expiresAt, orderNsu })
}
