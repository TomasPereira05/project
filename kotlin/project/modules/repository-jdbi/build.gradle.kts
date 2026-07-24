plugins {
    kotlin("jvm")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    api(project(":repository"))
    implementation(libs.jakarta.inject.api)

    implementation(libs.jdbi.core)
    implementation(libs.jdbi.kotlin)
    implementation(libs.jdbi.postgres)
    implementation(libs.postgresql)

    implementation(libs.jackson.databind)
    implementation(libs.jackson.module.kotlin)

    implementation("org.jetbrains.kotlin:kotlin-reflect")

    implementation(libs.kotlinx.datetime)

    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
    dependsOn(":repository-jdbi:dbTestsWait")
    finalizedBy(":repository-jdbi:dbTestsDown")
}
kotlin {
    jvmToolchain(21)
}

val composeFileDir: Directory by parent!!.extra
println("composeFileDir - $composeFileDir")
val dockerComposePath = composeFileDir.file("docker-compose.yml").toString()

tasks.register<Exec>("dbTestsUp") {
    commandLine("docker", "compose", "-f", dockerComposePath, "up", "-d", "--build", "--force-recreate", "db-tests")
}

tasks.register<Exec>("dbTestsWait") {
    commandLine("docker", "exec", "db-tests", "/app/bin/wait-for-postgres.sh", "localhost")
    dependsOn("dbTestsUp")
}

tasks.register<Exec>("dbTestsDown") {
    commandLine("docker", "compose", "-f", dockerComposePath, "down", "--remove-orphans")
}
