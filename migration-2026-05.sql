-- ================================================================
-- MIGRACIÓN: Unificación Facturas + Suscripciones
-- Billetera Personal — Mayo 2026
-- ================================================================
-- PASO 1: Ejecutar este archivo completo en Supabase → SQL Editor
-- PASO 2: Si el app ya tenía datos, ejecutar el bloque de LIMPIEZA al final
-- ================================================================

-- ── 1. expenses: agregar bill_id ─────────────────────────────────
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_bill_id ON expenses(bill_id);

-- ── 2. bills: nuevas columnas ─────────────────────────────────────
ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'debit',
  ADD COLUMN IF NOT EXISTS currency       TEXT NOT NULL DEFAULT 'COP';

-- Renombrar fecha (solo si todavía tiene el nombre viejo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'estimated_due_date'
  ) THEN
    ALTER TABLE bills RENAME COLUMN estimated_due_date TO due_date;
  END IF;
END$$;

-- ── 3. bills: eliminar columnas obsoletas ─────────────────────────
ALTER TABLE bills
  DROP COLUMN IF EXISTS real_amount,
  DROP COLUMN IF EXISTS real_due_date,
  DROP COLUMN IF EXISTS is_auto_debit,
  DROP COLUMN IF EXISTS debit_confirmed,
  DROP COLUMN IF EXISTS paid_at,
  DROP COLUMN IF EXISTS receipt_url;

-- ── 4. Migrar suscripciones activas → bills ───────────────────────
-- (solo si la tabla subscriptions aún existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'subscriptions'
  ) THEN
    INSERT INTO bills (
      user_id, name,
      category_id, category_label, category_icon,
      estimated_amount, due_date,
      payment_method, currency,
      reminder_days, is_recurring, recurrence_period,
      created_at, updated_at
    )
    SELECT
      user_id, name,
      category_id, category_label, category_icon,
      amount            AS estimated_amount,
      next_billing_date AS due_date,
      payment_method,
      currency,
      reminder_days,
      true              AS is_recurring,
      CASE billing_cycle
        WHEN 'yearly' THEN 'yearly'
        WHEN 'weekly' THEN 'weekly'
        ELSE 'monthly'
      END               AS recurrence_period,
      created_at,
      NOW()             AS updated_at
    FROM subscriptions
    WHERE is_active = true;
  END IF;
END$$;

-- ── 5. Eliminar tablas obsoletas ──────────────────────────────────
DROP TABLE IF EXISTS subscriptions      CASCADE;
DROP TABLE IF EXISTS credit_card_charges CASCADE;

-- ── 6. Actualizar Realtime ────────────────────────────────────────
DO $$
BEGIN
  -- Remover tablas que ya no existen de la publicación realtime
  -- (ignorar si ya no están en la publicación)
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE subscriptions;
  EXCEPTION WHEN undefined_table OR others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE credit_card_charges;
  EXCEPTION WHEN undefined_table OR others THEN NULL;
  END;
END$$;


-- ================================================================
-- LIMPIEZA OPCIONAL: Borrar todos los datos del usuario para empezar
-- limpio con el nuevo esquema. Ejecutar SOLO si quieres inicio fresco.
-- Reemplaza 'TU-USER-ID-AQUI' con tu UUID de Supabase Auth.
-- (lo encuentras en: Supabase → Authentication → Users)
-- ================================================================

-- DELETE FROM bills   WHERE user_id = 'TU-USER-ID-AQUI';
-- DELETE FROM expenses WHERE user_id = 'TU-USER-ID-AQUI' AND bill_id IS NOT NULL;

-- Para borrar TODOS los datos del usuario (inicio completamente fresco):
-- DELETE FROM bills       WHERE user_id = 'TU-USER-ID-AQUI';
-- DELETE FROM expenses    WHERE user_id = 'TU-USER-ID-AQUI';
-- DELETE FROM incomes     WHERE user_id = 'TU-USER-ID-AQUI';
-- DELETE FROM categories  WHERE user_id = 'TU-USER-ID-AQUI';
