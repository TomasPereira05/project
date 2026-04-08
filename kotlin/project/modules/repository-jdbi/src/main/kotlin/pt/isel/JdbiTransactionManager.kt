package pt.isel

import org.jdbi.v3.core.Jdbi

class JdbiTransactionManager(private val jdbi: Jdbi) : TransactionManager {
    override fun <R> run(block: (Transaction) -> R): R {
        return jdbi.inTransaction<R, Exception> { handle ->
            val transaction = JdbiTransaction(handle)
            block(transaction)
        }
    }
}
