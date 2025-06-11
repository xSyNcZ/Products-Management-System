package com.dev.productmanagementsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.dev.productmanagementsystem.repositories")
@EntityScan(basePackages = "com.dev.productmanagementsystem.entities")
@ComponentScan(basePackages = {
        "com.dev.productmanagementsystem.controllers",
        "com.dev.productmanagementsystem.services",
        "com.dev.productmanagementsystem.repositories",
        "com.dev.productmanagementsystem.entities",
        "com.dev.productmanagementsystem.dto",
})
public class ProductManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductManagementSystemApplication.class, args);
    }

    @Configuration
    public static class WebConfig implements WebMvcConfigurer {

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            // Only handle specific static resource patterns
            // This prevents /** from intercepting API calls

            registry.addResourceHandler("/css/**")
                    .addResourceLocations("classpath:/static/css/")
                    .setCachePeriod(0);

            registry.addResourceHandler("/js/**")
                    .addResourceLocations("classpath:/static/js/")
                    .setCachePeriod(0);

            registry.addResourceHandler("/images/**")
                    .addResourceLocations("classpath:/static/images/")
                    .setCachePeriod(0);

            registry.addResourceHandler("/assets/**")
                    .addResourceLocations("classpath:/static/assets/")
                    .setCachePeriod(0);

            registry.addResourceHandler("/fonts/**")
                    .addResourceLocations("classpath:/static/fonts/")
                    .setCachePeriod(0);

            // Handle specific file types only
            registry.addResourceHandler("/*.html")
                    .addResourceLocations("classpath:/static/");

            registry.addResourceHandler("/*.ico")
                    .addResourceLocations("classpath:/static/");

            registry.addResourceHandler("/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg")
                    .addResourceLocations("classpath:/static/");
        }

        @Override
        public void addViewControllers(ViewControllerRegistry registry) {
            registry.addViewController("/").setViewName("forward:/index.html");
        }
    }
}