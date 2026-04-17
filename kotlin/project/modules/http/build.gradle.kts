plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot") version "3.5.5"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    implementation(project(":domain"))
    implementation(project(":services"))
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

    implementation("org.springframework:spring-webmvc")
    compileOnly("jakarta.servlet:jakarta.servlet-api:6.1.0")

    implementation("org.slf4j:slf4j-api:2.0.16")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    testImplementation(kotlin("test"))
    implementation(kotlin("stdlib"))
}

tasks.test {
    useJUnitPlatform()
    if (System.getenv("DB_URL") == null) {
        environment("DB_URL", "jdbc:postgresql://localhost:5433/jagoz?user=postgres&password=mscx2003")
    }
}
kotlin {
    jvmToolchain(21)
}
repositories {
    mavenCentral()
}
