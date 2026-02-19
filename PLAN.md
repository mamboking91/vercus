# Vercus — Plan de Software 🔧

> App de gestión para taller de reparación de maquinaria agrícola.

---

## Decisiones confirmadas

| Parámetro         | Decisión                                          |
|-------------------|---------------------------------------------------|
| Usuarios          | Solo el dueño (1 cuenta)                          |
| País / Moneda     | España — Euro (€)                                 |
| IVA               | Opcional por documento (21%, 10%, 4%)             |
| Documentos PDF    | Presupuesto informal con logo + nombre del taller |
| Compartir PDF     | Descarga directa + WhatsApp                       |
| Mano de obra      | Tarifas por tipo de trabajo (configurables)       |
| Catálogo piezas   | Entrada manual, sin control de stock              |
| Dispositivo       | Responsive (móvil + escritorio)                   |
| Estados de orden  | 7 estados con espera de piezas                    |

---

## Stack tecnológico

| Capa            | Tecnología                        | Motivo                                        |
|-----------------|-----------------------------------|-----------------------------------------------|
| Frontend        | React + Vite + TypeScript         | Rápido de desarrollar, tipado seguro           |
| UI / Estilos    | Tailwind CSS + shadcn/ui          | Componentes listos, totalmente responsive     |
| Backend / DB    | Supabase (PostgreSQL + Auth + Storage) | Gratuito, RLS integrado, almacén de logo |
| Generación PDF  | @react-pdf/renderer               | PDFs profesionales renderizados en el cliente |
| Hosting         | Vercel                            | Deploy automático desde Git, gratuito         |

---

## Modelo de datos

### `settings` — Configuración del negocio (1 fila)
```
business_name    TEXT
owner_name       TEXT
phone            TEXT
address          TEXT
logo_url         TEXT        ← URL del logo subido a Supabase Storage
tax_id           TEXT        ← NIF / CIF
default_iva_rate INTEGER     ← 4 | 10 | 21
```

### `clients` — Clientes
```
id               UUID  PK
name             TEXT  NOT NULL
phone            TEXT
email            TEXT
address          TEXT
notes            TEXT
created_at       TIMESTAMPTZ
```

### `machines` — Máquinas de los clientes
```
id               UUID  PK
client_id        UUID  FK → clients.id
brand            TEXT
model            TEXT
serial_number    TEXT
type             ENUM  (tractor | motosierra | desbrozadora | electrica | otro)
notes            TEXT
created_at       TIMESTAMPTZ
```

### `labor_types` — Tipos de mano de obra (configurables)
```
id               UUID  PK
name             TEXT  NOT NULL    ← ej: "Diagnóstico", "Reparación mecánica"
hourly_rate      NUMERIC(10,2)
```

### `parts_catalog` — Catálogo de piezas
```
id               UUID  PK
code             TEXT              ← Referencia / código de la pieza
brand            TEXT              ← Stihl, Honda, Husqvarna, etc.
description      TEXT  NOT NULL
sell_price       NUMERIC(10,2)
notes            TEXT
created_at       TIMESTAMPTZ
```

### `work_orders` — Órdenes de trabajo (núcleo de la app)
```
id               UUID  PK
client_id        UUID  FK → clients.id
machine_id       UUID  FK → machines.id  (nullable)
status           ENUM  (recibida | presupuestada | aceptada |
                         esperando_piezas | en_reparacion | lista | entregada)
problem_description  TEXT
diagnosis            TEXT
internal_notes       TEXT
estimated_delivery   DATE
created_at           TIMESTAMPTZ
updated_at           TIMESTAMPTZ
```

### `work_order_status_log` — Historial de cambios de estado
```
id               UUID  PK
work_order_id    UUID  FK → work_orders.id
from_status      TEXT
to_status        TEXT
changed_at       TIMESTAMPTZ
```

### `work_order_parts` — Piezas usadas en una orden
```
id               UUID  PK
work_order_id    UUID  FK → work_orders.id
catalog_part_id  UUID  FK → parts_catalog.id  (nullable)
code             TEXT
description      TEXT
brand            TEXT
quantity         NUMERIC(10,2)
unit_price       NUMERIC(10,2)
```

### `work_order_labor` — Mano de obra en una orden
```
id               UUID  PK
work_order_id    UUID  FK → work_orders.id
labor_type_id    UUID  FK → labor_types.id  (nullable)
description      TEXT
hours            NUMERIC(10,2)
unit_rate        NUMERIC(10,2)   ← copia del rate en el momento del registro
```

### `quotes` — Presupuestos generados
```
id               UUID  PK
work_order_id    UUID  FK → work_orders.id
quote_number     TEXT  NOT NULL   ← correlativo, ej: "PRS-2026-001"
include_iva      BOOLEAN  DEFAULT false
iva_rate         INTEGER          ← 4 | 10 | 21
status           ENUM  (borrador | enviado | aceptado | rechazado)
valid_until      DATE
notes            TEXT
created_at       TIMESTAMPTZ
```

