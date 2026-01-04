package com.brazucacms.service;

import com.brazucacms.dto.auth.AuthResponse;
import com.brazucacms.dto.auth.LoginRequest;
import com.brazucacms.dto.auth.RegisterRequest;
import com.brazucacms.dto.user.UserResponse;
import com.brazucacms.exception.BadRequestException;
import com.brazucacms.exception.DuplicateResourceException;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.User;
import com.brazucacms.repository.UserRepository;
import com.brazucacms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Serviço de autenticação.
 * 
 * Gerencia:
 * - Login com opção "Lembrar de mim" (30 dias vs 1 dia)
 * - Registro de novos usuários
 * - Refresh de tokens
 * - Verificação de usuário atual
 * 
 * @author Brazuca CMS
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * Registra um novo usuário no sistema.
     * 
     * @param request Dados de registro
     * @return AuthResponse com tokens e dados do usuário
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registrando novo usuário: {}", request.getEmail());
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email já cadastrado: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .active(true)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Usuário registrado: {} (ID: {})", savedUser.getEmail(), savedUser.getId());

        // Gera tokens (sessão normal - 1 dia)
        String accessToken = jwtTokenProvider.generateAccessToken(savedUser, false);
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser, false);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                getExpirationSeconds(false),
                UserResponse.fromEntity(savedUser)
        );
    }

    /**
     * Realiza login do usuário.
     * 
     * @param request Dados de login (email, senha, rememberMe)
     * @return AuthResponse com tokens e dados do usuário
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login: {} (rememberMe: {})", request.getEmail(), request.getRememberMe());
        
        // Autentica com Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        
        // Verifica se usuário está ativo
        if (!user.getActive()) {
            throw new BadRequestException("Usuário desativado. Contate o administrador.");
        }
        
        // Verifica se empresa está ativa (se pertencer a uma)
        if (user.getCompany() != null && 
            user.getCompany().getStatus() != com.brazucacms.model.Company.CompanyStatus.ACTIVE) {
            throw new BadRequestException("Empresa suspensa ou inativa. Contate o administrador.");
        }

        // Atualiza último login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Determina duração da sessão
        boolean rememberMe = request.getRememberMe() != null && request.getRememberMe();
        
        // Gera tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user, rememberMe);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user, rememberMe);

        log.info("Login realizado: {} | Sessão: {} dias", 
                user.getEmail(), rememberMe ? 30 : 1);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                getExpirationSeconds(rememberMe),
                UserResponse.fromEntity(user)
        );
    }

    /**
     * Renova tokens usando refresh token.
     * 
     * @param refreshToken Token de refresh válido
     * @return AuthResponse com novos tokens
     */
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        log.debug("Renovando tokens");
        
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Refresh token inválido ou expirado");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        // Verifica se usuário está ativo
        if (!user.getActive()) {
            throw new BadRequestException("Usuário desativado");
        }

        // Mantém a configuração de rememberMe do token original
        boolean rememberMe = jwtTokenProvider.isRememberMeToken(refreshToken);
        
        String newAccessToken = jwtTokenProvider.generateAccessToken(user, rememberMe);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user, rememberMe);

        log.debug("Tokens renovados para: {}", user.getEmail());

        return AuthResponse.of(
                newAccessToken,
                newRefreshToken,
                getExpirationSeconds(rememberMe),
                UserResponse.fromEntity(user)
        );
    }

    /**
     * Retorna dados do usuário atual.
     * 
     * @param email Email do usuário
     * @return UserResponse com dados do usuário
     */
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return UserResponse.fromEntity(user);
    }
    
    /**
     * Retorna tempo de expiração em segundos.
     * 
     * @param rememberMe Se é sessão extendida
     * @return Tempo em segundos
     */
    private Long getExpirationSeconds(boolean rememberMe) {
        // 30 dias ou 1 dia em segundos
        return rememberMe ? 30 * 24 * 60 * 60L : 24 * 60 * 60L;
    }
}
