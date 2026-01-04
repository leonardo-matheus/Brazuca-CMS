package com.brazucacms.service;

import com.brazucacms.dto.auth.AuthResponse;
import com.brazucacms.dto.auth.LoginRequest;
import com.brazucacms.dto.auth.RegisterRequest;
import com.brazucacms.dto.user.UserResponse;
import com.brazucacms.exception.BadRequestException;
import com.brazucacms.exception.DuplicateResourceException;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.*;
import com.brazucacms.repository.*;
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
import java.util.Locale;
import java.text.Normalizer;

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
    private final CompanyRepository companyRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * Registra um novo usuário no sistema.
     * Cria automaticamente uma empresa e workspace para o novo usuário.
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

        // 1. Criar a empresa para o novo usuário
        String companyName = request.getName() + "'s Company";
        String companySlug = generateUniqueSlug(companyName, "company");
        
        Company company = Company.builder()
                .name(companyName)
                .slug(companySlug)
                .description("Empresa de " + request.getName())
                .plan(Company.CompanyPlan.STARTER)
                .status(Company.CompanyStatus.ACTIVE)
                .contactEmail(request.getEmail())
                .build();
        company = companyRepository.save(company);
        log.info("Empresa criada: {} (ID: {})", company.getName(), company.getId());

        // 2. Criar o usuário como COMPANY_OWNER
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.COMPANY_OWNER)
                .company(company)
                .active(true)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);
        log.info("Usuário registrado: {} (ID: {}) como COMPANY_OWNER", user.getEmail(), user.getId());

        // 3. Criar workspace padrão
        String workspaceName = "Meu Projeto";
        String workspaceSlug = generateUniqueSlug(workspaceName + "-" + user.getId(), "workspace");
        
        Workspace workspace = Workspace.builder()
                .name(workspaceName)
                .slug(workspaceSlug)
                .description("Workspace principal de " + request.getName())
                .company(company)
                .owner(user)
                .plan(Workspace.Plan.FREE)
                .status(Workspace.WorkspaceStatus.ACTIVE)
                .storageUsed(0L)
                .storageLimit(1000L)
                .build();
        workspace = workspaceRepository.save(workspace);
        log.info("Workspace criado: {} (ID: {})", workspace.getName(), workspace.getId());

        // 4. Adicionar usuário como membro do workspace (ADMIN)
        WorkspaceMember membership = WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .role(WorkspaceMember.MemberRole.ADMIN)
                .build();
        workspaceMemberRepository.save(membership);

        // 5. Criar assinatura gratuita (plano Starter)
        SubscriptionPlan starterPlan = subscriptionPlanRepository.findByName("starter")
                .orElse(null);
        
        if (starterPlan != null) {
            Subscription subscription = Subscription.builder()
                    .company(company)
                    .plan(starterPlan)
                    .status(Subscription.SubscriptionStatus.ACTIVE)
                    .billingInterval(Subscription.BillingInterval.MONTHLY)
                    .currentPeriodStart(LocalDateTime.now())
                    .currentPeriodEnd(LocalDateTime.now().plusYears(100)) // Free plan never expires
                    .cancelAtPeriodEnd(false)
                    .build();
            subscriptionRepository.save(subscription);
            log.info("Assinatura Starter criada para empresa: {}", company.getName());
        }

        // Gera tokens (sessão normal - 1 dia)
        String accessToken = jwtTokenProvider.generateAccessToken(user, false);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user, false);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                getExpirationSeconds(false),
                UserResponse.fromEntity(user)
        );
    }

    /**
     * Gera um slug único baseado no nome.
     */
    private String generateUniqueSlug(String name, String type) {
        String baseSlug = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        
        String slug = baseSlug;
        int counter = 1;
        
        if ("company".equals(type)) {
            while (companyRepository.existsBySlug(slug)) {
                slug = baseSlug + "-" + counter++;
            }
        } else {
            while (workspaceRepository.existsBySlug(slug)) {
                slug = baseSlug + "-" + counter++;
            }
        }
        
        return slug;
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
