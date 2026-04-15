package pt.isel.jagoz.host.config

import org.jdbi.v3.core.Jdbi
import org.postgresql.ds.PGSimpleDataSource
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import pt.isel.jagoz.configureWithAppRequirements
import pt.isel.jagoz.host.Environment

@Configuration
@ComponentScan(basePackages = ["pt.isel.jagoz"])
class JdbiConfig {
    @Bean
    fun jdbi() =
        Jdbi.create(
            PGSimpleDataSource().apply {
                setURL(Environment.getDbUrl())
            },
        ).configureWithAppRequirements()
}
