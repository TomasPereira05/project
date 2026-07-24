plugins {
    kotlin("jvm")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    implementation(libs.kotlinx.datetime)

    testImplementation(kotlin("test"))
    api(libs.spring.security.core)
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(21)
}
