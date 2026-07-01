package pt.isel.jagoz.http.model.payment

import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.service.PaymentReceipt
import pt.isel.jagoz.service.ReceiptLine

data class ReceiptLineOutput(
    val description: String,
    val amount: Int,
)

data class PaymentReceiptOutput(
    val receiptNumber: String,
    val paymentId: Long,
    val chargeId: Long,
    val type: ChargeType,
    val payerName: String,
    val payerNif: String?,
    val payerAddressLines: List<String>,
    val paidAt: String,
    val amount: Int,
    val provider: String,
    val providerRef: String?,
    val lines: List<ReceiptLineOutput>,
)

fun ReceiptLine.toOutput() =
    ReceiptLineOutput(
        description = description,
        amount = amount,
    )

fun PaymentReceipt.toOutput() =
    PaymentReceiptOutput(
        receiptNumber = receiptNumber,
        paymentId = paymentId,
        chargeId = chargeId,
        type = type,
        payerName = payerName,
        payerNif = payerNif,
        payerAddressLines = payerAddressLines,
        paidAt = paidAt,
        amount = amount,
        provider = provider,
        providerRef = providerRef,
        lines = lines.map { it.toOutput() },
    )

fun PaymentReceipt.toHtml(): String {
    fun esc(value: String?) =
        value
            .orEmpty()
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")

    fun money(cents: Int): String = "&euro; %.2f".format(cents / 100.0).replace(".", ",")

    fun receiptCode(index: Int): String =
        when (type) {
            ChargeType.SPONSORSHIP_FEE -> "PAT%03d".format(index + 1)
            ChargeType.ATHLETE_MONTHLY_FEE -> "ATL%03d".format(index + 1)
            ChargeType.MEMBER_FEE -> "MEN%03d".format(index + 1)
            ChargeType.TICKET_PURCHASE -> "BIL%03d".format(index + 1)
        }

    val clientAddress =
        payerAddressLines
            .filter { it.isNotBlank() }
            .joinToString("") { "<p>${esc(it)}</p>" }
            .ifBlank { "<p>Portugal</p>" }
    val reference = providerRef?.takeIf { it.isNotBlank() } ?: "-"
    val rows =
        lines.mapIndexed { index, line ->
            """
            <tr>
              <td class="code">${receiptCode(index)}</td>
              <td>${esc(line.description)}</td>
              <td class="number">1,00</td>
              <td class="number">${money(line.amount)}</td>
              <td class="number">0,00%</td>
              <td class="number">0,00%</td>
            </tr>
            """.trimIndent()
        }.joinToString("")

    return """
        <!doctype html>
        <html lang="pt">
        <head>
          <meta charset="utf-8" />
          <title>${esc(receiptNumber)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f3f4f6;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
            }
            .actions {
              max-width: 210mm;
              margin: 18px auto;
              text-align: right;
            }
            button {
              border: 0;
              background: #1f2937;
              color: white;
              padding: 10px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 700;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto 24px;
              background: white;
              padding: 18mm 17mm;
              position: relative;
            }
            .topbar {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 32px;
              align-items: start;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 16px;
            }
            .doc-title {
              color: #1d4ed8;
              font-size: 34px;
              font-weight: 700;
              line-height: 1;
              margin: 0 0 8px;
            }
            .doc-number {
              color: #1d4ed8;
              font-size: 17px;
              font-weight: 700;
              margin: 0;
            }
            .software {
              margin: 22px 0 0;
              color: #6b7280;
              font-size: 11px;
            }
            .page-count {
              color: #6b7280;
              font-size: 11px;
              text-align: right;
            }
            .entity {
              margin-top: 26px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 36px;
            }
            .entity h2,
            .client h2 {
              font-size: 14px;
              margin: 0 0 8px;
            }
            p { margin: 0 0 3px; }
            .client-label {
              color: #6b7280;
              margin-bottom: 8px;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              border: 1px solid #d1d5db;
              margin-top: 26px;
            }
            .meta-item {
              min-height: 58px;
              padding: 10px 12px;
              border-right: 1px solid #d1d5db;
            }
            .meta-item:last-child { border-right: 0; }
            .meta-label {
              color: #6b7280;
              font-size: 11px;
              margin-bottom: 9px;
            }
            .meta-value {
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 28px;
            }
            th {
              color: #6b7280;
              font-size: 11px;
              font-weight: 700;
              text-align: left;
              padding: 9px 8px;
              border-bottom: 1px solid #d1d5db;
            }
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
            }
            .code { width: 72px; color: #374151; }
            .number { text-align: right; white-space: nowrap; }
            .bottom {
              display: grid;
              grid-template-columns: 1fr 72mm;
              gap: 28px;
              margin-top: 32px;
              align-items: start;
            }
            .observations h3,
            .summary h3 {
              margin: 0 0 10px;
              font-size: 13px;
            }
            .observations p {
              color: #374151;
              line-height: 1.45;
            }
            .summary-row {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 12px;
              padding: 7px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .summary-row.total {
              color: #1d4ed8;
              font-size: 16px;
              font-weight: 700;
              border-bottom: 0;
              padding-top: 12px;
            }
            @page { size: A4; margin: 0; }
            @media print {
              body { background: white; }
              .actions { display: none; }
              .page { margin: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
          <main class="page">
            <header class="topbar">
              <div>
                <h1 class="doc-title">Recibo</h1>
                <p class="doc-number">n&ordm; ${esc(receiptNumber)}</p>
                <p class="software">Software Jagoz</p>
              </div>
              <p class="page-count">P&aacute;gina 1 de 1</p>
            </header>

            <section class="entity">
              <div>
                <h2>GDU Ericeirense</h2>
                <p>Urbaniza&ccedil;&atilde;o da Camacha</p>
                <p>2655-302 Ericeira</p>
                <p>Portugal</p>
                <p>Contribuinte: 501244220</p>
                <p>Email: geral@gdue.pt</p>
                <p>Telefone: 93 069 1921</p>
              </div>
              <div class="client">
                <p class="client-label">Exmo.(a) Sr.(a)</p>
                <h2>${esc(payerName)}</h2>
                $clientAddress
              </div>
            </section>

            <section class="meta">
              <div class="meta-item">
                <div class="meta-label">NIF</div>
                <div class="meta-value">${esc(payerNif ?: "-")}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Data</div>
                <div class="meta-value">${esc(paidAt)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Data de pagamento</div>
                <div class="meta-value">${esc(paidAt)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Refer&ecirc;ncia</div>
                <div class="meta-value">${esc(reference)}</div>
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th>C&oacute;digo</th>
                  <th>Descri&ccedil;&atilde;o</th>
                  <th class="number">Qtd.</th>
                  <th class="number">Pre&ccedil;o</th>
                  <th class="number">IVA</th>
                  <th class="number">Desc.</th>
                </tr>
              </thead>
              <tbody>$rows</tbody>
            </table>

            <section class="bottom">
              <div class="observations">
                <h3>Observa&ccedil;&otilde;es</h3>
                <p>Raz&atilde;o de isen&ccedil;&atilde;o de IVA: Isento Artigo 9&deg; do CIVA</p>
              </div>
              <div class="summary">
                <h3>Sum&aacute;rio</h3>
                <div class="summary-row"><span>Soma</span><strong>${money(amount)}</strong></div>
                <div class="summary-row"><span>Desconto</span><strong>${money(0)}</strong></div>
                <div class="summary-row"><span>IVA</span><strong>${money(0)}</strong></div>
                <div class="summary-row total"><span>Total</span><strong>${money(amount)}</strong></div>
              </div>
            </section>
          </main>
        </body>
        </html>
        """.trimIndent()
}
