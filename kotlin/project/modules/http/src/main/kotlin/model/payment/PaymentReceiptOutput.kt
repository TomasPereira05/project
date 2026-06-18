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

    fun money(cents: Int): String = "%.2f EUR".format(cents / 100.0)
    val rows =
        lines.joinToString("") {
            """
            <tr>
              <td>${esc(it.description)}</td>
              <td class="amount">${money(it.amount)}</td>
            </tr>
            """.trimIndent()
        }

    return """
        <!doctype html>
        <html lang="pt">
        <head>
          <meta charset="utf-8" />
          <title>${esc(receiptNumber)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 40px; }
            .receipt { max-width: 760px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 32px; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            .muted { color: #6b7280; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 28px 0; }
            .box { border: 1px solid #e5e7eb; padding: 14px; border-radius: 6px; }
            .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; }
            .value { margin-top: 4px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
            th { font-size: 12px; text-transform: uppercase; color: #6b7280; }
            .amount { text-align: right; font-weight: 700; }
            .total { font-size: 20px; }
            .actions { margin: 24px auto; max-width: 760px; text-align: right; }
            button { border: 0; background: #001d4a; color: white; padding: 10px 16px; border-radius: 6px; cursor: pointer; }
            @media print { body { margin: 0; } .actions { display: none; } .receipt { border: 0; } }
          </style>
        </head>
        <body>
          <div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
          <main class="receipt">
            <p class="muted">Grupo Desportivo União Ericeirense</p>
            <h1>Recibo ${esc(receiptNumber)}</h1>
            <p class="muted">Comprovativo de pagamento.</p>
            <section class="grid">
              <div class="box"><div class="label">Cliente</div><div class="value">${esc(payerName)}</div></div>
              <div class="box"><div class="label">NIF</div><div class="value">${esc(payerNif ?: "-")}</div></div>
              <div class="box"><div class="label">Data de pagamento</div><div class="value">${esc(paidAt)}</div></div>
              <div class="box"><div class="label">Referência</div><div class="value">${esc(provider)} ${esc(providerRef)}</div></div>
            </section>
            <table>
              <thead><tr><th>Descrição</th><th class="amount">Valor</th></tr></thead>
              <tbody>$rows</tbody>
              <tfoot><tr><td class="total">Total pago</td><td class="amount total">${money(amount)}</td></tr></tfoot>
            </table>
          </main>
        </body>
        </html>
        """.trimIndent()
}
