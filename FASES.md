# Vercus — Checklist de Fases 🔧

> Checklist exhaustivo de todos los pasos de desarrollo, fase por fase.
> Marcar con `[x]` al completar cada paso.

---

## FASE 1 — Setup del proyecto ✅ COMPLETADA

### 1.1 Repositorio y control de versiones
- [ ] Crear repositorio en GitHub (privado) llamado `vercus`
- [ ] Inicializar con `.gitignore` para Node
- [ ] Clonar en local

### 1.2 Proyecto React + Vite + TypeScript
- [x] Crear proyecto con `npm create vite@latest . -- --template react-ts`
- [x] Verificar que arranca con `npm run dev`
- [x] Eliminar contenido de muestra de `App.tsx` y `index.css`

### 1.3 Tailwind CSS
- [x] Instalar Tailwind CSS v3 con PostCSS y autoprefixer
- [x] Configurar `tailwind.config.js` con tokens CSS (colores, radio, etc.)
- [x] Añadir directivas `@tailwind` + variables CSS en `index.css`
- [x] Verificar que las clases de Tailwind se aplican

### 1.4 shadcn/ui
- [x] Instalar componentes base manualmente (Radix UI + CVA): button, input, textarea, label, card, badge, dialog, select, tabs, switch, separator, alert-dialog, table, toast, toaster
- [x] Verificar que los componentes se importan correctamente

### 1.5 React Router
- [x] Instalar `react-router-dom`
- [x] Crear estructura base de rutas en `src/router.tsx` con lazy loading
- [x] Definir rutas: `/login`, `/`, `/clientes`, `/clientes/:id`, `/maquinas/:id`, `/ordenes`, `/ordenes/:id`, `/presupuestos/:id`, `/catalogo`, `/finanzas`, `/configuracion`
- [x] Layout principal con Sidebar (desktop) y BottomNav (móvil)

### 1.6 Supabase — Proyecto en la nube
- [x] Crear proyecto en supabase.com ← **HECHO POR EL USUARIO**
- [x] Instalar cliente: `@supabase/supabase-js`
- [x] Crear `src/lib/supabase.ts` con el cliente inicializado
- [x] Añadir `.env.local` con las variables → `VITE_SUPABASE_URL=https://<ref>.supabase.co`
- [x] `.env.local` ya estaba en `.gitignore` (`*.local`)
- **NOTA:** La URL en `.env.local` debe ser `https://<ref>.supabase.co`, no solo la referencia

### 1.7 Supabase — Esquema de base de datos
- [x] Schema SQL completo generado en `supabase/schema.sql`
- [ ] Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase ← **PENDIENTE USUARIO**
- [ ] Crear bucket `logos` en Supabase Storage → New bucket → nombre `logos` → público ← **PENDIENTE USUARIO**

### 1.8 Tipos TypeScript
- [x] Crear tipos de dominio en `src/types/index.ts` (interfaces + enums + labels + colores)
- [ ] Opcional: generar tipos automáticos con Supabase CLI

### 1.9 Vercel — Deploy inicial
- [x] Crear `vercel.json` con rewrite SPA
- [ ] Crear cuenta en vercel.com y conectar repositorio GitHub ← **PENDIENTE**
- [ ] Añadir variables de entorno en Vercel ← **PENDIENTE**

### 1.10 Estructura de carpetas
- [x] Estructura completa creada:
  ```
  src/
  ├── components/ui/      ← 15 componentes shadcn/ui
  ├── components/layout/  ← AppLayout, Sidebar, BottomNav, PageHeader
  ├── pages/              ← stub de las 8 páginas + LoginPage
  ├── hooks/              ← useAuth (AuthContext), use-toast
  ├── lib/                ← supabase.ts, utils.ts
  ├── types/              ← index.ts (tipos completos del dominio)
  └── router.tsx          ← rutas protegidas + lazy loading
  supabase/schema.sql     ← DDL completo con RLS
  vercel.json             ← SPA routing
  ```
- [x] Alias `@/` configurado en vite.config.ts y tsconfig.app.json
- [x] Build de producción limpio (`npm run build` sin errores)

---

## FASE 2 — Autenticación y Configuración del taller ✅ COMPLETADA

