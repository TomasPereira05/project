plugins {
    kotlin("jvm")
}

group = "pt.isel"
version = "0.0.1-SNAPSHOT"

dependencies {
    api(project(":domain"))
    api(project(":repository"))

    implementation(libs.jakarta.inject.api)
    implementation(libs.slf4j.api)

    testImplementation(project(":repository-jdbi"))
    testImplementation(libs.jdbi.core)
    testImplementation(libs.postgresql)

    testImplementation(kotlin("test"))

    implementation(libs.kotlinx.datetime)
    implementation(libs.stripe.java)
    implementation(libs.gson)

    // QR dos bilhetes (Fase 4): core gera a matriz, javase renderiza para PNG (MatrixToImageWriter)
    implementation(libs.zxing.core)
    implementation(libs.zxing.javase)

    // Bilhete em PDF (anexo do email): renderiza um documento XHTML -> PDF, reutilizando a
    // mesma abordagem de template HTML do recibo de pagamento.
    implementation(libs.openhtmltopdf.pdfbox)
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
