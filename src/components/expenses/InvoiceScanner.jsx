import { useRef, useState } from 'react'
import { useSettings }     from '../../hooks/useSettings'
import { scanInvoice }     from '../../services/geminiService'
import '../settings/Settings.css'

/**
 * onResult({ description, amount, date, categoryId, paymentMethod, imageFile })
 *
 * - Sin API key de Gemini: muestra solo el botón de adjuntar imagen (sin análisis IA)
 * - Con API key:           muestra el botón de escanear+adjuntar con análisis IA
 */
export default function InvoiceScanner({ onResult }) {
  const { settings, loading } = useSettings()
  const fileRef   = useRef()
  const [scanning, setScanning] = useState(false)
  const [preview,  setPreview]  = useState(null)
  const [error,    setError]    = useState('')

  const hasAI = !loading && !!settings.geminiApiKey

  async function handleCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setError('')

    // Sin IA: solo adjuntar la imagen, sin análisis
    if (!hasAI) {
      onResult({ imageFile: file })
      fileRef.current.value = ''
      return
    }

    // Con IA: escanear + adjuntar
    setScanning(true)
    try {
      const result = await scanInvoice(file, settings.geminiApiKey, settings.geminiModel)
      onResult({ ...result, imageFile: file })
    } catch (err) {
      setError(err.message || 'No se pudo leer la factura. Intenta de nuevo.')
      // Adjuntar igual aunque falle el análisis
      onResult({ imageFile: file })
    } finally {
      setScanning(false)
      fileRef.current.value = ''
    }
  }

  // Mostrar solo mientras carga la config
  if (loading) return null

  return (
    <div className="scanner-wrap">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="btn-scan"
        onClick={() => { setPreview(null); setError(''); fileRef.current.click() }}
        disabled={scanning}
      >
        {scanning
          ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔍</span> Leyendo factura...</>
          : hasAI
            ? <>📷 Leer factura con IA</>
            : <>📎 Adjuntar imagen del recibo</>
        }
      </button>

      {scanning && (
        <p className="scan-hint">Analizando con {settings.geminiModel ?? 'Gemini'}…</p>
      )}

      {!hasAI && !preview && (
        <p className="scan-hint">
          Configura Gemini en ⚙ Configuración para que la IA rellene los campos automáticamente.
        </p>
      )}

      {/* Preview de la foto capturada */}
      {preview && !scanning && (
        <div className="scan-preview-wrap">
          <img src={preview} alt="Recibo adjunto" className="scan-preview" />
          <span className="scan-preview-label">📎 Recibo adjunto</span>
        </div>
      )}

      {error && <p className="scan-error">{error}</p>}
    </div>
  )
}