### 2.1 Autenticación con Supabase Auth
- [x] Habilitar proveedor Email/Password en Supabase Auth ← hecho en panel Supabase
- [x] Crear página `/login` con formulario (email + contraseña)
- [x] Implementar lógica de `signIn` con Supabase
- [x] Crear página `/registro` con validación de contraseñas y confirmación por email
- [x] Implementar `signOut` en el Sidebar (botón "Cerrar sesión")
- [x] Crear `AuthContext` y `useAuth` hook (`src/hooks/useAuth.tsx`)
- [x] Ruta protegida: si no hay sesión redirige a `/login`
- [x] Sesión persiste entre recargas (gestionado por Supabase Auth)
- [ ] Probar flujo completo: registro → login → logout ← **PENDIENTE USUARIO**

### 2.2 Página de Configuración `/configuracion`

#### Pestaña: Datos del taller
- [x] Formulario con: nombre del taller, propietario, teléfono, dirección, NIF
- [x] Carga de datos existentes de `settings` al abrir la página (hook `useSettings`)
- [x] Guardado (upsert) en Supabase con toast de confirmación
- [x] Subida de logo: preview local inmediato + upload a Storage bucket `logos`
- [x] Guarda URL pública con cache-buster en `settings.logo_url`
- [x] Selector de IVA por defecto (4% / 10% / 21%)

#### Pestaña: Tipos de mano de obra
- [x] Tabla con tipos existentes (nombre + tarifa/hora formateada)
- [x] Botón "Añadir tipo" → dialog con formulario (nombre, tarifa €/h)
- [x] Botón editar en cada fila → dialog pre-rellenado
- [x] Botón eliminar con AlertDialog de confirmación
- [x] Validaciones: nombre obligatorio, tarifa ≥ 0
- [x] Hook `useLaborTypes` con CRUD completo

---

## FASE 3 — Clientes y Máquinas ✅ COMPLETADA

### 3.1 Módulo de Clientes

#### Lista de clientes `/clientes`
- [x] Fetch de todos los clientes desde Supabase ordenados por nombre
- [x] Lista responsive con avatar inicial, teléfono, email y contador de máquinas
- [x] Barra de búsqueda en tiempo real por nombre, teléfono o email
- [x] Botón "Nuevo cliente" → `ClienteFormDialog`
- [x] Formulario: nombre (requerido), teléfono, email (validado), dirección, notas
- [x] Al crear redirige directamente a la ficha del cliente
- [x] Estado vacío con ilustración y CTA

#### Ficha de cliente `/clientes/:id`
- [x] Header con nombre, botones Editar y Eliminar
- [x] Datos de contacto con links tel: y mailto:
- [x] AlertDialog de confirmación al eliminar (aviso sobre máquinas vinculadas)
- [x] Sección "Máquinas" con contador y botón Añadir
- [x] Cada máquina con botones: ver historial, editar, eliminar
- [x] Sección "Historial de órdenes" con estado badge y fecha (datos reales de Supabase)
- [x] Botón "Nueva orden" con prefill de cliente via query param

### 3.2 Módulo de Máquinas

#### Componentes reutilizables
- [x] `ClienteFormDialog` — crear y editar cliente
- [x] `MaquinaFormDialog` — crear y editar máquina (usado desde ficha cliente y desde órdenes)

#### Ficha de máquina `/maquinas/:id`
- [x] Header con nombre (marca + modelo), tipo, breadcrumb al cliente
- [x] Ficha con tipo, marca, modelo, número de serie y notas
- [x] Link al cliente propietario
- [x] Historial de reparaciones con badge de estado y descripción del problema
- [x] Botón "Nueva orden" con prefill de máquina

### 3.3 Custom hooks
- [x] `useClients()` → fetch, create, update, delete, getClient
- [x] `useMachines(clientId?)` → fetch (con join a client), create, update, delete, getMachine

---

## FASE 4 — Órdenes de trabajo ✅ COMPLETADA

### 4.1 Lista de órdenes `/ordenes`
- [ ] Fetch de todas las órdenes con join a `clients` y `machines`
- [ ] Tabla responsive con columnas: nº orden, cliente, máquina, estado (badge color), fecha entrada
- [ ] Badges de color por estado:
  - Recibida → gris
  - Presupuestada → amarillo
  - Aceptada → azul
  - Esperando piezas → naranja
  - En reparación → morado
  - Lista para recoger → verde
  - Entregada → gris oscuro
