package preview

import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.rendering.PDFRenderer
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.service.email.EmailSender
import pt.isel.jagoz.service.email.EmailService
import pt.isel.jagoz.service.pdf.PdfGenerator
import pt.isel.jagoz.service.qr.QrCodeGenerator
import java.io.File
import javax.imageio.ImageIO

/**
 * Gera um PDF de bilhete de exemplo para inspeção visual do layout, sem tocar no fluxo real de
 * compra/email. Reutiliza o template real via [EmailService.renderTicketPdf].
 *
 * Correr com: `./gradlew :services:ticketPreview` (PDF em `bilhete-sample.pdf` na raiz do projeto),
 * ou `./gradlew :services:ticketPreview -Pout=C:/caminho/x.pdf`.
 */
private object NoopEmailSender : EmailSender {
    override fun sendEmail(
        to: String,
        subject: String,
        body: String,
        isHtml: Boolean,
        inlineImages: Map<String, ByteArray>,
        attachments: Map<String, ByteArray>,
    ) = Unit
}

fun main(args: Array<String>) {
    val out = File(args.firstOrNull() ?: "bilhete-sample.pdf")
    val service = EmailService(NoopEmailSender, QrCodeGenerator(), PdfGenerator())

    // Dois bilhetes (sócio + normal) para exercitar a quebra de página "1 bilhete por folha".
    val lines =
        listOf(
            EmailService.TicketEmailLine("Bancada Nascente", TicketPriceType.MEMBER, 600, "TCK-9F3A2K7Q-EVT12"),
            EmailService.TicketEmailLine("Bancada Poente", TicketPriceType.NORMAL, 1000, "TCK-77BQ1Z44-EVT12"),
        )

    val pdf =
        service.renderTicketPdf(
            buyerName = "Maria Sousa",
            eventName = "GDUE vs Mafra",
            eventWhen = "Sáb, 12 Jul 2026 · 20:00",
            location = "Estádio Municipal da Ericeira",
            lines = lines,
        )

    out.writeBytes(pdf)
    println("Wrote ${pdf.size} bytes -> ${out.absolutePath}")

    // Renderiza cada página para PNG (inspeção visual sem precisar de visualizador de PDF).
    PDDocument.load(pdf).use { doc ->
        val renderer = PDFRenderer(doc)
        for (i in 0 until doc.numberOfPages) {
            val img = renderer.renderImageWithDPI(i, 110f)
            val png = File(out.parentFile ?: File("."), "${out.nameWithoutExtension}-p${i + 1}.png")
            ImageIO.write(img, "PNG", png)
            println("Wrote page ${i + 1} -> ${png.absolutePath}")
        }
    }
}
