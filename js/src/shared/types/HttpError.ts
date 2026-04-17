/**
 * Custom error class for HTTP-related errors. Captures Problem Details format from the API.
 * @extends Error
 * @property {number} status - The HTTP status code.
 * @property {string} title - The title of the error.
 * @property {string} description - A detailed description of the error.
 */
export class HttpError extends Error {
    public status?: number;
    public title?: string;
    public description?: string;

    constructor(message: string, status?: number, title?: string, description?: string) {
        super(message);

        Object.setPrototypeOf(this, HttpError.prototype);
        this.status = status;
        this.title = title;
        this.description = description;
    }

    /**
     * Factory method to create an HttpError from a response object.
     * Parses the JSON response to populate the error properties.
     * @param response The fetch Response object containing error details.
     * @returns {Promise<HttpError>} A promise resolving to an HttpError instance.
     */
    static async fromResponse(response: Response): Promise<HttpError> {
        const defaultMessage = "An unexpected error occurred.";
        try {
            const errorData = await response.json();
            return new HttpError(
                errorData.description || defaultMessage,
                response.status,
                errorData.title,
                errorData.description
            );
        } catch {
            return new HttpError(defaultMessage, response.status);
        }
    }
}