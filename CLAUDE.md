# Billetera Personal — Contexto del Proyecto

## Descripción general

PWA de gestión de finanzas personales para usuario colombiano. Maneja ingresos recurrentes por quincena, gastos fijos y variables, facturas con estimados vs. reales, y suscripciones en COP/USD con TRM automática.

**Dev server:** `npm run dev` → http://localhost:5173  
**Build/deploy:** `npm run build` → Firebase Hosting (`proyecto-2b6d2`)

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 (PWA via `vite-plugin-pwa`) |
| Routing | react-router-dom v6 |
| Backend | Firebase v10: Auth, Firestore, Storage, Hosting |
| Auth | Email/password + Google (`signInWithRedirect`, NO popup) |
| CSS | Custom properties, mobile-first, bottom nav |

**Importante sobre Google Auth:** Se usa `signInWithRedirect` (no popup) porque popup falla en localhost y móvil. El `vite.config.js` tiene header `Cross-Origin-Opener-Policy: same-origin-allow-popups`. `AuthContext` llama `getRedirectResult(auth)` en el mount para capturar el retorno.

---

## Estructura de archivos

```
src/
├── App.jsx                          # Rutas + PublicRoute + ProtectedRoute
├── main.jsx
├── contexts/
│   └── AuthContext.jsx              # useAuth(), user, loading; escribe doc en users/{uid}
├── pages/
│   ├── DashboardPage.jsx
│   ├── ExpensesPage.jsx             # Navegación mes anterior/siguiente
│   ├── IncomesPage.jsx
│   ├── BillsPage.jsx
│   ├── SubscriptionsPage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx       # Spinner "Cargando..." mientras loading
│   ├── layout/
│   │   ├── Layout.jsx               # Wrapper con header + bottom nav
│   │   └── BottomNav.jsx            # Íconos: Dashboard, Gastos, Ingresos, Facturas, Suscripciones
│   ├── dashboard/
│   │   ├── BudgetSummaryCard.jsx    # Resumen mensual (ingresos - fijos - subs)
│   │   ├── QuincenaCard.jsx         # Progreso de la quincena actual
│   │   ├── RecentExpenses.jsx       # Últimos gastos variables
│   │   └── UpcomingBills.jsx        # Facturas próximas (estimatedDueDate)
│   ├── expenses/
│   │   ├── ExpenseForm.jsx          # Bottom sheet: nuevo gasto
│   │   └── ExpenseList.jsx          # Lista + delete
│   ├── incomes/
│   │   ├── IncomeForm.jsx           # Ingreso recurrente u ocasional
│   │   ├── IncomeList.jsx
│   │   └── DeactivateSheet.jsx      # Marca endDate para desactivar
│   ├── bills/
│   │   ├── BillForm.jsx             # Nueva factura (campos estimados)
│   │   ├── BillList.jsx             # Lista facturas pendientes
│   │   ├── PayBillSheet.jsx         # 2 pasos: confirmar débito → monto real + recibo
│   │   └── CategoryPicker.jsx       # Grid categorías default + custom (Firestore)
│   └── subscriptions/
│       ├── SubscriptionForm.jsx     # Nueva suscripción con vista previa TRM
│       ├── SubscriptionList.jsx     # Lista con badge USD + botón confirmar
│       └── ConfirmDebitSheet.jsx    # Confirmar cobro + ajustar monto real COP
├── hooks/
│   ├── useBudget.js                 # Combina incomes + expenses + subs → calcBudget()
│   ├── useExpenses.js               # Acepta { year, month } para navegación
│   ├── useIncomes.js                # onSnapshot incomes activos del mes
│   ├── useBills.js                  # bills (unpaid) + alertBills + pendingDebits
│   ├── useSubscriptions.js          # subscriptions activas + pendingConfirmations
│   ├── useCategories.js             # Default + user-defined categories de Firestore
│   └── useTRM.js                    # Llama getTRM() al montar
├── services/
│   ├── firebase.js                  # auth, db, storage, googleProvider
│   ├── authService.js               # login/register/logout/loginWithGoogle (redirect)
│   ├── expenseService.js            # addExpense, deleteExpense
│   ├── incomeService.js             # addRecurringIncome, addOccasionalIncome, deactivateIncome, deleteIncome
│   ├── billService.js               # addBill, payBill, confirmDebit, createNextCycle, deleteBill
│   ├── subscriptionService.js       # addSubscription, confirmSubscriptionDebit, advanceBillingCycle, deactivateSubscription
│   ├── categoryService.js           # addCustomCategory, deleteCustomCategory
│   ├── storageService.js            # uploadReceipt → Firebase Storage
│   └── trmService.js                # getTRM() con cache localStorage + usdToCOP()
└── utils/
    ├── budgetCalculator.js          # calcBudget(), progressColor(), receivedPayDays()
    ├── defaultCategories.js         # BILL_CATEGORIES, SUBSCRIPTION_CATEGORIES, findCategory()
    ├── formatters.js                # formatCurrency, formatDate, formatMonthYear, daysUntil
    └── firebaseErrors.js            # Traduce códigos Firebase a español
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
| `/login` | LoginPage | Pública (redirige si ya hay sesión) |
| `/register` | RegisterPage | Pública (redirige si ya hay sesión) |

---

## Modelo de datos Firestore

Todos los datos son sub-colecciones bajo `users/{uid}/...`

### `users/{uid}` (doc raíz)
```
displayName, email, currency: 'COP', createdAt
```

### `users/{uid}/expenses/{id}`
```
description, amount, category, date: Timestamp, isFixed: bool, createdAt
```

### `users/{uid}/incomes/{id}`
```
// Recurrente:
type: 'recurring', description, amount, timesPerMonth, payDays: [1, 15],
isActive: bool, startDate: Timestamp, endDate: Timestamp|null, createdAt

