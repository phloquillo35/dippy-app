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
- **F17**: Reemplazo de hardcoded colors — ✅ COMPLETADO (25/08/2026, 0 hex en app activa)
- **F19**: Reducción de tabs (8-9 → 5) — ✅ COMPLETADO (25/08/2026, href:null + accesos rápidos)

---

## Pendiente (al 25/08/2026)

### 🟢 F23: Cierre
- `npx tsc --noEmit` → 0 errores ✅ (verificado en macOS 25/08)
- Commit + push de F17/F19

### Notas para próxima sesión
- `(tabs)/` LEGACY aún tiene hex hardcodeados (residuales sin ruta activa) — eliminar carpeta o migrar si se reactiva
- Dark mode parcial: los StyleSheet.create estáticos usan Colors.xxx (solo light); pasarlos a inline con useColors() si se quiere dark mode completo

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
