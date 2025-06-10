package com.dev.productmanagementsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.dev.productmanagementsystem.repositories")
@EntityScan(basePackages = "com.dev.productmanagementsystem.entities")
public class ProductManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductManagementSystemApplication.class, args);
    }

    @Configuration
    public static class WebConfig implements WebMvcConfigurer {

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            // Spring Boot automatically serves from classpath:/static/
            // But we can add explicit handlers for better control
            registry.addResourceHandler("/**")
                    .addResourceLocations("classpath:/static/")
                    .setCachePeriod(0); // Disable caching for development

            // Serve CSS files specifically
            registry.addResourceHandler("/css/**")
                    .addResourceLocations("classpath:/static/css/");

            // Serve JS files specifically
            registry.addResourceHandler("/js/**")
                    .addResourceLocations("classpath:/static/js/");

            // Serve any other assets
            registry.addResourceHandler("/assets/**")
                    .addResourceLocations("classpath:/static/assets/");
        }

        @Override
        public void addViewControllers(ViewControllerRegistry registry) {
            // Map root URL to index.html
            registry.addViewController("/").setViewName("forward:/index.html");
        }
    }
}