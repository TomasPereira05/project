subprojects {
    apply(plugin = "org.jlleitschuh.gradle.ktlint")
    repositories {
        mavenCentral()
    }
    // Fallback local para os testes que falam com a BD de testes em Docker (porta 5433).
    // Definido uma unica vez aqui; em CI o DB_URL vem do ambiente.
    tasks.withType<Test>().configureEach {
        if (System.getenv("DB_URL") == null) {
            environment("DB_URL", "jdbc:postgresql://localhost:5433/jagoz?user=postgres&password=mscx2003")
        }
    }
}
tasks.register<Exec>("composeDown") {
    commandLine("docker", "compose", "down")
}
extra["composeFileDir"] = layout.projectDirectory
println("composeFileDir - ${layout.projectDirectory}")
