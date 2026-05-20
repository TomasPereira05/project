package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.toJavaLocalDateTime
import org.jdbi.v3.core.argument.Argument
import org.jdbi.v3.core.argument.ArgumentFactory
import org.jdbi.v3.core.config.ConfigRegistry
import java.lang.reflect.Type
import java.sql.Timestamp
import java.util.Optional

class LocalDateTimeArgumentFactory : ArgumentFactory {
    override fun build(
        type: Type,
        value: Any?,
        config: ConfigRegistry,
    ): Optional<Argument> {
        if (value is LocalDateTime) {
            return Optional.of(
                Argument { position, stmt, _ ->
                    stmt.setTimestamp(position, Timestamp.valueOf(value.toJavaLocalDateTime()))
                },
            )
        }

        return Optional.empty()
    }
}
