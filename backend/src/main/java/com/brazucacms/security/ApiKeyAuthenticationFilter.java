package com.brazucacms.security;

import com.brazucacms.model.ApiKey;
import com.brazucacms.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Only apply to /api/v1/** endpoints (public API)
        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = getApiKeyFromRequest(request);

        if (StringUtils.hasText(apiKey)) {
            ApiKey validatedKey = apiKeyService.validateApiKey(apiKey);

            if (validatedKey != null) {
                String authority = switch (validatedKey.getType()) {
                    case FULL_ACCESS -> "ROLE_API_FULL";
                    case READ_WRITE -> "ROLE_API_WRITE";
                    case READ_ONLY -> "ROLE_API_READ";
                };

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                validatedKey.getOwner().getEmail(),
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority(authority))
                        );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getApiKeyFromRequest(HttpServletRequest request) {
        // Check X-API-Key header first
        String apiKey = request.getHeader("X-API-Key");
        
        if (!StringUtils.hasText(apiKey)) {
            // Check Authorization header with ApiKey prefix
            String authHeader = request.getHeader("Authorization");
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("ApiKey ")) {
                apiKey = authHeader.substring(7);
            }
        }

        if (!StringUtils.hasText(apiKey)) {
            // Check query parameter
            apiKey = request.getParameter("api_key");
        }

        return apiKey;
    }
}
