const PAYMENT_CHECK_API = 'https://api.checkout.infinitepay.io/payment_check'
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })
  const payload = req.body || {}
  const orderNsu = String(payload.order_nsu || '')
  const referenceType = orderNsu.startsWith('1') ? 'sale' : orderNsu.startsWith('2') ? 'order' : ''
  const referenceId = (referenceType === 'sale' ? 'VD-' : 'OS-') + orderNsu.slice(1)
  const slug = payload.invoice_slug || payload.slug
  const transactionNsu = payload.transaction_nsu
  const handle = process.env.INFINITEPAY_HANDLE
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!['sale', 'order'].includes(referenceType) || !referenceId || !slug || !transactionNsu || !handle || !supabaseUrl || !supabaseKey) {
    return res.status(400).json({ success: false, message: 'Cobrança inválida.' })
  }
  const checkResponse = await fetch(PAYMENT_CHECK_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle, order_nsu: orderNsu, transaction_nsu: transactionNsu, slug }),
  })
  const check = await checkResponse.json().catch(() => ({}))
  if (!checkResponse.ok || check.paid !== true) {
    return res.status(400).json({ success: false, message: 'Pagamento ainda não confirmado.' })
  }
  const updateResponse = await fetch(supabaseUrl + '/rest/v1/payment_transactions?reference_type=eq.' + referenceType + '&reference_id=eq.' + encodeURIComponent(referenceId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: 'Bearer ' + supabaseKey,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status: 'paid',
      transaction_nsu: transactionNsu,
      infinitepay_slug: slug,
      receipt_url: payload.receipt_url || null,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  })
  if (!updateResponse.ok) return res.status(502).json({ success: false, message: 'Pagamento confirmado, mas não foi possível registrá-lo.' })
  return res.status(200).json({ success: true, message: null })
}
