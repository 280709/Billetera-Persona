# Billetera Personal — Contexto del Proyecto

## Descripción general

PWA de gestión de finanzas personales para usuario colombiano. Maneja ingresos recurrentes por quincena, gastos fijos y variables, facturas con estimados vs. reales, y suscripciones en COP/USD con TRM automática.

**Dev server:** `npm run dev` → http://localhost:5173  
**Build/deploy:** `npm run build` → Firebase Hosting (`proyecto-2b6d2`)  
**Supabase CLI:** `supabase db query --linked "SELECT ..."` (proyecto vinculado: `gtnqcwgdqbfyyeagyxpr`)

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 (PWA via `vite-plugin-pwa`) |
| Routing | react-router-dom v6 |
| Backend | **Supabase** (Auth, PostgreSQL, Storage, Realtime) |
| Auth | Email/password + Google OAuth (`signInWithOAuth`, redirect) |
| CSS | Custom properties, mobile-first, bottom nav |
| CLI BD | `supabase` CLI v2 — vinculado al proyecto `Billetera` |

> **Migración completada (mayo 2025):** Firebase → Supabase. No existe `firebase.js`. Cliente en `src/services/supabase.js`.

---

## Estructura de archivos

```
src/
├── App.jsx
├── main.jsx
├── contexts/
│   └── AuthContext.jsx              # user.uid = user.id (compat)
├── pages/
│   ├── DashboardPage.jsx
│   ├── ExpensesPage.jsx
│   ├── IncomesPage.jsx
│   ├── BillsPage.jsx
│   ├── SubscriptionsPage.jsx        # llama useCreditCardCharges UNA sola vez y pasa props
│   ├── SettingsPage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── components/
│   ├── expenses/
│   │   ├── ExpenseForm.jsx          # adjunta recibo siempre (con/sin IA), auto-selecciona cat.
│   │   ├── ExpenseList.jsx          # ícono 📎 clicable si expense.receiptUrl != null
│   │   └── InvoiceScanner.jsx       # sin IA: adjunta imagen; con IA: escanea + adjunta
│   ├── bills/
│   │   ├── BillForm.jsx             # sección "🔄 Repetir al pagar" con chips de frecuencia
│   │   ├── BillList.jsx
│   │   ├── PayBillSheet.jsx
│   │   └── CategoryPicker.jsx
│   ├── subscriptions/
│   │   ├── SubscriptionForm.jsx
│   │   ├── SubscriptionList.jsx
│   │   ├── ConfirmDebitSheet.jsx
│   │   └── CreditCardChargesSection.jsx  # recibe props (charges, totalPending, loading)
│   ├── dashboard/
│   │   ├── BudgetSummaryCard.jsx
│   │   ├── QuincenaCard.jsx
│   │   ├── RecentExpenses.jsx
│   │   └── UpcomingBills.jsx
│   ├── incomes/
│   │   ├── IncomeForm.jsx
│   │   ├── IncomeList.jsx
│   │   └── DeactivateSheet.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── Layout.jsx
│   │   └── BottomNav.jsx
│   └── settings/
│       └── Settings.css
├── hooks/
│   ├── useBudget.js
│   ├── useExpenses.js               # mapea receipt_url → receiptUrl
│   ├── useIncomes.js
│   ├── useBills.js
│   ├── useSubscriptions.js          # expone { subscriptions, pendingConfirmations, loading, error }
│   ├── useCreditCardCharges.js      # try/catch en load()
│   ├── useCategories.js
│   ├── useSettings.js
│   └── useTRM.js
├── services/
│   ├── supabase.js
│   ├── authService.js
│   ├── expenseService.js            # acepta receiptUrl → guarda en receipt_url
│   ├── incomeService.js
│   ├── billService.js
│   ├── subscriptionService.js
│   ├── categoryService.js
│   ├── storageService.js            # bucket "receipts" público
│   ├── geminiService.js             # extrae 5 campos: description, amount, date, categoryId, paymentMethod
│   ├── settingsService.js
│   └── trmService.js
└── utils/
    ├── budgetCalculator.js
    ├── defaultCategories.js
    ├── formatters.js
    └── authErrors.js
```

---

## Rutas de la app

| Path | Componente | Acceso |
|------|-----------|--------|
| `/` | DashboardPage | Protegida |
| `/gastos` | ExpensesPage | Protegida |
| `/ingresos` | IncomesPage | Protegida |
| `/facturas` | BillsPage | Protegida |
| `/suscripciones` | SubscriptionsPage | Protegida |
| `/configuracion` | SettingsPage | Protegida |
| `/login` | LoginPage | Pública |
| `/register` | RegisterPage | Pública |

---

## Modelo de datos — Supabase PostgreSQL

Schema completo en `supabase-schema.sql`. Todas las tablas tienen RLS habilitado.  
Conectar: `supabase db query --linked "SQL aquí"`

### Tabla `expenses`
```sql
id, user_id, description, amount,
category_id, category_label, category_icon,
payment_method (debit|credit),
date DATE,
receipt_url TEXT,          -- ← agregado; imagen del recibo en Storage
created_at
```

### Tabla `incomes`
```sql
id, user_id, description, amount,
type (recurring|occasional),
times_per_month, pay_days INTEGER[],
is_active, start_date, end_date, date, created_at
```

