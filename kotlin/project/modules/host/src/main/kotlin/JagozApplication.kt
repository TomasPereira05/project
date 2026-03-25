package pt.isel

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class JagozApplication

fun main(args: Array<String>) {
	runApplication<JagozApplication>(*args)
}
