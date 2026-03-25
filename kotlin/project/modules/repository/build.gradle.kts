plugins {
    kotlin("jvm")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    api(project(":domain"))

    testImplementation(kotlin("test"))

    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.0")
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(21)
}