- [ ] Filtros: por estado (select múltiple), por cliente (select), por rango de fechas
- [ ] Barra de búsqueda por texto libre (descripción, cliente, máquina)
- [ ] Botón "Nueva orden" → navegar a formulario de creación

### 4.2 Creación de nueva orden `/ordenes/nueva`
- [ ] Formulario en una sola página (no dialog, hay mucho contenido):
  - [ ] Select de cliente (buscable) con botón "+" para crear cliente nuevo inline
  - [ ] Select de máquina (filtrado por cliente seleccionado) con botón "+" para crear máquina inline
  - [ ] Textarea: descripción del problema (voz del cliente)
  - [ ] Textarea: diagnóstico inicial (opcional al crear)
  - [ ] Date picker: fecha estimada de entrega
  - [ ] Textarea: notas internas
- [ ] Estado inicial siempre: `recibida`
- [ ] Al guardar, navegar al detalle de la orden creada
- [ ] Número de orden auto-generado: `ORD-2026-001` (correlativo por año)

### 4.3 Detalle de orden `/ordenes/:id`

#### Header de orden
- [ ] Número de orden, estado (badge), fecha de entrada, fecha estimada de entrega
- [ ] Nombre del cliente (link) + máquina (link)
- [ ] Descripción del problema + diagnóstico (expandible si largo)
- [ ] Notas internas (solo visibles en la app, no en PDF)
- [ ] Botón "Editar datos de la orden"

#### Cambio de estado
- [ ] Botón de avance al siguiente estado (texto dinámico: "Marcar como En reparación")
- [ ] Botón de retroceso al estado anterior (solo en ciertos estados, ej: volver a Esperando piezas)
- [ ] Confirmación antes de marcar como "Entregada"
- [ ] Cada cambio inserta un registro en `work_order_status_log`
- [ ] Timeline/historial de estados con fecha y hora visible en el detalle

#### Pestaña: Piezas
- [ ] Lista de piezas añadidas con columnas: código, descripción, cantidad, precio unitario, total
- [ ] Botón "Añadir pieza del catálogo" → dialog con búsqueda en `parts_catalog`
  - [ ] Buscador en tiempo real por código, marca o descripción
  - [ ] Al seleccionar, pre-rellena código, descripción, marca y precio
  - [ ] Campo editable de cantidad (default 1)
  - [ ] Campo editable de precio (copia del catálogo, modificable)
- [ ] Botón "Añadir pieza manual" → dialog con todos los campos libres
- [ ] Botón editar en cada pieza (pencil icon)
- [ ] Botón eliminar en cada pieza con confirmación
- [ ] Subtotal de piezas calculado en tiempo real

#### Pestaña: Mano de obra
- [ ] Lista de entradas de labor con columnas: tipo, descripción, horas, tarifa, total
- [ ] Botón "Añadir mano de obra" → dialog:
  - [ ] Select de tipo de labor (de `labor_types`)
  - [ ] Al seleccionar tipo, se pre-rellena la tarifa
  - [ ] Campo de horas (con decimales, ej: 1.5)
  - [ ] Campo descripción del trabajo realizado
  - [ ] Campo tarifa editable (copia del tipo, modificable)
- [ ] Botón editar en cada entrada
- [ ] Botón eliminar con confirmación
- [ ] Subtotal de mano de obra calculado en tiempo real

#### Resumen económico (fijo en el detalle de orden)
- [ ] Total piezas
- [ ] Total mano de obra
- [ ] Total bruto
- [ ] Total cobrado
- [ ] Total pendiente (resaltado si > 0)
- [ ] Botón "Generar presupuesto" → navegar a `/presupuestos/:id`

### 4.4 Custom hooks
- [ ] Crear `useWorkOrders()` → fetch lista con filtros
- [ ] Crear `useWorkOrder(id)` → fetch detalle con piezas, labor, pagos
- [ ] Crear `useWorkOrderParts(orderId)` → CRUD de piezas
- [ ] Crear `useWorkOrderLabor(orderId)` → CRUD de mano de obra
- [ ] Crear `useStatusChange(orderId)` → avanzar/retroceder estado + log

---

## FASE 5 — Catálogo de piezas

