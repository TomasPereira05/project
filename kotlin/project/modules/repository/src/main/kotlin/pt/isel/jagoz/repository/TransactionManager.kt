package pt.isel.jagoz.repository.pt.isel.jagoz.repository

/**
 * Abstraction over database transactions.
 * Services call [run] to execute a block inside a single transaction.
 * The JDBI implementation will open a Handle, create the Transaction, and commit/rollback.
 */
interface TransactionManager {
    fun <R> run(block: (Transaction) -> R): R
}
