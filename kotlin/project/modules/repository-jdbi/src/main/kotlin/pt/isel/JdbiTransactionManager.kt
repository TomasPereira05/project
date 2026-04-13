package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Jdbi
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

class JdbiTransactionManager(private val jdbi: Jdbi) : TransactionManager {
    override fun <R> run(block: (Transaction) -> R): R {
        return jdbi.inTransaction<R, Exception> { handle ->
            val transaction = JdbiTransaction(handle)
            block(transaction)
        }
    }
}