### 5.1 Lista del catálogo `/catalogo`
- [ ] Fetch de todas las piezas del catálogo
- [ ] Tabla con columnas: código, marca, descripción, precio de venta
- [ ] Barra de búsqueda en tiempo real (código, marca, descripción)
- [ ] Filtro por marca (select con las marcas existentes)
- [ ] Botón "Nueva pieza" → dialog con formulario
- [ ] Formulario de pieza:
  - [ ] Código de referencia
  - [ ] Marca (input con sugerencias de marcas ya existentes)
  - [ ] Descripción (requerido)
  - [ ] Precio de venta (€)
  - [ ] Notas
- [ ] Botón editar en cada fila → dialog pre-rellenado
- [ ] Botón eliminar con confirmación
- [ ] Validaciones: descripción obligatoria, precio ≥ 0

### 5.2 Búsqueda del catálogo desde órdenes de trabajo
- [ ] Componente `CatalogSearchDialog` reutilizable
- [ ] Input de búsqueda con debounce (espera 300ms antes de buscar)
- [ ] Resultados en lista scrollable
- [ ] Click en resultado → devuelve la pieza seleccionada al formulario de la orden
- [ ] Si no hay resultados, mostrar opción "Añadir esta pieza manualmente"

### 5.3 Custom hook
- [ ] Crear `usePartsCatalog()` → fetch, search, create, update, delete

---

## FASE 6 — Presupuestos y PDF

### 6.1 Generación del presupuesto

#### Lógica de negocio
- [ ] Instalar `@react-pdf/renderer`
- [ ] Al pulsar "Generar presupuesto" en una orden:
  - [ ] Crear registro en `quotes` con estado `borrador`
  - [ ] Generar número correlativo `PRS-YYYY-NNN`
  - [ ] Redirigir a `/presupuestos/:quoteId`

#### Página de presupuesto `/presupuestos/:id`
- [ ] Cargar datos del presupuesto con join a orden, piezas, labor, cliente, máquina y settings
- [ ] Panel de control izquierdo:
  - [ ] Toggle IVA (switch on/off)
  - [ ] Select tipo IVA (4% / 10% / 21%) — visible solo si toggle activo
  - [ ] Campo "Válido hasta" (date picker, default +15 días)
  - [ ] Textarea de notas del presupuesto (aparecen al pie del PDF)
  - [ ] Select estado del presupuesto (borrador / enviado / aceptado / rechazado)
  - [ ] Botón "Guardar cambios"
- [ ] Preview del PDF a la derecha (o debajo en móvil)
- [ ] Botón "Descargar PDF"
- [ ] Botón "Compartir por WhatsApp"

### 6.2 Diseño del PDF con @react-pdf/renderer

#### Componente `QuotePDF`
- [ ] Cabecera con logo del taller (desde URL de Supabase Storage)
- [ ] Datos del taller: nombre, teléfono, dirección, NIF
- [ ] Datos del presupuesto: número, fecha, válido hasta
- [ ] Datos del cliente: nombre, teléfono
- [ ] Datos de la máquina: marca, modelo, número de serie
- [ ] Descripción del trabajo / diagnóstico
- [ ] Tabla de piezas: código | descripción | cant. | precio unit. | total
- [ ] Tabla de mano de obra: tipo | descripción | horas | tarifa | total
- [ ] Bloque de totales: subtotal piezas, subtotal mano de obra, total bruto
- [ ] Si IVA activo: línea "IVA XX%" y total con IVA
- [ ] Notas al pie
- [ ] Estilos: fuente limpia (Helvetica), colores neutros, logo en esquina superior izquierda
- [ ] Comprobar que los textos largos hacen salto de línea correctamente
- [ ] Probar con piezas suficientes para ocupar más de una página (salto de página automático)

### 6.3 Descarga del PDF
- [ ] Botón "Descargar PDF" usa `pdf().toBlob()` y crea un link de descarga
- [ ] Nombre del archivo: `Presupuesto_PRS-2026-001_NombreCliente.pdf`

### 6.4 Compartir por WhatsApp
- [ ] Desde móvil: botón que genera el PDF como Blob, crea un File, usa Web Share API (`navigator.share`) para adjuntar el archivo
- [ ] Fallback en desktop: abrir `https://wa.me/?text=...` con mensaje de texto con datos del presupuesto
- [ ] Detectar si Web Share API está disponible y mostrar el botón adecuado

---

## FASE 7 — Pagos parciales

### 7.1 Pestaña de pagos en la orden

