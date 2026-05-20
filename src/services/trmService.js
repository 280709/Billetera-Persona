const CACHE_KEY = 'billetera_trm'

// API oficial de datos abiertos Colombia — TRM publicada por el Banco de la República
const TRM_API = 'https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde+DESC'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export async function getTRM() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached?.date === todayStr()) return cached.rate
  } catch {}

  try {
    const res  = await fetch(TRM_API)
    const data = await res.json()
    const rate = parseFloat(data[0]?.valor ?? '4200')
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, date: todayStr() }))
    return rate
  } catch {
    // Fallback: devuelve el último valor cacheado o un estimado
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached?.rate) return cached.rate
    } catch {}
    return 4200  // estimado conservador
  }
}

// (Monto USD × TRM día anterior) + 200 COP de margen bancario
export function usdToCOP(amountUSD, trm) {
  return Math.ceil(amountUSD * trm) + 200
}
