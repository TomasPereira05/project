plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"
description = "jagoz"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

dependencies {
    implementation(project(":http"))
    implementation(project(":services"))
    implementation(project(":repository-jdbi"))

    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-mail")

    implementation("org.jdbi:jdbi3-core:3.37.1")
    implementation("org.postgresql:postgresql:42.7.2")

    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.4.1")

    implementation("org.springframework.security:spring-security-core:6.5.4")
    implementation("software.amazon.awssdk:s3:2.30.31")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webflux")
    testImplementation(kotlin("test"))
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    if (System.getenv("DB_URL") == null) {
        environment("DB_URL", "jdbc:postgresql://localhost:5433/jagoz?user=postgres&password=mscx2003")
    }
    dependsOn(":repository-jdbi:dbTestsWait")
    finalizedBy(":repository-jdbi:dbTestsDown")
}

tasks.register<Copy>("extractUberJar") {
    dependsOn("assemble")
    // opens the JAR containing everything...
    from(
        zipTree(
            layout.buildDirectory
                .file("libs/host-$version.jar")
                .get()
                .toString(),
        ),
    )
    // ... into the 'build/dependency' folder
    into("build/dependency")
}

val dockerImageTagJvm = "jagoz-jvm"
val dockerImageTagNginx = "jagoz-nginx"
val dockerImageTagPostgresTest = "jagoz-postgres-test"
val dockerImageTagUbuntu = "jagoz-ubuntu"

tasks.register<Exec>("buildImageJvm") {
    dependsOn("extractUberJar")
    commandLine("docker", "build", "-t", dockerImageTagJvm, "-f", "tests/Dockerfile-jvm", ".")
}

tasks.register<Exec>("buildImageNginx") {
    commandLine("docker", "build", "-t", dockerImageTagNginx, "-f", "tests/Dockerfile-nginx", ".")
}

tasks.register<Exec>("buildImagePostgresTest") {
    commandLine(
        "docker",
        "build",
        "-t",
        dockerImageTagPostgresTest,
        "-f",
        "tests/Dockerfile-postgres-test",
        "../repository-jdbi",
    )
}

tasks.register<Exec>("buildImageUbuntu") {
    commandLine("docker", "build", "-t", dockerImageTagUbuntu, "-f", "tests/Dockerfile-ubuntu", ".")
}

tasks.register("buildImageAll") {
    dependsOn("buildImageJvm")
    dependsOn("buildImageNginx")
    dependsOn("buildImagePostgresTest")
    dependsOn("buildImageUbuntu")
}

tasks.register<Exec>("allUp") {
    val composeFileDir: Directory by parent!!.extra
    commandLine("docker", "compose", "-f", composeFileDir.file("docker-compose.yml").toString(), "up", "--force-recreate", "-d")
}

tasks.register<Exec>("allDown") {
    val composeFileDir: Directory by parent!!.extra
    commandLine("docker", "compose", "-f", composeFileDir.file("docker-compose.yml").toString(), "down", "--remove-orphans")
}
