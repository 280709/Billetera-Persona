-- ================================================================
-- BILLETERA PERSONAL — Schema Supabase
-- Pega todo esto en: Supabase → SQL Editor → Run
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
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_expenses" ON expenses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- Facturas
CREATE TABLE IF NOT EXISTS bills (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  category_id         TEXT NOT NULL,
  category_label      TEXT NOT NULL,
  category_icon       TEXT NOT NULL,
  estimated_amount    NUMERIC NOT NULL,
  estimated_due_date  DATE NOT NULL,
  real_amount         NUMERIC,
  real_due_date       DATE,
  is_paid             BOOLEAN DEFAULT false,
  paid_at             TIMESTAMPTZ,
  receipt_url         TEXT,
  is_auto_debit       BOOLEAN DEFAULT false,
  debit_confirmed     BOOLEAN,
  is_recurring        BOOLEAN DEFAULT false,
  recurrence_period   TEXT,
  reminder_days       INTEGER DEFAULT 3,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bills" ON bills FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                    TEXT NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'COP',
  amount                  NUMERIC NOT NULL,
  billing_cycle           TEXT NOT NULL DEFAULT 'monthly',
  next_billing_date       DATE NOT NULL,
  reminder_days           INTEGER DEFAULT 3,
  is_auto_debit           BOOLEAN DEFAULT false,
  payment_method          TEXT NOT NULL DEFAULT 'debit',
  is_active               BOOLEAN DEFAULT true,
  category_id             TEXT NOT NULL,
  category_label          TEXT NOT NULL,
  category_icon           TEXT NOT NULL,
  current_cycle_confirmed BOOLEAN DEFAULT false,
  last_real_amount_cop    NUMERIC,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_subscriptions" ON subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cargos tarjeta de crédito
CREATE TABLE IF NOT EXISTS credit_card_charges (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type   TEXT NOT NULL DEFAULT 'subscription',
  source_id     UUID,
  source_name   TEXT NOT NULL,
  category_icon TEXT NOT NULL DEFAULT '📋',
  amount        NUMERIC NOT NULL,
  billing_date  DATE,
  is_paid       BOOLEAN DEFAULT false,
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE credit_card_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_cc_charges" ON credit_card_charges FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- Habilitar Realtime para todas las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE
  expenses, incomes, bills, subscriptions,
  credit_card_charges, categories, user_config;
