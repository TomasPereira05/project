package pt.isel.jagoz.domain.utils

/**
 * Represents a value of one of two possible types (a disjoint union).
 * Instances of [Either] are either an instance of [Left] or [Right].
 *
 * @param L The type of the Left value (usually represents failure).
 * @param R The type of the Right value (usually represents success).
 */
sealed class Either<out L, out R> {
    /**
     * Represents the Left side of [Either] class which by convention is a "Failure".
     *
     * @property value The value of type [L].
     */
    data class Left<out L>(val value: L) : Either<L, Nothing>()

    /**
     * Represents the Right side of [Either] class which by convention is a "Success".
     *
     * @property value The value of type [R].
     */
    data class Right<out R>(val value: R) : Either<Nothing, R>()
}

// Functions for when using Either to represent success or failure

/**
 * Creates a [Either.Right] instance.
 *
 * @param value The success value.
 * @return [Either.Right] containing the value.
 */
fun <R> success(value: R) = Either.Right(value)

/**
 * Creates a [Either.Left] instance.
 *
 * @param error The failure value.
 * @return [Either.Left] containing the error.
 */
fun <L> failure(error: L) = Either.Left(error)

/** Type alias for [Either.Right], representing success. */
typealias Success<S> = Either.Right<S>

/** Type alias for [Either.Left], representing failure. */
typealias Failure<F> = Either.Left<F>

inline fun <L, R> Either<L, R>.getOrReturn(block: (L) -> Nothing): R =
    when (this) {
        is Either.Left -> block(value)
        is Either.Right -> value
    }

inline fun <L, R, T> Either<L, R>.fold(
    onLeft: (L) -> T,
    onRight: (R) -> T,
): T =
    when (this) {
        is Either.Left -> onLeft(value)
        is Either.Right -> onRight(value)
    }

inline fun <L, R, T> Either<L, R>.handle(
    onFailure: (L) -> T,
    onSuccess: (R) -> T,
): T = fold(onFailure, onSuccess)
