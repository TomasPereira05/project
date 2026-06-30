plugins {
    kotlin("jvm")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    api(project(":domain"))
    api(project(":repository"))

    implementation("jakarta.inject:jakarta.inject-api:2.0.1")
    implementation("org.slf4j:slf4j-api:2.0.16")

    testImplementation(project(":repository-jdbi"))
    testImplementation("org.jdbi:jdbi3-core:3.37.1")
    testImplementation("org.postgresql:postgresql:42.7.2")

    testImplementation(kotlin("test"))

    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.0")
    implementation("com.stripe:stripe-java:31.3.0")
    implementation("com.google.code.gson:gson:2.11.0")

    // QR dos bilhetes (Fase 4): core gera a matriz, javase renderiza para PNG (MatrixToImageWriter)
    implementation("com.google.zxing:core:3.5.3")
    implementation("com.google.zxing:javase:3.5.3")

    // Bilhete em PDF (anexo do email): renderiza um documento XHTML -> PDF, reutilizando a
    // mesma abordagem de template HTML do recibo de pagamento.
    implementation("com.openhtmltopdf:openhtmltopdf-pdfbox:1.0.10")
}

// Source set isolado para o preview do bilhete (não mistura com os testes, que dependem de DB).
sourceSets {
    create("preview")
}
configurations["previewImplementation"].extendsFrom(configurations["implementation"])
configurations["previewRuntimeOnly"].extendsFrom(configurations["runtimeOnly"])

// Gera um PDF de bilhete de exemplo para inspeção visual (não envia email nem corre testes).
//   ./gradlew :services:ticketPreview            -> bilhete-sample.pdf na raiz do projeto
//   ./gradlew :services:ticketPreview -Pout=...  -> caminho à escolha
tasks.register<JavaExec>("ticketPreview") {
    group = "verification"
    description = "Gera um PDF de bilhete de exemplo para inspeção visual do layout."
    dependsOn("previewClasses")
    classpath = sourceSets["preview"].runtimeClasspath + sourceSets["main"].output
    mainClass.set("preview.TicketPreviewKt")
    args((project.findProperty("out") as String?) ?: "${rootProject.projectDir}/bilhete-sample.pdf")
}

tasks.test {
    useJUnitPlatform()
    if (System.getenv("DB_URL") == null) {
        environment("DB_URL", "jdbc:postgresql://localhost:5433/jagoz?user=postgres&password=mscx2003")
    }
    dependsOn(":repository-jdbi:dbTestsWait")
    finalizedBy(":repository-jdbi:dbTestsDown")
}
kotlin {
    jvmToolchain(21)
    // Dá ao source set 'preview' acesso 'internal' ao main (renderTicketPdf) e herda o seu classpath.
    target {
        compilations.getByName("preview").associateWith(compilations.getByName("main"))
    }
}
