-- ================================================================
-- BILLETERA PERSONAL — Schema Supabase
-- Última actualización: Mayo 2026
-- Migración: Unificación Facturas + Suscripciones
-- Pega todo esto en: Supabase → SQL Editor → Run (solo para DB nueva)
-- Para DB existente: usar migration-2026-05.sql
-- ================================================================

-- Gastos
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC NOT NULL,
  category_id     TEXT NOT NULL DEFAULT 'other',
  category_label  TEXT NOT NULL DEFAULT 'Otro',
  category_icon   TEXT NOT NULL DEFAULT '📦',
  payment_method  TEXT NOT NULL DEFAULT 'debit',
  date            DATE NOT NULL,
  receipt_url     TEXT,
  bill_id         UUID REFERENCES bills(id) ON DELETE SET NULL,  -- trazabilidad pago de facturas
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_expenses" ON expenses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date  ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_bill_id    ON expenses(bill_id);

-- Ingresos
CREATE TABLE IF NOT EXISTS incomes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC NOT NULL,
  type            TEXT NOT NULL DEFAULT 'recurring',
  times_per_month INTEGER,
  pay_days        INTEGER[],
  is_active       BOOLEAN DEFAULT true,
  start_date      DATE,
  end_date        DATE,
  date            DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_incomes" ON incomes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Facturas (unificadas: facturas únicas + suscripciones recurrentes)
--
-- Flujo de pago:
--   Al pagar → se crea un registro en `expenses` con bill_id apuntando a esta factura.
--   Si is_recurring=true → se avanza due_date al próximo ciclo.
--   Si is_recurring=false → se marca is_paid=true.
--   Para deshacer un pago → eliminar el expense desde el módulo de Gastos.
CREATE TABLE IF NOT EXISTS bills (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  category_id       TEXT NOT NULL,
  category_label    TEXT NOT NULL,
  category_icon     TEXT NOT NULL,
  estimated_amount  NUMERIC NOT NULL,
  due_date          DATE NOT NULL,           -- fecha única: vencimiento/cobro
  payment_method    TEXT NOT NULL DEFAULT 'debit',
  currency          TEXT NOT NULL DEFAULT 'COP',   -- COP o USD
  is_paid           BOOLEAN DEFAULT false,   -- solo usado por facturas no recurrentes
  is_recurring      BOOLEAN DEFAULT false,
  recurrence_period TEXT,                    -- monthly|bimonthly|quarterly|yearly|weekly
  reminder_days     INTEGER DEFAULT 3,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bills" ON bills FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bills_user_due ON bills(user_id, due_date ASC);

-- Categorías personalizadas
CREATE TABLE IF NOT EXISTS categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_categories" ON categories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Configuración de usuario (IA, etc.)
CREATE TABLE IF NOT EXISTS user_config (
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ai_provider    TEXT DEFAULT 'gemini',
  gemini_api_key TEXT,
  gemini_model   TEXT DEFAULT 'gemini-1.5-flash',
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_config" ON user_config FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket para recibos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "upload_own_receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "view_own_receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE
  expenses, incomes, bills, categories, user_config;
