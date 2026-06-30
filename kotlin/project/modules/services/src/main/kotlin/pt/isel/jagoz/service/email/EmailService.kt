package pt.isel.jagoz.service.email

import jakarta.inject.Named
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.service.pdf.PdfGenerator
import pt.isel.jagoz.service.qr.QrCodeGenerator
import java.awt.AlphaComposite
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.Base64
import javax.imageio.ImageIO

@Named
class EmailService(
    private val emailSender: EmailSender,
    private val qrCodeGenerator: QrCodeGenerator,
    private val pdfGenerator: PdfGenerator,
) {
    /** Um bilhete confirmado a incluir no email: setor, tipo de preço, preço e token do QR. */
    data class TicketEmailLine(
        val sectorName: String,
        val priceType: TicketPriceType,
        val priceCents: Int,
        val qrToken: String,
    )

    /**
     * Envia o email de confirmação de compra. Os bilhetes seguem num **PDF anexo** (um documento
     * com os dados do jogo e um QR por bilhete), gerado a partir de XHTML — reaproveitando a
     * abordagem de template do recibo de pagamento. O corpo do email leva apenas o resumo da compra.
     *
     * Lança [EmailDeliveryException] em falha de entrega — o chamador (webhook) trata sem reverter
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
        val pdf = pdfGenerator.fromHtml(ticketDocumentHtml(buyerName, eventName, eventWhen, location, lines))

        val rows = lines.joinToString("") { ticketRowHtml(it) }
        val body = ticketEmailHtml(buyerName, eventName, eventWhen, location, rows, lines.sumOf { it.priceCents })
        emailSender.sendEmail(
            to = buyerEmail,
            subject = "Os teus bilhetes — $eventName",
            body = body,
            isHtml = true,
            attachments = mapOf("${ticketFileName(eventName)}.pdf" to pdf),
        )
        logger.info("Ticket purchase email sent to {} ({} tickets)", buyerEmail, lines.size)
    }

    /**
     * Renderiza o PDF do bilhete com [lines] **sem enviar email** — usado pelo alvo de preview
     * (`./gradlew :services:ticketPreview`) para inspecionar o layout. Reutiliza o template real
     * ([ticketDocumentHtml]) para que o preview nunca divirja do que é enviado.
     */
    internal fun renderTicketPdf(
        buyerName: String,
        eventName: String,
        eventWhen: String,
        location: String,
        lines: List<TicketEmailLine>,
    ): ByteArray = pdfGenerator.fromHtml(ticketDocumentHtml(buyerName, eventName, eventWhen, location, lines))

    /** Linha do resumo no corpo do email — só dados do bilhete, sem QR (esse vai no PDF anexo). */
    private fun ticketRowHtml(line: TicketEmailLine): String {
        val typeLabel = if (line.priceType == TicketPriceType.MEMBER) "Sócio" else "Normal"
        return """
            <tr>
              <td style="padding:14px 12px;border-top:1px solid #e2e8f0;">
                <div style="font-weight:600;color:#0f172a;">${esc(line.sectorName)}</div>
                <div style="color:#475569;font-size:13px;margin-top:2px;">$typeLabel · ${formatEuros(line.priceCents)}</div>
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
            <h1 style="margin:6px 0 0;font-size:22px;">${esc(eventName)}</h1>
            <div style="margin-top:6px;font-size:14px;opacity:0.9;">${esc(eventWhen)} · ${esc(location)}</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <p style="margin:0 0 16px;">Olá ${esc(
            buyerName,
        )}, a tua compra está confirmada. Os teus bilhetes seguem em <strong>anexo (PDF)</strong> — apresenta o QR de cada um à entrada.</p>
            <table style="width:100%;border-collapse:collapse;">$rowsHtml</table>
            <div style="margin-top:16px;text-align:right;font-size:15px;">
              <strong>Total: ${formatEuros(totalCents)}</strong>
            </div>
            <p style="margin:20px 0 0;color:#64748b;font-size:12px;">Cada QR é válido para uma entrada. Não partilhes este email nem o PDF.</p>
          </div>
        </div>
        """.trimIndent()

    /**
     * Documento XHTML do bilhete que é convertido em PDF e anexado ao email. **Um bilhete por página
     * A4**: cada página é uma tabela de altura fixa (banda navy no topo com brasão, miolo com o jogo
     * e o cartão do bilhete, banda navy no rodapé com instruções) — a linha do miolo expande
     * (`height: 100%`) e empurra o rodapé para baixo, ocupando a folha por construção (o motor não
     * faz centragem vertical de forma fiável). Mantém a marca: navy #004F98, barra dourada #FACC15 e
     * títulos em Bebas Neue. **Tem de ser XHTML bem-formado** (ver [PdfGenerator]).
     */
    private fun ticketDocumentHtml(
        buyerName: String,
        eventName: String,
        eventWhen: String,
        location: String,
        lines: List<TicketEmailLine>,
    ): String {
        val pages =
            lines
                .mapIndexed { index, line ->
                    val typeLabel = if (line.priceType == TicketPriceType.MEMBER) "Sócio" else "Normal"
                    val qrBase64 = Base64.getEncoder().encodeToString(qrCodeGenerator.pngBytes(line.qrToken))
                    // 1 bilhete por página: força quebra antes de cada bilhete a partir do 2.º
                    val breakBefore = if (index == 0) "" else """ style="page-break-before: always;""""
                    """
                    <table class="page"$breakBefore>
                      <tr>
                        <td class="band-top">
                          <table class="band-top-inner">
                            <tr>
                              <td class="crest-cell"><img class="crest" src="data:image/png;base64,$logoBase64" alt="GDUE" /></td>
                              <td class="brand-cell">
                                <div class="club">Grupo Desportivo União Ericeirense</div>
                                <div class="doc-kind">Bilhete de Jogo</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="body">
                          <div class="body-inner">
                            <img class="watermark" src="data:image/png;base64,$watermarkBase64" alt="" />
                            <div class="event">
                              <div class="event-name">${esc(eventName)}</div>
                              <div class="event-when">${esc(eventWhen)}</div>
                              <div class="event-where">${esc(location)}</div>
                            </div>
                            <table class="card">
                              <tr>
                                <td class="card-info">
                                  <div class="field-label">Setor</div>
                                  <div class="field-sector">${esc(line.sectorName)}</div>
                                  <div class="field-meta">$typeLabel · ${formatEuros(line.priceCents)}</div>
                                  <div class="field-label spaced">Portador</div>
                                  <div class="field-value">${esc(buyerName)}</div>
                                  <div class="field-label spaced">Bilhete N.º</div>
                                  <div class="field-value mono">${readableId(line.qrToken)}</div>
                                </td>
                                <td class="card-qr">
                                  <img class="qr" src="data:image/png;base64,$qrBase64" alt="QR" />
                                  <div class="qr-caption">Apresente à entrada</div>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td class="band-bottom">
                          <div class="foot-line">Apresente o QR à porta · chegue 30 minutos antes do início.</div>
                          <div class="foot-line">Cada QR é válido para uma única entrada — não partilhe este bilhete.</div>
                          <div class="foot-club">Grupo Desportivo União Ericeirense</div>
                        </td>
                      </tr>
                    </table>
                    """.trimIndent()
                }.joinToString("")

        return """
            <!DOCTYPE html>
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta charset="utf-8" />
              <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; font-family: Helvetica, Arial, sans-serif; color: #0f172a; }
                .page { width: 100%; border-collapse: collapse; table-layout: fixed; }

                .band-top { background: #004F98; border-bottom: 4px solid #FACC15; padding: 22px 36px; }
                .band-top-inner { border-collapse: collapse; }
                .crest-cell { width: 70px; vertical-align: middle; }
                .crest { width: 60px; height: auto; }
                .brand-cell { vertical-align: middle; padding-left: 18px; }
                .club { color: #ffffff; font-size: 14px; font-weight: bold; letter-spacing: 0.02em; }
                .doc-kind { font-family: 'Bebas Neue', Helvetica, sans-serif; color: #FACC15; font-size: 26px; letter-spacing: 0.08em; line-height: 1.1; }

                .body { vertical-align: middle; height: 820px; padding: 8px 36px; }
                .body-inner { position: relative; }
                .watermark { position: absolute; top: 70px; left: 24px; width: 360px; height: auto; }

                .event { position: relative; }
                .event-name { font-family: 'Bebas Neue', Helvetica, sans-serif; font-size: 52px; line-height: 1.0; color: #004F98; letter-spacing: 0.01em; }
                .event-when { margin-top: 12px; font-size: 17px; color: #0f172a; }
                .event-where { margin-top: 2px; font-size: 15px; color: #475569; }

                .card { position: relative; width: 100%; margin-top: 46px; border-collapse: collapse; border: 1px solid #cbd5e1; border-top: 4px solid #FACC15; background: #ffffff; }
                .card-info { vertical-align: middle; padding: 34px 32px; border-right: 1px dashed #94a3b8; background: #ffffff; }
                .field-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #94a3b8; }
                .field-label.spaced { padding-top: 20px; }
                .field-sector { font-family: 'Bebas Neue', Helvetica, sans-serif; font-size: 34px; line-height: 1.05; color: #004F98; }
                .field-meta { font-size: 15px; color: #475569; padding-top: 2px; }
                .field-value { font-size: 16px; color: #0f172a; padding-top: 3px; }
                .field-value.mono { font-family: 'Courier New', monospace; letter-spacing: 0.06em; }
                .card-qr { width: 236px; vertical-align: middle; text-align: center; padding: 28px; background: #ffffff; }
                .qr { width: 196px; height: 196px; border: 1px solid #e2e8f0; background: #ffffff; }
                .qr-caption { padding-top: 10px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; }

                .band-bottom { background: #004F98; border-top: 4px solid #FACC15; padding: 18px 36px; }
                .foot-line { color: #e2e8f0; font-size: 12px; line-height: 1.7; }
                .foot-club { color: #FACC15; font-size: 12px; font-weight: bold; padding-top: 8px; letter-spacing: 0.03em; }
              </style>
            </head>
            <body>$pages</body>
            </html>
            """.trimIndent()
    }

    /** Brasão do clube (classpath) em base64, calculado uma vez. */
    private val logoBase64: String by lazy { Base64.getEncoder().encodeToString(brandingBytes(LOGO_PATH)) }

    /**
     * Marca d'água: brasão esbatido (alfa reduzido) para o fundo do miolo, atrás do conteúdo. O alfa
     * é "cozido" no PNG, por isso não dependemos do suporte (parcial) de `opacity` do motor de PDF.
     * O cartão tem fundo branco, garantindo que o QR fica sempre sobre branco (legível/scannable).
     */
    private val watermarkBase64: String by lazy {
        Base64.getEncoder().encodeToString(fadePng(brandingBytes(LOGO_PATH), WATERMARK_ALPHA))
    }

    private fun brandingBytes(path: String): ByteArray =
        (
            EmailService::class.java.getResourceAsStream(path)
                ?: error("Branding asset not found on classpath: $path")
        ).use { it.readBytes() }

    /** Redesenha o PNG sobre um canvas transparente com [alpha] (0..1), reduzindo a sua opacidade. */
    private fun fadePng(
        png: ByteArray,
        alpha: Float,
    ): ByteArray {
        val src = ImageIO.read(ByteArrayInputStream(png))
        val faded = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)
        val g = faded.createGraphics()
        g.composite = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, alpha)
        g.drawImage(src, 0, 0, null)
        g.dispose()
        return ByteArrayOutputStream().use { out ->
            ImageIO.write(faded, "PNG", out)
            out.toByteArray()
        }
    }

    /**
     * ID legível do bilhete, derivado do token do QR (apenas apresentação — o token não muda). Pega
     * nos caracteres alfanuméricos em maiúsculas e mostra um bloco curto agrupado (ex.: "A3F9-2K7Q"),
     * útil para referência manual à porta quando o QR não pode ser lido.
     */
    private fun readableId(qrToken: String): String {
        val cleaned = qrToken.filter { it.isLetterOrDigit() }.uppercase().take(8)
        return if (cleaned.isEmpty()) "—" else cleaned.chunked(4).joinToString("-")
    }

    /** Escapa texto para XHTML/HTML (igual ao recibo). */
    private fun esc(value: String): String =
        value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")

    /** Nome de ficheiro seguro a partir do nome do evento, ex.: "GDUE vs X" -> "bilhetes-gdue-vs-x". */
    private fun ticketFileName(eventName: String): String {
        val slug =
            eventName
                .lowercase()
                .replace(Regex("[^a-z0-9]+"), "-")
                .trim('-')
                .take(40)
        return if (slug.isBlank()) "bilhetes" else "bilhetes-$slug"
    }

    /** Cêntimos → "6,00 €" (formato pt-PT). */
    private fun formatEuros(cents: Int): String = "${cents / 100},${(cents % 100).toString().padStart(2, '0')} €"

    private companion object {
        private val logger = LoggerFactory.getLogger(EmailService::class.java)

        // Brasão do clube nos resources do módulo (ver PdfGenerator para a fonte da marca).
        private const val LOGO_PATH = "/branding/logo_GDUE.png"

        // Opacidade da marca d'água (0..1): baixa o suficiente para não competir com o texto/QR.
        private const val WATERMARK_ALPHA = 0.05f
    }
}
