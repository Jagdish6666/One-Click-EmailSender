package com.project.certificates.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
        private String allowedOrigins;

        @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
        private String jwkSetUri;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/", "/error", "/favicon.ico").permitAll()
                                                .requestMatchers("/api/debug/**").permitAll()
                                                // Allow creating participants without authentication (public signup)
                                                .requestMatchers(HttpMethod.POST, "/api/participants").permitAll()
                                                // All other API endpoints require authentication
                                                .requestMatchers("/api/participants/**", "/api/certificates/**",
                                                                "/api/templates/**")
                                                .authenticated()
                                                .anyRequest().authenticated());

                // Only configure JWT validation if a JWKS URI is provided
                if (jwkSetUri != null && !jwkSetUri.isBlank()) {
                        http.oauth2ResourceServer(oauth2 -> oauth2
                                        .jwt(jwt -> jwt.jwtAuthenticationConverter(
                                                        jwtAuthenticationConverter())));
                }

                return http.build();
        }

        @Bean
        public JwtAuthenticationConverter jwtAuthenticationConverter() {
                JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
                grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
                grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");

                JwtAuthenticationConverter authenticationConverter = new JwtAuthenticationConverter();
                authenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
                return authenticationConverter;
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
