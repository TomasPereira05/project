package pt.isel.jagoz.service.email

import jakarta.inject.Named
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.service.qr.QrCodeGenerator

@Named
class EmailService(
    private val emailSender: EmailSender,
    private val qrCodeGenerator: QrCodeGenerator,
) {
    /** Um bilhete confirmado a incluir no email: setor, tipo de preço, preço e token do QR. */
    data class TicketEmailLine(
        val sectorName: String,
        val priceType: TicketPriceType,
        val priceCents: Int,
        val qrToken: String,
    )

    /**
     * Envia o email de confirmação de compra, com um QR inline (CID) por bilhete. Lança
     * [EmailDeliveryException] em falha de entrega — o chamador (webhook) trata sem reverter
     * a confirmação já persistida.
     */
    fun sendTicketPurchaseEmail(
        buyerName: String,
        buyerEmail: String,
        eventName: String,
        eventWhen: String,
        location: String,
        lines: List<TicketEmailLine>,
    ) {
        val inlineImages = mutableMapOf<String, ByteArray>()
        val rows =
            lines.mapIndexed { index, line ->
                val cid = "qr-$index"
                inlineImages[cid] = qrCodeGenerator.pngBytes(line.qrToken)
                ticketRowHtml(cid, line)
            }.joinToString("")

        val body = ticketEmailHtml(buyerName, eventName, eventWhen, location, rows, lines.sumOf { it.priceCents })
        emailSender.sendEmail(
            to = buyerEmail,
            subject = "Os teus bilhetes — $eventName",
            body = body,
            isHtml = true,
            inlineImages = inlineImages,
        )
        logger.info("Ticket purchase email sent to {} ({} tickets)", buyerEmail, lines.size)
    }

    private fun ticketRowHtml(
        cid: String,
        line: TicketEmailLine,
    ): String {
        val typeLabel = if (line.priceType == TicketPriceType.MEMBER) "Sócio" else "Normal"
        return """
            <tr>
              <td style="padding:14px 12px;border-top:1px solid #e2e8f0;vertical-align:middle;">
                <div style="font-weight:600;color:#0f172a;">${line.sectorName}</div>
                <div style="color:#475569;font-size:13px;margin-top:2px;">$typeLabel · ${formatEuros(line.priceCents)}</div>
              </td>
              <td style="padding:14px 12px;border-top:1px solid #e2e8f0;text-align:right;">
                <img src="cid:$cid" alt="QR code" width="120" height="120" style="display:block;margin-left:auto;border:1px solid #e2e8f0;border-radius:8px;" />
              </td>
            </tr>
        """.trimIndent()
    }

    private fun ticketEmailHtml(
        buyerName: String,
        eventName: String,
        eventWhen: String,
        location: String,
        rowsHtml: String,
        totalCents: Int,
    ): String =
        """
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
          <div style="background:#004F98;border-top:3px solid #FACC15;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
            <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;opacity:0.8;">Bilhetes</div>
            <h1 style="margin:6px 0 0;font-size:22px;">$eventName</h1>
            <div style="margin-top:6px;font-size:14px;opacity:0.9;">$eventWhen · $location</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <p style="margin:0 0 16px;">Olá $buyerName, a tua compra está confirmada. Apresenta o(s) QR à entrada:</p>
            <table style="width:100%;border-collapse:collapse;">$rowsHtml</table>
            <div style="margin-top:16px;text-align:right;font-size:15px;">
              <strong>Total: ${formatEuros(totalCents)}</strong>
            </div>
            <p style="margin:20px 0 0;color:#64748b;font-size:12px;">Cada QR é válido para uma entrada. Não partilhes este email.</p>
          </div>
        </div>
        """.trimIndent()

    /** Cêntimos → "6,00 €" (formato pt-PT). */
    private fun formatEuros(cents: Int): String = "${cents / 100},${(cents % 100).toString().padStart(2, '0')} €"

    private companion object {
        private val logger = LoggerFactory.getLogger(EmailService::class.java)
    }
}
