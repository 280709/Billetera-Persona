import { useState } from 'react'
import { useAuth }           from '../../contexts/AuthContext'
import { deactivateIncome, deleteIncome } from '../../services/incomeService'
import { formatCurrency }    from '../../utils/formatters'
import '../expenses/Expenses.css'

const TODAY = new Date().toISOString().split('T')[0]

export default function DeactivateSheet({ income, onClose }) {
  const { user }    = useAuth()
  const [endDate, setEndDate] = useState(TODAY)
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState(false)  // confirmación de eliminación permanente

  async function handleDeactivate() {
    setSaving(true)
    try {
      await deactivateIncome(user.uid, income.id, endDate)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteIncome(user.uid, income.id)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <h3>Gestionar ingreso</h3>

        <div style={{
          background: 'var(--color-bg)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
            {income.description}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            {formatCurrency(income.amount)} · {income.timesPerMonth ?? 1} vez(ces) al mes
          </p>
        </div>

        {!confirm ? (
          <>
            {/* Opción 1: Desactivar con fecha */}
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              ¿Cuándo fue la última vez que recibiste este ingreso?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.875rem' }}>
              Los meses anteriores a esta fecha conservan el ingreso en sus cálculos.
            </p>

            <div className="field sheet-form" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                Última fecha de recibo
              </label>
              <input
                type="date"
                value={endDate}
                max={TODAY}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  padding: '0.7rem 0.875rem',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '0.6rem',
                  fontSize: '1rem',
                  background: 'var(--color-bg)',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <div className="sheet-actions">
              <button className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button className="btn-save" onClick={handleDeactivate} disabled={saving}>
                {saving ? 'Guardando...' : 'Desactivar ingreso'}
              </button>
            </div>

            {/* Separador */}
            <div style={{ margin: '1.25rem 0 0.75rem', borderTop: '1px solid var(--color-border)' }} />

            {/* Opción 2: Eliminar permanente */}
            <button
              onClick={() => setConfirm(true)}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: 'none',
                border: '1.5px solid var(--color-danger)',
                borderRadius: '0.6rem',
                color: 'var(--color-danger)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Eliminar permanentemente
            </button>
          </>
        ) : (
          /* Confirmación eliminación */
          <>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-danger)', fontWeight: 600 }}>
              ¿Eliminar permanentemente?
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
              Se borrará el ingreso y no aparecerá en ningún mes, ni en el historial.
              Usa "Desactivar" si quieres conservar el historial anterior.
            </p>
            <div className="sheet-actions">
              <button className="btn-cancel" onClick={() => setConfirm(false)}>Volver</button>
              <button
                className="btn-save"
                style={{ background: 'var(--color-danger)' }}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
