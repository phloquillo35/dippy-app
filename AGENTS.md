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

### ✅ Auditoría completa (25/08/2026, sesión macOS)
- **Suite de pruebas**: `npm test` (scripts/logic-test.ts con tsx) — **50/50 pasan**
- `npx tsc --noEmit` → 0 errores · bundle web compila sin errores

**Bugs reparados:**
1. 🔴 CRÍTICO — `setCustomerInfo` del carrito delivery ignoraba los datos (mapeo name/phone/address ≠ customerName/...): los pedidos se guardaban sin cliente. Ahora mapea bien y el pedido lleva nombre/tel/dirección.
2. Descuento del carrito delivery no llegaba a la orden (`createOrder` ahora recibe `discount`).
3. Ventas delivery marcadas "Vendido" no registraban en Caja → ahora `markAsSold` registra el ingreso (idempotente).
4. Sobreventa en carritos: `addItem` valida stock acumulado (retorna ok/capped/no_stock) + alertas en pantallas.
5. `cancelOrder` duplicable (restauraba stock 2 veces) → guard.
6. `Alert.prompt` (solo iOS) en login PIN → modal propio multiplataforma.
7. Rutas muertas a `/(tabs)/` eliminado en products/[id], scanner, metrics + carpeta legacy borrada.
8. Regex WhatsApp `importFromWhatsApp` no parseaba "2x producto".

**Features conectadas (estaban creadas pero muertas):**
- Auditoría (`auditStore`) integrada en ventas/pedidos/caja/login/turnos/stock/proveedores
- Cupones: nueva pantalla admin `(admin)/coupons.tsx` (crear/listar/desactivar)
- Devoluciones: nueva pantalla admin `(admin)/returns.tsx` (procesa reembolso + repone stock + egreso en caja)
- Clientes: auto-registro al confirmar pedido delivery (por teléfono) con acumulados
- Recibo PDF: opción "Imprimir recibo" tras venta kiosko
- Backup: botón en panel admin (JSON completo vía Sharing)
- Split payment: componente reescrito (antes era stub) + integrado al carrito kiosko (múltiples métodos → múltiples movimientos de caja)
- Pagos a proveedores ahora registran egreso en caja (supplier_payment) + auditoría

**Pendiente conocido:**
- Servicio `mercadolibre.ts` sigue sin UI (requiere credenciales ML) — futuro
- Dark mode parcial en StyleSheets estáticos (Colors.xxx solo light)
- `products/[id].tsx` agrega al carrito del negocio activo; revisar UX si se usa fuera de un negocio

---

## Rediseño UX (25/08/2026)

Objetivo: cumplir requisitos de Marta (login todos, flujo delivery intuitivo, hub kiosko con
escáner + catálogo, dashboard maestro con métricas, tab bars claras). Decisiones aprobadas:
Hub en pestaña "Vender"; pago delivery inmediato (efectivo/transferencia/tarjeta/MercadoPago) +
contraentrega.

**Completado:**
- **Login**: `userStore` con PINs seed (admin-1=0000, cajero-1=1234, cajero-2=2345, dual-1=3456,
  ayudante-1=4567); `login()` matchea por email o id; persist `version:2` + `merge` inyecta PIN a
  usuarios ya persistidos. `login.tsx` usa modal propio multiplataforma.
- **Kiosko hub** (`app/(kiosko)/cart.tsx`): buscador + botón "Escanear" → `/scanner` (auto-agrega en
  scan, sigue escaneando) + catálogo horizontal visible + carrito con `−/+`/cantidad editable +
  cupón/descuento/dividido/cobrar. `app/scanner.tsx` auto-add no-pesable + banner flash.
- **Delivery** (`menu.tsx`/`cart.tsx`/`index.tsx`): "Nuevo pedido" → menú (filas → `product-detail`,
  `+`→`add-product`), carrito en 4 pasos (items→cliente→pago→confirmar) con autocompletar cliente por
  teléfono; pago inmediato vía `confirmOrder(..., paymentMethod, paidNow)` → `markAsSold` si paidNow.
- **Dashboard maestro** (`app/(admin)/index.tsx`): selector Hoy/7d/Mes, KPIs por negocio (ingresos,
  ganancia, ticket promedio, items, gastos), top productos, método de pago, stock bajo, top clientes.
- **Tab bars** (`(kiosko)/_layout.tsx`, `(delivery)/_layout.tsx`): etiqueta única + badge sobre icono,
  renombres (kiosko products→Almacén/cart→Vender; delivery cart→Pedido).
- Verificado: `tsc` 0 errores, `npm test` 50/50, Metro bundlea sin errores nativos.

**Pendiente:**
- **Iconos vectoriales**: `@expo/vector-icons` (Ionicons) requiere módulo nativo `expo-font`, ausente
  en el dev build (`com.dippy.app`) del simulador → se revirtió a **emoji** en tabs/hub/menú. Para
  vector icons reales: reconstruir dev build (`npx expo run:ios`) tras instalar `expo-font` (ya en
  package.json + plugin en app.json).
- Rebuild del dev build nativo para incluir `expo-font` y validar iconos vectoriales en simulador.

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

# Typecheck
npm run typecheck

# Tests de lógica (50 checks de stores/flujos)
npm test

# Git
git add -A
git commit -m "mensaje"
git push origin main
```
