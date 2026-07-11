package pt.isel.jagoz.service.pdf

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder
import jakarta.inject.Named
import java.io.ByteArrayOutputStream

/**
 *
 * Converte um documento XHTML num PDF (bytes). Reutiliza a mesma ideia do recibo de pagamento
 * (`PaymentReceipt.toHtml`): em vez de o browser imprimir o HTML, geramos o PDF no servidor para
 * o anexar ao email do bilhete.
 *
 * O renderer usa um parser estrito, por isso o [html] tem de ser **XHTML bem-formado**: todas as
 * tags fechadas (`<img ... />`, `<br/>`), atributos entre aspas e `&` escapado como `&amp;`.
 * Imagens podem vir embebidas como data URI (`data:image/png;base64,...`).
 *
 * A fonte da marca (Bebas Neue) é registada aqui a partir do classpath, para que os títulos
 * (`font-family: 'Bebas Neue'`) saiam mesmo na fonte do clube; sem registo, o motor cai para a
 * fonte genérica seguinte.
 */
@Named
class PdfGenerator {
    fun fromHtml(html: String): ByteArray =
        ByteArrayOutputStream().use { out ->
            PdfRendererBuilder()
                .useFastMode()
                .useFont({ brandingResource(BEBAS_NEUE) }, "Bebas Neue")
                .withHtmlContent(html, null)
                .toStream(out)
                .run()
            out.toByteArray()
        }

    private fun brandingResource(path: String) =
        PdfGenerator::class.java.getResourceAsStream(path)
            ?: error("PDF branding asset not found on classpath: $path")

    private companion object {
        const val BEBAS_NEUE = "/branding/BebasNeue-Regular.ttf"
    }
}
