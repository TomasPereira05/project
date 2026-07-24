plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    implementation(project(":domain"))
    implementation(project(":services"))
    implementation(libs.kotlinx.datetime)

    implementation("org.springframework:spring-webmvc")
    compileOnly(libs.jakarta.servlet.api)

    implementation(libs.slf4j.api)
    implementation("org.springframework.boot:spring-boot-starter-validation")
    testImplementation(kotlin("test"))
    implementation(kotlin("stdlib"))
}

tasks.test {
    useJUnitPlatform()
}

// Módulo de biblioteca: o entry point Spring Boot vive no host, por isso não há bootJar aqui.
tasks.bootJar {
    enabled = false
}
kotlin {
    jvmToolchain(21)
}
repositories {
    mavenCentral()
}
