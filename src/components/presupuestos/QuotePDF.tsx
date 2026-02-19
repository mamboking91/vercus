import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { type Quote, type WorkOrderPart, type WorkOrderLabor, type Settings } from '@/types'
import { formatCurrency } from '@/lib/utils'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: 'contain',
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  businessInfo: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.5,
  },
  quoteBox: {
    backgroundColor: '#f4f4f5',
    padding: 12,
    borderRadius: 4,
    minWidth: 160,
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 9,
    color: '#555',
  },
  // Client section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  clientInfo: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.5,
  },
  // Work info
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoCell: {
    flex: 1,
    backgroundColor: '#fafafa',
    border: '1 solid #e4e4e7',
    borderRadius: 4,
    padding: 10,
  },
  infoCellLabel: {
    fontSize: 8,
    color: '#888',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCellValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    color: '#fff',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottom: '1 solid #f0f0f0',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colDesc: { flex: 3 },
  colCode: { flex: 1.5, textAlign: 'center' },
  colQty: { width: 40, textAlign: 'center' },
  colPrice: { width: 70, textAlign: 'right' },
  colTotal: { width: 70, textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: { fontSize: 9 },
  cellTextMuted: { fontSize: 8, color: '#888' },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  // Totals
  totalsBox: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    gap: 32,
  },
  totalLabel: { fontSize: 9, color: '#555' },
  totalValue: { fontSize: 9, width: 80, textAlign: 'right' },
  divider: {
    borderBottom: '1 solid #e4e4e7',
    marginVertical: 6,
    width: 200,
  },
  grandTotalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  grandTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', width: 80, textAlign: 'right' },
  // Notes & footer
  notes: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#fafafa',
    border: '1 solid #e4e4e7',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#555',
  },
  notesText: { fontSize: 9, color: '#555', lineHeight: 1.5 },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: '1 solid #e4e4e7',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#aaa' },
})

interface QuotePDFProps {
  quote: Quote
  parts: WorkOrderPart[]
  labor: WorkOrderLabor[]
  settings: Settings | null
}

