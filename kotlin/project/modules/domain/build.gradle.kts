plugins {
    kotlin("jvm")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

    testImplementation(kotlin("test"))
    api("org.springframework.security:spring-security-core:6.5.5")
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(21)
}