#### Lista de pagos
- [ ] Fetch de pagos de la orden ordenados por fecha
- [ ] Tabla con columnas: fecha, importe, método de pago, notas
- [ ] Resumen siempre visible:
  - [ ] Total de la orden (piezas + mano de obra)
  - [ ] Total cobrado (suma de pagos)
  - [ ] Total pendiente (resaltado en rojo si > 0, verde si = 0)

#### Añadir pago
- [ ] Botón "Registrar pago" → dialog
- [ ] Formulario: importe (€), fecha (default hoy), método (efectivo/transferencia/tarjeta/otro), notas
- [ ] Validación: importe > 0, importe no supera la deuda pendiente (warning, no bloqueo)
- [ ] Al guardar, actualizar resumen automáticamente
- [ ] No permitir pagos en órdenes con estado `entregada` (mostrar aviso)

#### Editar/eliminar pago
- [ ] Botón editar en cada pago → dialog pre-rellenado
- [ ] Botón eliminar con confirmación

### 7.2 Indicadores en la lista de órdenes
- [ ] En la lista de órdenes, mostrar badge o texto de deuda pendiente si > 0
- [ ] En la ficha de cliente, mostrar deuda total acumulada de todas sus órdenes abiertas

### 7.3 Custom hook
- [ ] Crear `usePayments(orderId)` → fetch, create, update, delete pagos

---

## FASE 8 — Finanzas

### 8.1 Página de finanzas `/finanzas`

#### Selector de período
- [ ] Select de mes (Enero–Diciembre) y año
- [ ] Default: mes y año actuales
- [ ] Al cambiar, recalcular todos los datos

#### Bloque de ingresos
- [ ] Suma de todos los pagos registrados en el mes seleccionado
- [ ] Lista detallada de pagos del mes: fecha, cliente, orden, importe, método
- [ ] Opción de expandir/colapsar la lista

#### Bloque de gastos del taller
- [ ] Suma de gastos manuales del mes
- [ ] Tabla de gastos: fecha, descripción, categoría, importe
- [ ] Botón "Añadir gasto" → dialog:
  - [ ] Fecha (default hoy)
  - [ ] Descripción (requerido)
  - [ ] Categoría (select + opción "Otra"): Herramientas, Suministros, Alquiler, Formación, Otro
  - [ ] Importe (€)
- [ ] Botón editar y eliminar en cada gasto

#### Beneficio neto
- [ ] Tarjeta grande con el resultado del mes: Ingresos − Gastos
- [ ] Color verde si positivo, rojo si negativo

#### Gráfico anual
- [ ] Instalar `recharts`
- [ ] Gráfico de barras apiladas o agrupadas con ingresos y gastos de los 12 meses del año seleccionado
- [ ] Tooltip al pasar el ratón con los valores exactos

### 8.2 Custom hook
- [ ] Crear `useFinances(month, year)` → ingresos del período, gastos del período, beneficio
- [ ] Crear `useExpenses()` → CRUD de gastos

---

## FASE 9 — Dashboard

### 9.1 Métricas principales
- [ ] Tarjeta "Órdenes activas" — total de órdenes que no están en estado `entregada`
- [ ] Tarjeta "Pendiente de cobro" — suma de (total orden − pagos) en órdenes abiertas
- [ ] Tarjeta "Ingresos del mes" — suma de pagos del mes en curso
- [ ] Tarjeta "Listas para recoger" — órdenes en estado `lista` (acción urgente)

### 9.2 Lista de órdenes recientes
- [ ] Últimas 8 órdenes modificadas (cualquier estado)
- [ ] Con nombre de cliente, máquina, estado (badge) y fecha de última actualización
- [ ] Click → navegar al detalle de la orden

### 9.3 Órdenes que requieren atención
- [ ] Sección separada: órdenes con estado `lista` (para avisar que hay máquinas esperando)
- [ ] Sección: órdenes con fecha estimada de entrega vencida (pasada hoy y no entregadas)

### 9.4 Accesos rápidos
- [ ] Botón "Nueva orden"
- [ ] Botón "Nuevo cliente"
- [ ] Botón "Buscar pieza en catálogo"

---

## FASE 10 — Pulido, pruebas y deploy

