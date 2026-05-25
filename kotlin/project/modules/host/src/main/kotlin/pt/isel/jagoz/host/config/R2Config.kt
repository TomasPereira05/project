package pt.isel.jagoz.host.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import pt.isel.jagoz.host.storage.R2FileStorage
import pt.isel.jagoz.service.files.FileStorage
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration
import java.net.URI

data class R2Properties(
    val endpoint: String,
    val accessKeyId: String,
    val secretAccessKey: String,
    val bucket: String,
)

@Configuration
class R2Config {
    @Bean
    fun r2Properties(env: Environment): R2Properties =
        R2Properties(
            endpoint = env.getRequiredProperty("R2_ENDPOINT"),
            accessKeyId = env.getRequiredProperty("R2_ACCESS_KEY_ID"),
            secretAccessKey = env.getRequiredProperty("R2_SECRET_ACCESS_KEY"),
            bucket = env.getRequiredProperty("R2_BUCKET"),
        )

    @Bean
    fun r2S3Client(properties: R2Properties): S3Client =
        S3Client
            .builder()
            .endpointOverride(URI.create(properties.endpoint))
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(properties.accessKeyId, properties.secretAccessKey),
                ),
            ).region(Region.of("auto"))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .build()

    @Bean
    fun fileStorage(
        s3Client: S3Client,
        properties: R2Properties,
    ): FileStorage = R2FileStorage(s3Client, properties.bucket)
}
