const MODELS = {
  'gemini-1.5-flash': 'gemini-1.5-flash',
  'gemini-1.5-pro':   'gemini-1.5-pro',
}

const PROMPT = `Eres un experto en leer facturas, recibos y tiquetes de Colombia.
Analiza esta imagen y extrae la siguiente información:
1. Una descripción breve del gasto (máximo 50 caracteres, en español, ej: "Mercado Éxito", "Restaurante El Corral")
2. El valor TOTAL a pagar en pesos colombianos (solo el número entero, sin puntos ni comas ni símbolo $)
3. La fecha del documento (formato YYYY-MM-DD)

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código:
{"description": "texto aquí", "amount": 0, "date": "YYYY-MM-DD"}

Si no puedes determinar un campo con certeza, usa null para ese campo.`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function scanInvoice(imageFile, apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey) throw new Error('Configura tu API Key de Gemini en Configuración.')

  const base64   = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[model] ?? MODELS['gemini-1.5-flash']}:generateContent?key=${apiKey}`

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: PROMPT },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Error ${res.status} al consultar Gemini`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  const match = text.match(/\{[\s\S]*?\}/)
  if (!match) throw new Error('Gemini no pudo extraer los datos de la imagen.')

  return JSON.parse(match[0])
}
