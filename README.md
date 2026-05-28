# Billetera Personal

PWA de gestión de finanzas personales para usuario colombiano. Maneja ingresos por quincena, facturas fijas y recurrentes, gastos variables y suscripciones en COP/USD con TRM automática.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| PWA | `vite-plugin-pwa` |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| IA | Google Gemini API (escaneo de facturas) |
| TRM | API datos abiertos Colombia (`datos.gov.co`) |

---

## Funcionalidades

- **Dashboard** — resumen mensual y por quincena: ingresos, facturas fijas, disponible variable
- **Gastos** — registro con escáner IA (Gemini), adjunto de recibo, navegación por mes, edición y eliminación
- **Ingresos** — ingresos recurrentes (quincenales) e ingresos adicionales ocasionales
- **Facturas** — CRUD completo de facturas únicas y recurrentes (semanal/mensual/bimestral/trimestral/anual), soporte COP y USD, recordatorios configurables. Al pagar una factura se genera automáticamente un gasto vinculado (`bill_id`) con trazabilidad completa
- **Configuración** — integración con Gemini API para escaneo inteligente de recibos

---

## Estructura del proyecto

```
src/
├── pages/          # DashboardPage, ExpensesPage, IncomesPage, BillsPage, SettingsPage
├── components/
│   ├── bills/      # BillForm, BillList, PayBillSheet, CategoryPicker
│   ├── expenses/   # ExpenseForm (create + edit), ExpenseList, InvoiceScanner
│   ├── incomes/    # IncomeForm, IncomeList, DeactivateSheet
│   ├── dashboard/  # BudgetSummaryCard, QuincenaCard, UpcomingBills, RecentExpenses
│   ├── layout/     # Layout, BottomNav
│   └── auth/       # LoginForm, RegisterForm, ProtectedRoute
├── hooks/          # useBills, useExpenses, useIncomes, useBudget, useTRM, useCategories, useSettings
├── services/       # supabase, billService, expenseService, authService, geminiService, trmService...
└── utils/          # budgetCalculator, formatters, defaultCategories
```

---

## Base de datos (Supabase PostgreSQL)

Schema completo en [`supabase-schema.sql`](./supabase-schema.sql).

### Tablas principales

| Tabla | Descripción |
|---|---|
| `bills` | Facturas únicas y recurrentes (unifica el módulo de suscripciones) |
| `expenses` | Gastos variables + pagos de facturas (campo `bill_id` para trazabilidad) |
| `incomes` | Ingresos recurrentes y ocasionales |
| `categories` | Categorías personalizadas por usuario |
| `user_config` | Configuración de IA (Gemini API key y modelo) |

### Campos clave de `bills`

```
due_date          — fecha de vencimiento (concepto único)
estimated_amount  — monto estimado
payment_method    — debit | credit
currency          — COP | USD
is_recurring      — si avanza el ciclo automáticamente al pagar
recurrence_period — weekly | monthly | bimonthly | quarterly | yearly
reminder_days     — días de anticipación para la alerta
```

---

## Instalación

```bash
# Clonar y instalar dependencias
git clone <repo>
cd billetera-personal
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### Variables de entorno

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

### Inicializar la base de datos

```bash
# Pegar el contenido de supabase-schema.sql en Supabase → SQL Editor → Run
```

---

## Desarrollo

```bash
npm run dev      # servidor en http://localhost:5173
npm run build    # build de producción
npm run preview  # previsualizar build
```

---

## Flujo de pago de facturas

```
Usuario → "Pagar" en factura
  → PayBillSheet (monto real, fecha, método de pago, recibo opcional)
  → Crea registro en expenses (con bill_id → trazabilidad)
  → Si recurrente: avanza due_date al siguiente ciclo
  → Si única: marca is_paid = true
  → Navega a /gastos (el pago queda visible con badge 📋)
  → Desde Gastos: editar o eliminar el pago si hubo un error
```

---

## IA — Escaneo de facturas (Gemini)

Configurable en `/configuracion`. Extrae automáticamente del recibo:

- Descripción (nombre del comercio)
- Monto total en COP
- Fecha
- Categoría sugerida
- Método de pago (detecta VISA/Mastercard → crédito)

Modelos soportados: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`

Sin API key configurada, el escáner permite adjuntar la imagen del recibo manualmente.

---

## TRM automática

Fuente: API oficial del Banco de la República vía `datos.gov.co`.
Cache diario en `localStorage`. Fallback: $4.200 COP.
Fórmula USD → COP: `Math.ceil(monto × TRM) + $200`.

---

## Deploy

```bash
npm run build
firebase deploy   # Firebase Hosting
```

---

## Decisiones de arquitectura

- **Canal Realtime único por tabla**: `DashboardPage` no llama `useBills()` directamente; obtiene los datos desde `useBudget()` para evitar canales duplicados.
- **`REPLICA IDENTITY FULL`** en todas las tablas: necesario para que los eventos `DELETE` de Supabase Realtime incluyan todas las columnas y el filtro `user_id` funcione correctamente.
- **Confirmación inline** en lugar de `window.confirm`: los diálogos nativos están bloqueados en modo PWA standalone.
- **Pago de factura = gasto**: el historial oficial de pagos vive en `expenses` con `bill_id`, no en `bills`. Para deshacer un pago, eliminar el gasto desde el módulo Gastos.
- **`totalFixed` en presupuesto**: las facturas recurrentes reemplazan el concepto de "suscripciones" en el cálculo del presupuesto mensual.
