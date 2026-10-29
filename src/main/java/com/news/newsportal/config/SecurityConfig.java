package com.news.newsportal.config;

import com.news.newsportal.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // BCrypt hashing với strength=12
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow Static Frontend Files & Public API
                .requestMatchers("/", "/index.html", "/article-detail.html", "/category.html", "/search.html", "/admin.html", "/user.html").permitAll()
                .requestMatchers("/css/**", "/js/**", "/images/**", "/uploads/**", "/favicon.ico").permitAll()
                .requestMatchers("/api/v1/auth/**", "/api/v1/users/auth/**", "/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/public/**", "/api/v1/news/**", "/api/public/**", "/api/posts/**", "/api/comments/**", "/api/v1/comments/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/public/**", "/api/v1/news/advertisements/**", "/api/v1/user/history/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/comments", "/api/comments/**", "/api/v1/comments", "/api/v1/comments/**", "/api/v1/news/comments").authenticated()
                
                // Role Based Endpoint Protection (RBAC) - Admin có toàn quyền mọi module
                .requestMatchers("/api/v1/admin/users/**", "/api/admin/users/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/v1/admin/settings/**", "/api/admin/settings/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/v1/admin/categories/**", "/api/admin/categories/**").hasAnyRole("SUPER_ADMIN", "EDITOR_IN_CHIEF")
                .requestMatchers("/api/v1/admin/advertisements/**", "/api/admin/advertisements/**").hasAnyRole("SUPER_ADMIN", "EDITOR_IN_CHIEF")
                .requestMatchers("/api/v1/admin/polls/**", "/api/admin/polls/**").hasAnyRole("SUPER_ADMIN", "EDITOR_IN_CHIEF", "EDITOR")
                .requestMatchers("/api/v1/admin/comments/**", "/api/admin/comments/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/v1/admin/posts/**", "/api/admin/posts/**").hasAnyRole("SUPER_ADMIN", "EDITOR_IN_CHIEF", "EDITOR", "AUTHOR")
                .requestMatchers("/api/v1/admin/dashboard/**", "/api/admin/dashboard/**", "/api/v1/admin/media/**", "/api/admin/media/**").hasAnyRole("SUPER_ADMIN", "EDITOR_IN_CHIEF", "EDITOR", "AUTHOR")
                .requestMatchers("/api/v1/admin/**", "/api/admin/**").hasRole("SUPER_ADMIN")
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
