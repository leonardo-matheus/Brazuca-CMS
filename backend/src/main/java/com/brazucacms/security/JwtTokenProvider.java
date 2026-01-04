package com.brazucacms.security;

import com.brazucacms.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Provedor de tokens JWT para autenticação.
 * 
 * Esta classe é responsável por:
 * - Gerar access tokens (curta duração) para autenticação
 * - Gerar refresh tokens (longa duração) para renovação
 * - Validar tokens recebidos nas requisições
 * - Extrair informações dos tokens (email, userId, role)
 * 
 * Configurações de duração:
 * - Sessão normal: 1 dia (access) / 7 dias (refresh)
 * - Remember Me: 30 dias (access) / 60 dias (refresh)
 * 
 * @author Brazuca CMS Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class JwtTokenProvider {

    // Chave secreta para assinatura dos tokens (injetada do application.properties)
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Tempo de expiração do access token - sessão normal: 1 dia (em ms)
    private static final Long ACCESS_TOKEN_EXPIRATION = 24 * 60 * 60 * 1000L; // 1 dia
    
    // Tempo de expiração do access token - remember me: 30 dias (em ms)
    private static final Long ACCESS_TOKEN_REMEMBER_ME = 30 * 24 * 60 * 60 * 1000L; // 30 dias
    
    // Tempo de expiração do refresh token - sessão normal: 7 dias (em ms)
    private static final Long REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000L; // 7 dias
    
    // Tempo de expiração do refresh token - remember me: 60 dias (em ms)
    private static final Long REFRESH_TOKEN_REMEMBER_ME = 60 * 24 * 60 * 60 * 1000L; // 60 dias

    /**
     * Obtém a chave de assinatura para o algoritmo HMAC-SHA.
     * A chave é derivada do segredo JWT configurado.
     * 
     * @return SecretKey para assinatura/verificação de tokens
     */
    private SecretKey getSigningKey() {
        // Codifica a chave secreta em Base64 e gera uma SecretKey HMAC
        byte[] keyBytes = Decoders.BASE64.decode(
                java.util.Base64.getEncoder().encodeToString(jwtSecret.getBytes())
        );
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Gera um access token JWT para o usuário (sessão normal - 1 dia).
     * 
     * @param user Usuário para o qual gerar o token
     * @return String contendo o JWT access token
     */
    public String generateAccessToken(User user) {
        return generateAccessToken(user, false);
    }

    /**
     * Gera um access token JWT para o usuário.
     * 
     * O access token é usado para autenticar requisições à API.
     * - Sessão normal: 1 dia
     * - Remember Me: 30 dias
     * 
     * Claims incluídos no token:
     * - sub: Email do usuário (subject)
     * - userId: ID do usuário no banco
     * - role: Papel/permissão do usuário
     * - name: Nome do usuário
     * - companyId: ID da empresa (se houver)
     * - rememberMe: Se é sessão extendida
     * - iat: Data de emissão
     * - exp: Data de expiração
     * 
     * @param user Usuário para o qual gerar o token
     * @param rememberMe Se true, token dura 30 dias
     * @return String contendo o JWT access token
     */
    public String generateAccessToken(User user, boolean rememberMe) {
        long expiration = rememberMe ? ACCESS_TOKEN_REMEMBER_ME : ACCESS_TOKEN_EXPIRATION;
        log.debug("Gerando access token para usuário: {} (rememberMe: {}, expira em {} dias)", 
                user.getEmail(), rememberMe, expiration / (24 * 60 * 60 * 1000));
        return generateToken(user, expiration, rememberMe);
    }

    /**
     * Gera um refresh token JWT para o usuário (sessão normal - 7 dias).
     * 
     * @param user Usuário para o qual gerar o token
     * @return String contendo o JWT refresh token
     */
    public String generateRefreshToken(User user) {
        return generateRefreshToken(user, false);
    }

    /**
     * Gera um refresh token JWT para o usuário.
     * 
     * O refresh token é usado para obter novos access tokens
     * sem necessidade de re-autenticação com senha.
     * - Sessão normal: 7 dias
     * - Remember Me: 60 dias
     * 
     * @param user Usuário para o qual gerar o token
     * @param rememberMe Se true, token dura 60 dias
     * @return String contendo o JWT refresh token
     */
    public String generateRefreshToken(User user, boolean rememberMe) {
        long expiration = rememberMe ? REFRESH_TOKEN_REMEMBER_ME : REFRESH_TOKEN_EXPIRATION;
        log.debug("Gerando refresh token para usuário: {} (rememberMe: {}, expira em {} dias)", 
                user.getEmail(), rememberMe, expiration / (24 * 60 * 60 * 1000));
        return generateToken(user, expiration, rememberMe);
    }

    /**
     * Método interno para geração de tokens JWT.
     * 
     * @param user Usuário para incluir nas claims
     * @param expiration Tempo de expiração em milissegundos
     * @param rememberMe Se é sessão extendida
     * @return Token JWT assinado
     */
    private String generateToken(User user, Long expiration, boolean rememberMe) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        var builder = Jwts.builder()
                // Subject: Email do usuário (identificador principal)
                .subject(user.getEmail())
                // Claims customizadas
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("name", user.getName())
                .claim("rememberMe", rememberMe);
        
        // Adiciona companyId se usuário pertencer a uma empresa
        if (user.getCompany() != null) {
            builder.claim("companyId", user.getCompany().getId());
        }
        
        return builder
                // Timestamps
                .issuedAt(now)
                .expiration(expiryDate)
                // Assinatura com a chave secreta
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extrai o email (subject) de um token JWT.
     * 
     * @param token Token JWT válido
     * @return Email do usuário
     * @throws JwtException se o token for inválido
     */
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    /**
     * Extrai o ID do usuário de um token JWT.
     * 
     * @param token Token JWT válido
     * @return ID do usuário
     * @throws JwtException se o token for inválido
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("userId", Long.class);
    }

    /**
     * Extrai o papel (role) do usuário de um token JWT.
     * 
     * @param token Token JWT válido
     * @return Role do usuário como String
     * @throws JwtException se o token for inválido
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("role", String.class);
    }

    /**
     * Valida um token JWT.
     * 
     * Verifica:
     * - Assinatura do token
     * - Data de expiração
     * - Formato do token
     * 
     * @param token Token JWT a ser validado
     * @return true se o token for válido, false caso contrário
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException ex) {
            log.error("Token JWT malformado: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Token JWT expirado: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Token JWT não suportado: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("Claims JWT vazias: {}", ex.getMessage());
        } catch (SecurityException ex) {
            log.error("Falha na validação da assinatura JWT: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Verifica se o token foi gerado com "Remember Me".
     * 
     * @param token Token JWT válido
     * @return true se foi gerado com rememberMe, false caso contrário
     */
    public boolean isRememberMeToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Boolean rememberMe = claims.get("rememberMe", Boolean.class);
            return rememberMe != null && rememberMe;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Extrai o ID da empresa do token (se houver).
     * 
     * @param token Token JWT válido
     * @return ID da empresa ou null
     */
    public Long getCompanyIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("companyId", Long.class);
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Retorna o tempo de expiração do access token em segundos.
     * 
     * @param rememberMe Se é sessão extendida
     * @return Tempo de expiração em segundos
     */
    public Long getAccessTokenExpiration(boolean rememberMe) {
        return (rememberMe ? ACCESS_TOKEN_REMEMBER_ME : ACCESS_TOKEN_EXPIRATION) / 1000;
    }

    /**
     * Retorna o tempo de expiração do access token padrão em segundos.
     * 
     * @return Tempo de expiração em segundos
     */
    public Long getAccessTokenExpiration() {
        return ACCESS_TOKEN_EXPIRATION / 1000;
    }

    /**
     * Retorna o tempo de expiração do refresh token em segundos.
     * 
     * @param rememberMe Se é sessão extendida
     * @return Tempo de expiração em segundos
     */
    public Long getRefreshTokenExpiration(boolean rememberMe) {
        return (rememberMe ? REFRESH_TOKEN_REMEMBER_ME : REFRESH_TOKEN_EXPIRATION) / 1000;
    }
}
