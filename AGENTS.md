# Dippy App — Estado del proyecto

## Resumen
POS dual-business (Kiosko + Delivery) en React Native + Expo Router, Argentina.

- **GitHub**: `phloquillo35/dippy-app` — rama `main`
- **Último commit**: `762952e` — docs: add AGENTS.md (antes: `84e684d` feat: Phase 2)
- **TypeScript**: 0 errores (`npx tsc --noEmit`)
- **Node**: v20.18.0 en `C:\nodejs\node-v20.18.0-win-x64` (no está en PATH)
- **Git**: `C:\Program Files\Git\cmd\git.exe` (agregar al PATH o usar ruta completa)
- **GitHub token**: Ver `~/.config/opencode/opencode.jsonc` o pedir al usuario

## Arquitectura
```
app/
├── _layout.tsx              # Root layout + ErrorBoundary
├── index.tsx                # Selector de negocio → redirect login si no user
├── onboarding.tsx           # Wizard de primera vez (4 pasos)
├── users/login.tsx          # Login con PIN
├── scanner.tsx              # Escáner de barras
├── metrics.tsx              # Métricas
├── products/add.tsx         # Agregar producto global
├── providers/add.tsx        # Agregar proveedor global
├── providers/[id].tsx       # Detalle proveedor
├── (kiosko)/                # 8 tabs: index, products, cart, cash, users, providers, stock, switch
├── (delivery)/              # 9 tabs: index, menu, cart, orders, cash, users, providers, whatsapp-import, switch
├── (admin)/                 # 6 screens: index, reports, margins, customers, team, reconciliation
└── (tabs)/                  # LEGACY (layout.tsx eliminado, archivos residuales)

src/
├── theme/index.ts           # Colors, Spacing, BorderRadius, ColorPalette (light+dark)
├── theme/ThemeProvider.tsx   # useColors() hook
├── store/                   # 12 stores Zustand: business, cash, cart, deliveryCart, order, product, user, provider, audit, customer, coupon, return
├── services/                # mercadolibre, whatsapp, scale, receipt (PDF), backup (JSON/CSV)
├── utils/                   # uuid, permissions (RBAC 26 permisos), haptics
├── components/              # Button, Card, BarcodeScanner, ErrorBoundary, LoadingStates, SplitPaymentPicker
└── types/index.ts           # Todas las interfaces
```

## Completado

### FASE 0-8 (Core)
- Tipos, stores, navegación dual, todas las pantallas kiosko/delivery/admin
- MercadoLibre API, WhatsApp import, escáner de barras, báscula
- Commit: `23c156d`

### Auditoría (78 issues: 9 critical, 16 high, 25 medium, 28 low)

### 10 Critical Fixes (#1-#10)
1. Login redirect si no `currentUser` + validación PIN
2. Selector de método de pago (5 opciones) en carrito kiosko
3. `createStoreOrder()` en orderStore + `cartStore.confirmStoreOrder`
4. Validación de stock en todos los flujos de agregar al carrito
5. Route guards en layouts kiosko/delivery (businessId + businesses)
6. Admin dashboard usa hooks Zustand en vez de `getState()`
7. `getActiveOrders` incluye status `'delivered'`
8. Eliminado `(tabs)/_layout.tsx` muerto
9. Case `'qr'` en cashStore `addMovement`
10. Validación de dirección en carrito delivery

### 14 Professional Features (F1-F14)
- **F1**: `useAuditStore` — trail de auditoría, 23 acciones
- **F2**: `ErrorBoundary` — componente global
- **F3**: `permissions.ts` — RBAC 26 permisos, 4 roles
- **F4**: `haptics.ts` — wrapper expo-haptics
- **F5**: `useCouponStore` — cupones con validación
- **F6**: Split payments (componente `SplitPaymentPicker` listo)
- **F7**: `useReturnStore` — devoluciones con 5 razones
- **F8**: `(admin)/margins.tsx` — análisis de márgenes
- **F9**: `(admin)/reports.tsx` — reportes históricos + `backup.ts`
- **F10**: `useCustomerStore` — CRUD clientes
- **F11**: `receipt.ts` — PDF recibo vía expo-print
- **F12**: `backup.ts` — backup JSON + CSV export
- **F13**: Admin dashboard con accesos rápidos
- **F14**: Root layout envuelto en ErrorBoundary

### Phase 2 (parcialmente completado)
- **F15**: Onboarding wizard (4 pasos) ✅
- **F16**: SplitPaymentPicker componente ✅
- **F18**: LoadingStates + SkeletonCard ✅
- **F20**: Team dashboard (admin) ✅
- **F21**: Payment reconciliation (admin) ✅
- **F22**: Botón "Finalizar turno" en users screens + fix shift labels ✅
- **F17**: Reemplazo de hardcoded colors — EN PROGRESO (layouts + carts + admin hechos, faltan ~28 archivos)
- **F19**: Reducción de tabs (8-9 → 5) — PENDIENTE

---

## Pendiente (al 25/08/2026)

