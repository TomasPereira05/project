package pt.isel.jagoz.service.email

interface EmailSender {
    fun sendEmail(
        to: String,
        subject: String,
        body: String,
        isHtml: Boolean = true,
        inlineImages: Map<String, ByteArray> = emptyMap(),
        attachments: Map<String, ByteArray> = emptyMap(),
    )
}