### Tabla `bills`
```sql
id, user_id, name, category_id, category_label, category_icon,
estimated_amount, estimated_due_date DATE,
real_amount, real_due_date DATE,
is_paid, paid_at, receipt_url,
is_auto_debit, debit_confirmed,
is_recurring, recurrence_period (monthly|bimonthly|quarterly|yearly),
reminder_days INT, created_at, updated_at
```

### Tabla `subscriptions`
```sql
id, user_id, name, currency (COP|USD), amount,
billing_cycle (monthly|yearly|weekly),
next_billing_date DATE, reminder_days,
is_auto_debit, payment_method (debit|credit),
is_active, category_id, category_label, category_icon,
current_cycle_confirmed, last_real_amount_cop,
created_at, updated_at
```

### Tabla `credit_card_charges`
```sql
id, user_id,
source_type (subscription|bill|expense),
source_id UUID, source_name,
category_icon, amount, billing_date DATE,
is_paid, paid_at, created_at
```

### Tabla `categories`
```sql
id, user_id, type (bill|subscription|expense), name, icon, created_at
```

### Tabla `user_config`
```sql
user_id (PK), ai_provider, gemini_api_key, gemini_model, updated_at
```

---

## Storage Supabase

- **Bucket:** `receipts` (público)
- **Ruta:** `{uid}/{timestamp}.{ext}`
- **Acceso:** URLs públicas vía `getPublicUrl`
- **Uso actual:** recibos de facturas (`bills`) y recibos de gastos (`expenses`)

---

## Convención de datos

BD usa `snake_case`; JS/React usa `camelCase`.  
Cada hook tiene función `mapXxx(row)` que traduce. **Siempre usar camelCase en componentes y servicios.**

---

## Lógica de negocio clave

### Módulo de Gastos — Scanner IA + adjuntar imagen

`InvoiceScanner` tiene dos modos según `settings.geminiApiKey`:

| Sin API key Gemini | Con API key Gemini |
|--------------------|--------------------|
| Botón `📎 Adjuntar imagen del recibo` | Botón `📷 Leer factura con IA` |
| Solo adjunta la foto | Analiza imagen + rellena campos + adjunta |

Al guardar el gasto:
1. Si hay imagen capturada → se sube a Supabase Storage → se guarda `receipt_url` con el gasto
2. En la lista de gastos, aparece `📎` clicable junto a gastos con recibo

Gemini extrae **5 campos**: `description`, `amount`, `date`, `categoryId`, `paymentMethod`.

### Módulo de Facturas — Recurrencia

El toggle "🔄 Repetir al pagar" tiene chips visuales: **Mensual / Bimestral / Trimestral / Anual**.  
Al pagar una factura recurrente, `createNextCycle()` crea el siguiente ciclo automáticamente.

### Suscripciones — Canal Realtime único

**IMPORTANTE:** `useCreditCardCharges()` se llama **una sola vez** en `SubscriptionsPage` y los datos se pasan como props a `CreditCardChargesSection`. Nunca llamar el hook dos veces en el mismo árbol de componentes (crearía canales Supabase duplicados).

### Cálculo de presupuesto (`budgetCalculator.js`)

- `summaryCutoff = lastDay` → proyección del mes completo
- `quincenaCutoff = currentDay` → solo lo recibido hasta hoy
- Disponible = `totalIncome - totalFixed - totalSubs`

### TRM (`trmService.js`)

- API: `datos.gov.co/resource/32sa-8pi3.json`
- Cache `localStorage` key `billetera_trm`, renovado diariamente
- Fallback: 4200 COP
- Fórmula USD→COP: `Math.ceil(USD × trm) + 200`

---

## Módulo IA — Gemini

Configuración en `/configuracion`. Tabla `user_config` en Supabase.

Modelos soportados: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`

Campos extraídos del recibo:
- `description` — nombre del comercio
- `amount` — total en COP
- `date` — fecha del documento (YYYY-MM-DD)
- `categoryId` — categoría sugerida (food/transport/health/leisure/shopping/education/home/beauty/other)
- `paymentMethod` — `credit` si detecta VISA/Mastercard/TC, sino `debit`

---

## Variables de entorno (`.env.local`)

```
VITE_SUPABASE_URL=https://gtnqcwgdqbfyyeagyxpr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Trabajo pendiente

1. **Historial de facturas**: No hay tabla `bill_history` en Supabase ni UI de historial.
2. **Convertir a app nativa**: Ver opciones en sección siguiente (Capacitor recomendado).
3. **Notificaciones push**: Para recordatorios de facturas/suscripciones próximas.

---

## Decisiones de diseño importantes

- **Migración Firebase → Supabase (mayo 2025)**: Modelo relacional más limpio, RLS nativo, storage incluido.
- **`user.uid = user.id`**: `AuthContext` agrega `.uid` al objeto user para compatibilidad.
- **Canal Realtime único**: No llamar `useCreditCardCharges` en más de un componente del mismo árbol.
- **`summaryCutoff = lastDay`**: Dashboard muestra proyección del mes completo.
- **Receipt upload no bloquea**: Si falla el upload de imagen, el gasto se guarda igual sin foto.
- **`InvoiceScanner` siempre visible**: Aunque no haya API key, permite adjuntar imagen manualmente.
