import { useRef, useState } from 'react'
import { useSettings }     from '../../hooks/useSettings'
import { scanInvoice }     from '../../services/geminiService'
import '../settings/Settings.css'

export default function InvoiceScanner({ onResult }) {
  const { settings, loading } = useSettings()
  const fileRef   = useRef()
  const [scanning, setScanning] = useState(false)
  const [preview,  setPreview]  = useState(null)
  const [error,    setError]    = useState('')

  if (loading || !settings.geminiApiKey) return null

  async function handleCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setScanning(true)
    setError('')

    try {
      const result = await scanInvoice(file, settings.geminiApiKey, settings.geminiModel)
      onResult(result)
    } catch (err) {
      setError(err.message || 'No se pudo leer la factura. Intenta de nuevo.')
    } finally {
      setScanning(false)
      fileRef.current.value = ''
    }
  }

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
          ? <><span style={{ animation: 'spin 1s linear infinite', display:'inline-block' }}>🔍</span> Leyendo factura...</>
          : <>📷 Leer factura con IA</>
        }
      </button>

      {preview && !scanning && (
        <img src={preview} alt="Factura capturada" className="scan-preview" />
      )}

      {scanning && (
        <p className="scan-hint">Analizando imagen con {settings.geminiModel ?? 'Gemini'}...</p>
      )}

      {error && <p className="scan-error">{error}</p>}
    </div>
  )
}
