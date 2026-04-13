package pt.isel.jagoz.config

import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
@ComponentScan(basePackages = ["pt.isel.jagoz"])
class PipelineConfig() : WebMvcConfigurer
