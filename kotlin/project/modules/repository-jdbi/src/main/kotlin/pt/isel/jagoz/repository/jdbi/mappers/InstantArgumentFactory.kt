package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.argument.Argument
import org.jdbi.v3.core.argument.ArgumentFactory
import org.jdbi.v3.core.config.ConfigRegistry
import java.lang.reflect.Type
import java.sql.Timestamp
import java.util.Optional

class InstantArgumentFactory : ArgumentFactory {
    override fun build(
        type: Type,
        value: Any?,
        config: ConfigRegistry?,
    ): Optional<Argument> {
        return if (type == Instant::class.java && value is Instant) {
            Optional.of(
                Argument { position, statement, _ ->
                    val timestamp = Timestamp.from(java.time.Instant.ofEpochMilli(value.toEpochMilliseconds()))
                    statement.setTimestamp(position, timestamp)
                },
            )
        } else {
            Optional.empty()
        }
    }
}