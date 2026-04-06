package pt.isel.user

/**
 * Interface for encoding tokens into validation information.
 */
interface TokenEncoder {
    /**
     * Creates validation information for a given token.
     *
     * @param token The token string to encode.
     * @return [TokenValidationInfo] containing the encoded token.
     */
    fun createValidationInformation(token: String): TokenValidationInfo
}
