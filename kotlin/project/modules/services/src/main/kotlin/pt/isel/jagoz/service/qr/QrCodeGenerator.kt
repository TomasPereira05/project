package pt.isel.jagoz.service.qr

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.client.j2se.MatrixToImageWriter
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import jakarta.inject.Named
import java.io.ByteArrayOutputStream

/**
 * Gera o PNG do QR de um bilhete a partir do seu token (campo `qrCode`, atribuído na
 * confirmação do pagamento). Usado pelo email de compra (imagem inline via CID) e, mais
 * tarde, pela validação à porta. Função pura — sem estado nem efeitos externos.
 */
@Named
class QrCodeGenerator {
    fun pngBytes(
        payload: String,
        size: Int = DEFAULT_SIZE,
    ): ByteArray {
        require(payload.isNotBlank()) { "QR payload must not be blank" }
        val hints =
            mapOf(
                EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
                EncodeHintType.MARGIN to 1,
                EncodeHintType.CHARACTER_SET to "UTF-8",
            )
        val matrix = QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, size, size, hints)
        return ByteArrayOutputStream().use { out ->
            MatrixToImageWriter.writeToStream(matrix, "PNG", out)
            out.toByteArray()
        }
    }

    private companion object {
        const val DEFAULT_SIZE = 320
    }
}