// Ocasional:
type: 'occasional', description, amount, date: Timestamp, createdAt
```

### `users/{uid}/bills/{id}`
```
name, categoryId, categoryLabel, categoryIcon,
estimatedAmount, estimatedDueDate: Timestamp,
realAmount: null|number, realDueDate: null|Timestamp,
isPaid: bool, paidAt: null|Timestamp, receiptUrl: null|string,
isAutoDebit: bool, debitConfirmed: null|bool,
isRecurring: bool, recurrencePeriod: 'monthly'|'bimonthly'|'quarterly'|'yearly'|null,
reminderDays: number (default 3),
createdAt, updatedAt
```

### `users/{uid}/billHistory/{id}` (PENDIENTE — hook existe, service no escribe aquí aún)
```
billId, billName, categoryId,
estimatedAmount, realAmount,
estimatedDueDate, realDueDate,
receiptUrl, paidAt
```

### `users/{uid}/subscriptions/{id}`
```
name, currency: 'COP'|'USD', amount,
billingCycle: 'monthly'|'yearly'|'weekly',
nextBillingDate: Timestamp,
reminderDays: number,
isAutoDebit: bool,
paymentMethod: 'debit'|'credit',
isActive: bool,
categoryId, categoryLabel, categoryIcon,
currentCycleConfirmed: bool,
lastRealAmountCOP: null|number,
createdAt, updatedAt
```

### `users/{uid}/creditCardCharges/{id}`
```
subscriptionId, subscriptionName, categoryIcon,
amount: number (COP),
billingDate: Timestamp,
isPaid: bool,
paidAt: null|Timestamp,
createdAt
```
Se crea automáticamente en `ConfirmDebitSheet` cuando `paymentMethod === 'credit'`.

### `users/{uid}/categories/{id}`
```
type: 'bill'|'subscription', label, icon (emoji), createdAt
```

---

## Lógica de negocio clave

### Cálculo de presupuesto (`budgetCalculator.js`)

- **`summaryCutoff = lastDay`**: El resumen mensual siempre proyecta el mes completo (NO solo hasta hoy). Así el usuario ve lo que recibirá todo el mes.
- **`quincenaCutoff = currentDay`** (solo para mes actual): La quincena solo cuenta lo ya recibido hasta hoy.
- **`receivedPayDays(inc, year, month, cutoffDay)`**: Filtra los `payDays` del ingreso que caen dentro del mes respetando `startDate`, `endDate` y el `cutoffDay`.
- Quincenas: Q1 = días 1–15, Q2 = días 16–31.
- Disponible = `totalIncome - totalFixed - totalSubs`. `monthRemaining = disponible - totalVariable`.

### Facturas (`billService.js`)

- Al crear: solo montos y fechas **estimados**.
- Al pagar (`payBill`): **obligatorio** ingresar `realAmount` y `realDueDate`. Opcionalmente sube recibo a Firebase Storage.
- Débito automático: flujo de 2 pasos en `PayBillSheet` — primero confirmar que el banco debitó (`confirmDebit`), luego registrar real.
- Recurrentes: al pagar se llama `createNextCycle()` que crea nuevo doc con `estimatedAmount = realAmount` anterior y fecha avanzada según `recurrencePeriod`.

### Suscripciones y TRM (`trmService.js`)

- TRM desde API oficial Colombia: `datos.gov.co/resource/32sa-8pi3.json`
- Cache en `localStorage` con key `billetera_trm`, renovado diariamente.
- Fórmula: `Math.ceil(amountUSD * trm) + 200` (200 COP de margen bancario).
- Fallback si la API falla: último valor cacheado o 4200.
- `SubscriptionForm` muestra vista previa del costo en COP en tiempo real.
- `ConfirmDebitSheet` permite ajustar el `lastRealAmountCOP` al confirmar.

### Recordatorios

- **Facturas**: `alertDate = estimatedDueDate - reminderDays`. Si `today >= alertDate` → factura aparece en `alertBills`.
- **Suscripciones**: misma lógica con `nextBillingDate - reminderDays`.
- `pendingDebits` = facturas en alerta con `isAutoDebit && !debitConfirmed`.
- `pendingConfirmations` = suscripciones en alerta con `!currentCycleConfirmed`.

### Categorías personalizadas (`categoryService.js` + `CategoryPicker.jsx`)

- Las categorías default están hardcodeadas en `defaultCategories.js` (8 para bills, 7 para subs).
- El usuario puede crear categorías custom guardadas en `users/{uid}/categories/{id}`.
- `CategoryPicker` muestra grid de defaults + custom, con botón "+ Nueva" para crear inline.

### Receipt upload (`storageService.js`)

- Ruta en Storage: `users/{uid}/receipts/{timestamp}.{ext}`
- Tipos permitidos: jpg, jpeg, png, pdf, webp. Máx 5MB.
- Si falla el upload, `PayBillSheet` muestra error pero permite continuar sin recibo.

---

## Índices Firestore requeridos

Crear en Firebase Console → Firestore → Indexes → Composite:

| Colección | Campo 1 | Campo 2 |
|-----------|---------|---------|
| `users/{uid}/bills` | `isPaid` (Asc) | `estimatedDueDate` (Asc) |
| `users/{uid}/subscriptions` | `isActive` (Asc) | `nextBillingDate` (Asc) |
| `users/{uid}/creditCardCharges` | `isPaid` (Asc) | `createdAt` (Desc) |

---

## Firebase Storage rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Variables de entorno

Archivo `.env.local` en la raíz (NO commitear, ya en `.gitignore`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=proyecto-2b6d2
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Módulo IA — Lectura de facturas (Gemini)

### Flujo
1. Usuario va a **Configuración** (⚙ en el header) → ingresa API Key de Gemini → elige modelo → Guardar
2. Al abrir **Nuevo gasto**, aparece botón "📷 Leer factura con IA"
3. En móvil abre la cámara trasera directamente; en desktop abre el selector de archivo
4. La imagen se envía a Gemini API → extrae `description`, `amount`, `date`
5. Los campos del formulario se auto-rellenan; el usuario puede corregir antes de guardar

### Archivos clave
- `src/services/geminiService.js` — llamada a la API, conversión a base64, parseo JSON
- `src/services/settingsService.js` — guarda/elimina key en `users/{uid}/config/ai`
- `src/hooks/useSettings.js` — reactivo con onSnapshot
- `src/components/expenses/InvoiceScanner.jsx` — botón cámara + lógica
- `src/pages/SettingsPage.jsx` — panel de configuración IA

### Datos Firestore
`users/{uid}/config/ai`:
```
aiProvider: 'gemini',
geminiApiKey: 'AIza...',
geminiModel: 'gemini-1.5-flash' | 'gemini-1.5-pro'
```

### Nota de seguridad
La API key se guarda en Firestore bajo el uid del usuario (no en el código). Solo el usuario autenticado puede leerla (reglas de Firestore). No commitear al git.

## Trabajo pendiente

1. **historial de facturas**: El hook `useBillHistory` existe en `useBills.js` y consulta `users/{uid}/billHistory`, pero `billService.payBill()` **no escribe** en esa colección todavía. Falta agregar un `addDoc` a `billHistory` dentro de `payBill()`.

2. **Vista de historial**: No hay UI para mostrar el historial de pagos de una factura.

3. **Firebase Storage**: Debe estar habilitado manualmente en Firebase Console con las reglas de arriba antes de que funcione el upload de recibos.

---

## Decisiones de diseño importantes

- **`signInWithRedirect` no popup**: popup bloqueado en localhost y móviles; el redirect captura bien con `getRedirectResult` en el mount de `AuthContext`.
- **`summaryCutoff = lastDay`**: corrección aplicada porque el dashboard mostraba $0 cuando los `payDays` caían después del día actual del mes.
- **Estimados obligatorios en facturas**: el sistema siempre tiene un monto/fecha estimados; los reales solo se ingresan al pagar.
- **Ciclo siguiente automático**: `createNextCycle` usa `realAmount` como nuevo `estimatedAmount`, aprendiendo del pago anterior.
- **Sin mock en tests**: los tests deben usar Firestore real (si aplica en el futuro).