export function QuotePDF({ quote, parts, labor, settings }: QuotePDFProps) {
  const order = quote.work_order
  const client = order?.client
  const machine = order?.machine

  const subtotalParts = parts.reduce((s, p) => s + p.quantity * p.unit_price, 0)
  const subtotalLabor = labor.reduce((s, l) => s + l.hours * l.unit_rate, 0)
  const subtotal = subtotalParts + subtotalLabor
  const ivaAmount = quote.include_iva ? subtotal * (quote.iva_rate / 100) : 0
  const total = subtotal + ivaAmount

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('es-ES') : '—'

  const machineName = machine
    ? [machine.brand, machine.model].filter(Boolean).join(' ') || 'Máquina sin nombre'
    : null

  return (
    <Document
      title={`Presupuesto ${quote.quote_number}`}
      author={settings?.business_name ?? 'Taller'}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {settings?.logo_url && (
              <Image src={settings.logo_url} style={styles.logo} />
            )}
            {!settings?.logo_url && (
              <Text style={styles.businessName}>{settings?.business_name ?? 'Taller'}</Text>
            )}
            {settings?.logo_url && (
              <Text style={[styles.businessName, { marginTop: 6 }]}>{settings.business_name}</Text>
            )}
            <Text style={styles.businessInfo}>
              {[settings?.address, settings?.phone, settings?.tax_id && `NIF: ${settings.tax_id}`]
                .filter(Boolean)
                .join('\n')}
            </Text>
          </View>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteTitle}>PRESUPUESTO</Text>
            <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
            <Text style={[styles.quoteNumber, { marginTop: 4 }]}>
              Fecha: {formatDate(quote.created_at)}
            </Text>
            {quote.valid_until && (
              <Text style={styles.quoteNumber}>
                Válido hasta: {formatDate(quote.valid_until)}
              </Text>
            )}
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.clientName}>{client?.name ?? '—'}</Text>
          <Text style={styles.clientInfo}>
            {[client?.phone, client?.email, client?.address].filter(Boolean).join('  ·  ')}
          </Text>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>Orden de trabajo</Text>
            <Text style={styles.infoCellValue}>{order?.order_number ?? '—'}</Text>
          </View>
          {machineName && (
            <View style={styles.infoCell}>
              <Text style={styles.infoCellLabel}>Máquina</Text>
              <Text style={styles.infoCellValue}>{machineName}</Text>
              {machine?.serial_number && (
                <Text style={[styles.infoCellLabel, { marginTop: 2 }]}>
                  S/N: {machine.serial_number}
                </Text>
              )}
            </View>
          )}
          {order?.problem_description && (
            <View style={[styles.infoCell, { flex: 2 }]}>
              <Text style={styles.infoCellLabel}>Descripción del trabajo</Text>
              <Text style={styles.infoCellValue}>{order.problem_description}</Text>
            </View>
          )}
        </View>

        {/* Parts table */}
        {parts.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Piezas y materiales</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colDesc]}>Descripción</Text>
              <Text style={[styles.headerText, styles.colCode]}>Referencia</Text>
              <Text style={[styles.headerText, styles.colQty]}>Ud.</Text>
              <Text style={[styles.headerText, styles.colPrice]}>P. unit.</Text>
              <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
            </View>
            {parts.map((p, i) => (
              <View key={p.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <View style={styles.colDesc}>
                  <Text style={styles.cellText}>{p.description}</Text>
                  {p.brand && <Text style={styles.cellTextMuted}>{p.brand}</Text>}
                </View>
                <Text style={[styles.cellText, styles.colCode]}>{p.code ?? '—'}</Text>
                <Text style={[styles.cellText, styles.colQty]}>{p.quantity}</Text>
                <Text style={[styles.cellText, styles.colPrice]}>{formatCurrency(p.unit_price)}</Text>
                <Text style={[styles.cellText, styles.colTotal]}>{formatCurrency(p.quantity * p.unit_price)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Labor table */}
        {labor.length > 0 && (
          <View style={{ marginTop: parts.length > 0 ? 12 : 0 }}>
            <Text style={styles.sectionLabel}>Mano de obra</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.colDesc]}>Descripción</Text>
              <Text style={[styles.headerText, styles.colCode]}>Tipo</Text>
              <Text style={[styles.headerText, styles.colQty]}>h.</Text>
              <Text style={[styles.headerText, styles.colPrice]}>€/h</Text>
              <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
            </View>
            {labor.map((l, i) => (
              <View key={l.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.cellText, styles.colDesc]}>
                  {l.description || l.labor_type?.name || 'Mano de obra'}
                </Text>
                <Text style={[styles.cellText, styles.colCode]}>{l.labor_type?.name ?? '—'}</Text>
                <Text style={[styles.cellText, styles.colQty]}>{l.hours}</Text>
                <Text style={[styles.cellText, styles.colPrice]}>{formatCurrency(l.unit_rate)}</Text>
                <Text style={[styles.cellText, styles.colTotal]}>{formatCurrency(l.hours * l.unit_rate)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal piezas</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotalParts)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal mano de obra</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotalLabor)}</Text>
          </View>
          <View style={[styles.divider, { alignSelf: 'flex-end' }]} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Base imponible</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {quote.include_iva && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGIC ({quote.iva_rate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(ivaAmount)}</Text>
            </View>
          )}
          <View style={[styles.divider, { alignSelf: 'flex-end' }]} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
          {!quote.include_iva && (
            <Text style={[styles.cellTextMuted, { marginTop: 4 }]}>
              * Precios sin IGIC
            </Text>
          )}
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Observaciones</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{settings?.business_name ?? ''}</Text>
          <Text style={styles.footerText}>{quote.quote_number}</Text>
        </View>
      </Page>
    </Document>
  )
}
