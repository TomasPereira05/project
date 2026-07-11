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
    public type?: string;

    constructor(message: string, status?: number, title?: string, description?: string, type?: string) {
        super(message);

        Object.setPrototypeOf(this, HttpError.prototype);
        this.status = status;
        this.title = title;
        this.description = description;
        this.type = type;
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
            const text = await response.text();
            if (!text) {
                return new HttpError(defaultMessage, response.status);
            }

            let errorData: any;
            try {
                errorData = JSON.parse(text);
            } catch {
                return new HttpError(text, response.status);
            }

            // Problem Details: "reason" carrega a causa específica (ex.: InvalidOperation),
            // preferida à "description" genérica do tipo de problema.
            const message = errorData.message || errorData.detail || errorData.reason || errorData.description || defaultMessage;
            return new HttpError(
                message,
                response.status,
                errorData.title,
                errorData.description,
                errorData.type,
            );
        } catch {
            return new HttpError(defaultMessage, response.status);
        }
    }
}