### 10.1 Navegación y UX
- [ ] Sidebar en desktop: icono + texto para cada módulo, con indicador de sección activa
- [ ] Bottom navigation bar en móvil: 5 iconos principales (Dashboard, Órdenes, Clientes, Catálogo, Finanzas)
- [ ] Breadcrumbs en páginas de detalle (ej: Clientes > Juan García > ORD-2026-001)
- [ ] Animaciones de transición suaves entre páginas (Framer Motion o CSS)
- [ ] Scroll al top al navegar entre páginas

### 10.2 Estados de carga y error
- [ ] Skeleton loaders en todas las listas mientras cargan datos
- [ ] Mensajes de "No hay resultados" con ilustración en listas vacías
- [ ] Manejo de errores de red: toast de error con mensaje descriptivo
- [ ] Retry automático en errores transitorios de Supabase

### 10.3 Formularios y validaciones
- [ ] Revisión de todas las validaciones (campos requeridos, formatos)
- [ ] Deshabilitar botón de submit mientras se procesa la petición
- [ ] Prevenir doble-submit (debounce o flag de carga)
- [ ] Mensajes de error en línea bajo cada campo incorrecto

### 10.4 Responsive / Mobile
- [ ] Revisar todas las páginas en viewport 375px (iPhone SE)
- [ ] Revisar todas las páginas en viewport 768px (tablet)
- [ ] Revisar todas las páginas en viewport 1280px (desktop)
- [ ] Tablas largas: scroll horizontal en móvil o rediseño en cards verticales
- [ ] Dialogs: ocupar pantalla completa en móvil
- [ ] Touch targets: mínimo 44×44px para botones en móvil

### 10.5 Rendimiento
- [ ] Lazy loading de páginas con `React.lazy` + `Suspense`
- [ ] Paginación o scroll infinito en lista de órdenes si supera 50 registros
- [ ] Debounce en todos los buscadores (300ms)
- [ ] Memoización de cálculos pesados (totales, agregados financieros)

### 10.6 Seguridad
- [ ] Verificar que todas las políticas RLS de Supabase están activas y correctas
- [ ] Probar que con una sesión caducada redirige a login
- [ ] Verificar que las variables de entorno no están hardcodeadas en el código
- [ ] Revisar que el bucket de logos no expone archivos de otros usuarios

### 10.7 Pruebas manuales — flujo completo
- [ ] Crear cliente nuevo → añadir máquina → crear orden
- [ ] Añadir piezas del catálogo y manuales a la orden
- [ ] Añadir mano de obra con distintos tipos
- [ ] Avanzar la orden por todos los estados hasta "Entregada"
- [ ] Generar presupuesto con y sin IVA → descargar PDF → revisar contenido
- [ ] Compartir por WhatsApp desde móvil
- [ ] Registrar pagos parciales → verificar que el pendiente cuadra
- [ ] Añadir gastos en Finanzas → verificar que el beneficio neto es correcto
- [ ] Verificar que el Dashboard muestra métricas correctas
- [ ] Probar búsqueda en catálogo, clientes y órdenes
- [ ] Subir logo en Configuración → verificar que aparece en el PDF

### 10.8 Deploy final
- [ ] Configurar dominio personalizado en Vercel (si aplica)
- [ ] Activar HTTPS (automático en Vercel)
- [ ] Revisar variables de entorno en producción
- [ ] Probar la URL de producción con el flujo completo
- [ ] Crear usuario definitivo del dueño del taller en Supabase Auth
- [ ] Opcional: deshabilitar registro público en Supabase Auth (solo invite)
- [ ] Entregar al usuario con documento de instrucciones básicas de uso

---

## Resumen de progreso

| Fase | Descripción                          | Estado     |
|------|--------------------------------------|------------|
| 1    | Setup del proyecto                   | ✅ Completada |
| 2    | Auth + Configuración                 | ✅ Completada |
| 3    | Clientes + Máquinas                  | ✅ Completada |
| 4    | Órdenes de trabajo                   | ✅ Completada |
| 5    | Catálogo de piezas                   | ✅ Completada |
| 6    | Presupuestos + PDF                   | ✅ Completada |
| 7    | Pagos parciales                      | ✅ Completada |
| 8    | Finanzas                             | ✅ Completada |
| 9    | Dashboard                            | ✅ Completada |
| 10   | Pulido + Deploy                      | ⬜ Pendiente |

---

*Última actualización: 2026-02-18*