### `payments` — Pagos parciales
```
id               UUID  PK
work_order_id    UUID  FK → work_orders.id
amount           NUMERIC(10,2)  NOT NULL
date             DATE           NOT NULL
method           ENUM  (efectivo | transferencia | tarjeta | otro)
notes            TEXT
```

### `expenses` — Gastos del taller no imputados a cliente
```
id               UUID  PK
date             DATE  NOT NULL
description      TEXT  NOT NULL
category         TEXT             ← Herramientas, Suministros, Alquiler, etc.
amount           NUMERIC(10,2)  NOT NULL
```

---

## Módulos y pantallas

### 1. Dashboard `/`
- Tarjetas de resumen: órdenes activas, cobros pendientes, ingresos del mes
- Lista de las últimas 5 órdenes con estado visual (badge de color)
- Accesos rápidos: Nueva orden, Nuevo cliente

### 2. Clientes `/clientes`
- Lista con búsqueda por nombre / teléfono
- Ficha de cliente: datos de contacto + sus máquinas + historial de órdenes

### 3. Máquinas `/maquinas/:id`
- Datos de la máquina
- Historial completo de reparaciones

### 4. Órdenes de trabajo `/ordenes`
- Lista filtrable por estado, cliente, fecha, texto libre
- **Detalle de orden** `/ordenes/:id`:
  - Cambio de estado con botón de avance (flujo guiado)
  - Pestaña **Piezas**: buscar en catálogo o añadir pieza manual
  - Pestaña **Mano de obra**: seleccionar tipo → introducir horas
  - Pestaña **Pagos**: registrar cobros, ver total / cobrado / pendiente
  - Botón "Generar presupuesto"

### 5. Presupuestos `/presupuestos/:id`
- Vista previa del PDF con logo y datos del taller
- Toggle IVA on/off + selector de tipo (4% / 10% / 21%)
- Botón **Descargar PDF**
- Botón **Compartir por WhatsApp** (`wa.me` con mensaje, funciona desde móvil)

### 6. Catálogo de piezas `/catalogo`
- Tabla con búsqueda por código, marca, descripción
- CRUD completo (crear, editar, eliminar)

### 7. Finanzas `/finanzas`
- Selector mes/año
- Ingresos: suma de pagos recibidos ese mes
- Gastos: tabla de gastos manuales con botón añadir
- Beneficio neto = ingresos − gastos
- Gráfico de barras con los 12 meses del año

### 8. Configuración `/configuracion`
- Datos del taller: nombre, logo (subida de imagen), dirección, teléfono, NIF
- Tipos de mano de obra: CRUD de tipos y tarifas/hora
- Preferencia de IVA por defecto

---

## Flujo de estados de una orden

```
Recibida
   ↓
Presupuestada
   ↓
Aceptada
   ↓
Esperando piezas  ←── puede volver aquí desde En reparación
   ↓
En reparación
   ↓
Lista para recoger
   ↓
Entregada
```

Cada transición queda registrada con fecha y hora en `work_order_status_log`.

---

## Estructura del PDF de presupuesto

```
┌─────────────────────────────────────────────────┐
│  [LOGO]        Nombre del taller                │
│                Tel · Dirección · NIF            │
├─────────────────────────────────────────────────┤
│  PRESUPUESTO #PRS-2026-001    Fecha: 18/02/2026 │
│  Válido hasta: 04/03/2026                       │
├─────────────────────────────────────────────────┤
│  Cliente: Juan García   Tel: 666 000 000        │
│  Máquina: Stihl MS 261 · Nº serie: XXXXXXX      │
│  Trabajo: Descripción del problema / diagnóstico│
├─────────────────────────────────────────────────┤
│  PIEZAS                                         │
│  Ref.       Descripción      Cant.  P.Unit Total│
│  1140-120   Carburador Stihl    1   85,00  85,00│
│  …                                              │
├─────────────────────────────────────────────────┤
│  MANO DE OBRA                                   │
│  Tipo                 Horas  Tarifa     Total   │
│  Reparación mecánica    2h   45,00€    90,00€   │
│  …                                              │
├─────────────────────────────────────────────────┤
│                         Subtotal:    175,00 €   │
│                         IVA 21%:     36,75 €    │
│                         TOTAL:       211,75 €   │
└─────────────────────────────────────────────────┘
  Notas: …
```

---

## Fases de desarrollo

| Fase | Contenido                                                  |
|------|------------------------------------------------------------|
| 1    | Setup proyecto (Vite + TS + Tailwind + shadcn + Supabase + Vercel) |
| 2    | Auth (login) + Configuración del taller                    |
| 3    | Clientes + Máquinas (CRUD completo)                        |
| 4    | Órdenes de trabajo + flujo de estados                      |
| 5    | Catálogo de piezas + añadir piezas/labor a órdenes         |
| 6    | Generación de presupuesto + exportación PDF + WhatsApp     |
| 7    | Pagos parciales por orden                                  |
| 8    | Módulo de finanzas + gastos manuales                       |
| 9    | Dashboard con métricas reales                              |
| 10   | Pulido UI/UX, pruebas, deploy definitivo                   |

---

*Última actualización: 2026-02-18*