### 🔴 F17: Reemplazar hardcoded colors (EN PROGRESO — ~50% hecho)
**Ya hecho:** layouts kiosko/delivery/admin, carts kiosko/delivery, todas las pantallas admin, onboarding, index.tsx
**Faltan ~28 archivos** — Sub-agente cancelado a mitad. Revisar cada archivo con `grep` para hex colors y reemplazar.

Archivos pendientes:
- `app/(delivery)/product-detail.tsx`
- `app/(delivery)/products.tsx`
- `app/(delivery)/cash.tsx`
- `app/(delivery)/users.tsx`
- `app/(delivery)/switch.tsx`
- `app/(delivery)/whatsapp-import.tsx`
- `app/(delivery)/menu.tsx`
- `app/(delivery)/orders.tsx`
- `app/(delivery)/add-product.tsx`
- `app/(kiosko)/product-detail.tsx`
- `app/(kiosko)/products.tsx`
- `app/(kiosko)/cash.tsx`
- `app/(kiosko)/users.tsx`
- `app/(kiosko)/switch.tsx`
- `app/(kiosko)/add-product.tsx`
- `app/(kiosko)/providers.tsx`
- `app/(kiosko)/stock.tsx`
- `app/metrics.tsx`
- `app/scanner.tsx`
- `app/providers/[id].tsx`
- `app/providers/add.tsx`
- `app/products/add.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/Button.tsx`
- `src/components/BarcodeScanner.tsx`
- `src/components/Card.tsx`

**Reglas de reemplazo:**
| Hardcoded | Reemplazar con |
|---|---|
| `'#FFF'` / `'#FFFFFF'` (texto en botón) | `colors.textOnPrimary` o `Colors.blanco` |
| `'#E0E0E0'` | `colors.border` o `Colors.grisClaro` |
| `'#F0F0F0'` | `colors.surface` o `Colors.grisClaro` |
| `'#999'` / `'#AAA'` / `'#888'` | `colors.placeholder` o `Colors.grisMedio` |
| `'#333'` / `'#666'` | `colors.textPrimary` / `colors.textSecondary` |
| `'#CCC'` | `Colors.grisMedio` |
| `'#1A1A2E'` | `Colors.negroSuave` |
| `'#25D366'` | `Colors.whatsappGreen` (ya agregado al theme) |
| `'#0096DC'` | `Colors.azulInstitucional` |
| `'#F5F5F5'` | `Colors.grisClaro` |
| `'#444'` | `Colors.grisOscuro` |
| `'#B8860B'` | `Colors.gold` (ya agregado al theme) |
| `'#A31515'` | `Colors.errorDark` (ya agregado al theme) |
| `'#2D7A2D'` | `Colors.successDark` (ya agregado al theme) |

**Nota:** En StyleSheet.create (nivel módulo), usar `Colors.xxx`. En inline styles dentro de componentes con `useColors()`, usar `colors.xxx`.

### 🟡 F19: Reducción de tabs
- Kiosko: 8 tabs → 5 (combinar Proveedores+Stock→Inventario, Users+Caja→Admin)
- Delivery: 9 tabs → 5 (similar)
- Affects: `app/(kiosko)/_layout.tsx`, `app/(delivery)/_layout.tsx`

### 🟢 F23: Verificación final
- `npx tsc --noEmit` → 0 errores
- `git add -A && git commit && git push`
- Agregar screenshots si es posible

---

## Colores del tema (referencia)

```typescript
// Constants
Colors.celesteInstitucional  '#00C8FF'
Colors.azulInstitucional     '#0096DC'
Colors.blanco                '#FFFFFF'
Colors.amarilloAcento        '#FFC800'
Colors.grisClaro             '#E5E5E5'
Colors.grisMedio             '#9E9E9E'
Colors.grisOscuro            '#424242'
Colors.negro                 '#0A0A0F'
Colors.negroSuave            '#1A1A2E'
Colors.exito                 '#3AAA35'
Colors.error                 '#CD1719'
Colors.advertencia           '#EE7203'
Colors.whatsappGreen         '#25D366'
Colors.gold                  '#B8860B'
Colors.errorDark             '#A31515'
Colors.successDark           '#2D7A2D'

// Theme (useColors())
colors.background    light:#FFFFFF  dark:#0A0A0F
colors.card          light:#FFFFFF  dark:#1A1A2E
colors.surface       light:#F8F9FA  dark:#12121A
colors.surfaceVariant light:#E8EDF2 dark:#1E1E2E
colors.textPrimary   light:#0A0A0F  dark:#FFFFFF
colors.textSecondary light:#424242  dark:#B0BEC5
colors.textOnPrimary light:#FFFFFF  dark:#0A0A0F
colors.border        light:#E0E0E0  dark:#2C2C3E
colors.placeholder   light:#9E9E9E  dark:#78909C
colors.disabled      light:#BDBDBD  dark:#546E7A
```

## Comandos útiles
```bash
# Node y Git no están en PATH por defecto, usar:
$env:PATH = "C:\nodejs\node-v20.18.0-win-x64;C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Windows\System32;C:\Windows"

# TypeScript check
npx tsc --noEmit

# Git
git add -A
git commit -m "mensaje"
git push origin main
```
