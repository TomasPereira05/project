package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.argument.Argument
import org.jdbi.v3.core.argument.ArgumentFactory
import org.jdbi.v3.core.config.ConfigRegistry
import java.lang.reflect.Type
import java.util.Optional

class LocalDateArgumentFactory : ArgumentFactory {
    override fun build(
        type: Type,
        value: Any?,
        config: ConfigRegistry,
    ): Optional<Argument> {
        if (value is LocalDate) {
            return Optional.of(
                Argument { position, stmt, _ ->
                    stmt.setDate(position, java.sql.Date.valueOf(value.toString()))
                },
            )
        }

        return Optional.empty()
    }
}
