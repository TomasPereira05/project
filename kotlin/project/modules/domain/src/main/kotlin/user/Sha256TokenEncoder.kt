package pt.isel.jagoz.user

import java.security.MessageDigest
import java.util.Base64

/**
 * Implementation of [TokenEncoder] using SHA-256 hashing.
 */
class Sha256TokenEncoder : TokenEncoder {
    /**
     * Creates validation information for a token by hashing it.
     *
     * @param token The token string.
     * @return [TokenValidationInfo] containing the hashed token.
     */
    override fun createValidationInformation(token: String): TokenValidationInfo = TokenValidationInfo(hash(token))

    private fun hash(input: String): String {
        val messageDigest = MessageDigest.getInstance("SHA256")
        return Base64.getUrlEncoder().encodeToString(
            messageDigest.digest(
                Charsets.UTF_8.encode(input).array(),
            ),
        )
    }
}
