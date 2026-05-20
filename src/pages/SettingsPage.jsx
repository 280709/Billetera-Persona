import { useState, useEffect }  from 'react'
import { useAuth }              from '../contexts/AuthContext'
import { useSettings }          from '../hooks/useSettings'
import { saveAISettings, removeAIKey } from '../services/settingsService'
import Layout                   from '../components/layout/Layout'
import '../components/layout/Layout.css'
import '../components/settings/Settings.css'

const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', icon: '✨' },
]

const GEMINI_MODELS = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (rápido, recomendado)' },
  { value: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro (más preciso)' },
]

export default function SettingsPage() {
  const { user }            = useAuth()
  const { settings, loading } = useSettings()

  const [provider, setProvider] = useState('gemini')
  const [model, setModel]       = useState('gemini-1.5-flash')
  const [apiKey, setApiKey]     = useState('')
  const [showKey, setShowKey]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!loading) {
      setProvider(settings.aiProvider  ?? 'gemini')
      setModel(settings.geminiModel    ?? 'gemini-1.5-flash')
      setApiKey(settings.geminiApiKey  ?? '')
    }
  }, [loading, settings])

  const hasKey = Boolean(settings.geminiApiKey)

  async function handleSave() {
    if (!apiKey.trim()) { setFeedback('⚠ Ingresa una API Key.'); return }
    setSaving(true)
    try {
      await saveAISettings(user.uid, {
        aiProvider:    provider,
        geminiApiKey:  apiKey.trim(),
        geminiModel:   model,
      })
      setFeedback('✅ Configuración guardada')
    } catch {
      setFeedback('❌ Error al guardar')
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(''), 3000)
    }
  }

  async function handleRemove() {
    setSaving(true)
    try {
      await removeAIKey(user.uid)
      setApiKey('')
      setFeedback('✅ API Key eliminada')
    } catch {
      setFeedback('❌ Error al eliminar')
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(''), 3000)
    }
  }

  return (
    <Layout title="Configuración">

      {/* ── Sección IA ── */}
      <div className="settings-section">
        <p className="settings-section-title">Inteligencia Artificial</p>
        <div className="card">

          {/* Estado */}
          <div className="ai-status">
            <span className={`ai-status-dot ${hasKey ? 'ok' : 'off'}`} />
            {hasKey ? 'IA activa — lectura de facturas disponible' : 'Sin API Key — IA desactivada'}
          </div>

          {/* Proveedor */}
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Proveedor</p>
          <div className="provider-grid">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                type="button"
                className={`provider-chip${provider === p.id ? ' selected' : ''}`}
                onClick={() => setProvider(p.id)}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Modelo */}
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>Modelo</p>
          <select
            className="model-select"
            value={model}
            onChange={e => setModel(e.target.value)}
          >
            {GEMINI_MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* API Key */}
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>API Key</p>
          <div className="api-key-wrap">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="btn-show-key" onClick={() => setShowKey(v => !v)}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <p className="api-key-hint">
            La key se guarda en tu cuenta. Obtén una gratis en{' '}
            <span style={{ color: 'var(--color-primary)' }}>aistudio.google.com</span>
          </p>

          {feedback && <p className="settings-feedback">{feedback}</p>}

          <div className="settings-actions">
            <button className="btn-settings-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
            {hasKey && (
              <button className="btn-settings-remove" onClick={handleRemove} disabled={saving}>
                Quitar key
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Info de uso ── */}
      <div className="settings-section">
        <p className="settings-section-title">¿Cómo funciona?</p>
        <div className="card" style={{ fontSize: '0.82rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          <p>📷 En la sección <strong>Gastos</strong>, pulsa "Leer factura con IA" y toma una foto de tu recibo.</p>
          <p style={{ marginTop: '0.5rem' }}>🤖 Gemini extrae automáticamente la descripción, el valor y la fecha.</p>
          <p style={{ marginTop: '0.5rem' }}>✏️ Puedes revisar y editar los datos antes de guardar.</p>
        </div>
      </div>

    </Layout>
  )
}
