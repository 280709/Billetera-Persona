// Categorías disponibles que Gemini puede sugerir
const CATEGORY_IDS = ['food', 'transport', 'health', 'leisure', 'shopping', 'education', 'home', 'beauty', 'other']

const MODELS = {
  'gemini-1.5-flash':   'gemini-1.5-flash',
  'gemini-1.5-pro':     'gemini-1.5-pro',
  'gemini-2.0-flash':   'gemini-2.0-flash',
  'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
}

const PROMPT = `Eres un experto en leer facturas, recibos y tiquetes de Colombia.
Analiza esta imagen y extrae la siguiente información:

1. description: Nombre del comercio o descripción breve del gasto (máximo 50 caracteres, en español).
   Ejemplos: "Mercado Éxito", "Restaurante El Corral", "Uber", "Farmacia Cruz Verde"

2. amount: El valor TOTAL a pagar en pesos colombianos (solo el número entero, sin puntos ni comas ni símbolo $).
   Si hay propina o servicio, inclúyelos en el total.

3. date: La fecha del documento en formato YYYY-MM-DD.

4. categoryId: La categoría más apropiada. Elige EXACTAMENTE UNO de estos valores:
   - "food"       → supermercados, restaurantes, cafeterías, domicilios, tiendas de abarrotes
   - "transport"  → Uber, taxis, buses, gasolina, parqueadero, peajes
   - "health"     → farmacias, médicos, clínicas, laboratorios, ópticas
   - "leisure"    → cine, conciertos, videojuegos, bares, discotecas, deporte
   - "shopping"   → ropa, zapatos, accesorios, electrónicos, muebles, tiendas varias
   - "education"  → cursos, libros, universidades, colegios, papelerías
   - "home"       → ferretería, servicios domésticos, decoración, jardinería
   - "beauty"     → peluquería, salón de belleza, spa, productos de belleza
   - "other"      → cualquier otro tipo de gasto

5. paymentMethod: Método de pago detectado en la factura.
   - "credit" si dice: "crédito", "VISA", "Mastercard", "tarjeta crédito", "TC"
   - "debit"  si dice: "débito", "efectivo", "cash", "tarjeta débito", "TD", o no se puede determinar

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown:
{"description":"texto","amount":0,"date":"YYYY-MM-DD","categoryId":"food","paymentMethod":"debit"}

Si no puedes determinar un campo con certeza, usa null para ese campo (EXCEPTO categoryId y paymentMethod que siempre deben tener valor).`

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
  const modelId  = MODELS[model] ?? 'gemini-1.5-flash'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`

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
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Error ${res.status} al consultar Gemini`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Extraer JSON de la respuesta (puede venir con o sin backticks)
  const match = text.match(/\{[\s\S]*?\}/)
  if (!match) throw new Error('Gemini no pudo extraer los datos de la imagen.')

  const result = JSON.parse(match[0])

  // Validar y limpiar categoryId
  if (!CATEGORY_IDS.includes(result.categoryId)) {
    result.categoryId = 'other'
  }
  // Normalizar paymentMethod
  if (!['debit', 'credit'].includes(result.paymentMethod)) {
    result.paymentMethod = 'debit'
  }

  return result
}
