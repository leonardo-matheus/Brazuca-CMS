package com.brazucacms.service;

import com.brazucacms.config.InstagramConfig;
import com.brazucacms.dto.social.*;
import com.brazucacms.exception.BadRequestException;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.*;
import com.brazucacms.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Instagram integration using Meta Graph API.
 * 
 * Flow for Instagram Business accounts:
 * 1. User authenticates via Facebook OAuth
 * 2. Get Facebook pages user manages
 * 3. Get Instagram Business account connected to the page
 * 4. Use Instagram Graph API to publish content
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InstagramService {

    private final InstagramConfig config;
    private final SocialMediaAccountRepository accountRepository;
    private final SocialMediaPostRepository postRepository;
    private final EntryRepository entryRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ============ OAuth Flow ============

    /**
     * Generate the OAuth URL for Instagram/Facebook login
     */
    public String getOAuthUrl(String redirectUri, String state) {
        return String.format(
            "https://www.facebook.com/%s/dialog/oauth" +
            "?client_id=%s" +
            "&redirect_uri=%s" +
            "&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management" +
            "&response_type=code" +
            "&state=%s",
            config.getApiVersion(),
            config.getAppId(),
            redirectUri,
            state
        );
    }

    /**
     * Exchange OAuth code for access token and connect Instagram account
     */
    @Transactional
    public SocialMediaAccountResponse connectInstagramAccount(
            Long companyId, 
            Long userId, 
            InstagramConnectRequest request
    ) {
        log.info("Connecting Instagram account for company: {}", companyId);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Step 1: Exchange code for short-lived token
        String shortLivedToken = exchangeCodeForToken(request.getCode(), request.getRedirectUri());

        // Step 2: Exchange for long-lived token (60 days)
        TokenResponse longLivedToken = exchangeForLongLivedToken(shortLivedToken);

        // Step 3: Get Facebook pages
        JsonNode pages = getFacebookPages(longLivedToken.accessToken);
        
        if (pages == null || !pages.has("data") || pages.get("data").isEmpty()) {
            throw new BadRequestException("No Facebook pages found. Please connect a Facebook page to your Instagram Business account.");
        }

        // Step 4: Get first page's Instagram Business Account
        JsonNode firstPage = pages.get("data").get(0);
        String pageId = firstPage.get("id").asText();
        String pageAccessToken = firstPage.get("access_token").asText();

        JsonNode instagramAccount = getInstagramBusinessAccount(pageId, pageAccessToken);
        
        if (instagramAccount == null || !instagramAccount.has("instagram_business_account")) {
            throw new BadRequestException("No Instagram Business account connected to this Facebook page. Please connect one in Facebook Page settings.");
        }

        String instagramAccountId = instagramAccount.get("instagram_business_account").get("id").asText();

        // Step 5: Get Instagram account details
        JsonNode accountDetails = getInstagramAccountDetails(instagramAccountId, pageAccessToken);

        // Step 6: Check if already connected
        if (accountRepository.existsByCompanyIdAndPlatformAccountId(companyId, instagramAccountId)) {
            // Update existing account
            SocialMediaAccount existing = accountRepository
                    .findByCompanyIdAndPlatformAccountId(companyId, instagramAccountId)
                    .orElseThrow();
            
            existing.setAccessToken(pageAccessToken);
            existing.setTokenExpiresAt(LocalDateTime.now().plusDays(60));
            existing.setStatus(SocialMediaAccount.AccountStatus.ACTIVE);
            existing.setAccountUsername(accountDetails.has("username") ? accountDetails.get("username").asText() : null);
            existing.setProfilePictureUrl(accountDetails.has("profile_picture_url") ? accountDetails.get("profile_picture_url").asText() : null);
            existing.setFollowersCount(accountDetails.has("followers_count") ? accountDetails.get("followers_count").asLong() : 0L);
            
            existing = accountRepository.save(existing);
            log.info("Updated Instagram account: @{}", existing.getAccountUsername());
            return SocialMediaAccountResponse.fromEntity(existing);
        }

        // Step 7: Save new account
        SocialMediaAccount account = SocialMediaAccount.builder()
                .platform(SocialMediaAccount.Platform.INSTAGRAM)
                .platformAccountId(instagramAccountId)
                .facebookPageId(pageId)
                .accountUsername(accountDetails.has("username") ? accountDetails.get("username").asText() : null)
                .accessToken(pageAccessToken)
                .tokenExpiresAt(LocalDateTime.now().plusDays(60))
                .status(SocialMediaAccount.AccountStatus.ACTIVE)
                .profilePictureUrl(accountDetails.has("profile_picture_url") ? accountDetails.get("profile_picture_url").asText() : null)
                .followersCount(accountDetails.has("followers_count") ? accountDetails.get("followers_count").asLong() : 0L)
                .company(company)
                .connectedBy(user)
                .totalPosts(0)
                .build();

        account = accountRepository.save(account);
        log.info("Connected Instagram account: @{}", account.getAccountUsername());

        return SocialMediaAccountResponse.fromEntity(account);
    }

    // ============ Publishing ============

    /**
     * Publish a post to Instagram
     */
    @Transactional
    public SocialMediaPostResponse publishToInstagram(Long companyId, Long userId, InstagramPublishRequest request) {
        log.info("Publishing to Instagram for company: {}", companyId);

        SocialMediaAccount account = accountRepository.findByIdAndCompanyId(request.getSocialAccountId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Instagram account not found"));

        if (!account.hasValidToken()) {
            account.setStatus(SocialMediaAccount.AccountStatus.TOKEN_EXPIRED);
            accountRepository.save(account);
            throw new BadRequestException("Instagram token expired. Please reconnect your account.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Entry entry = request.getEntryId() != null 
                ? entryRepository.findById(request.getEntryId()).orElse(null) 
                : null;

        // Create post record
        SocialMediaPost post = SocialMediaPost.builder()
                .socialAccount(account)
                .entry(entry)
                .caption(request.getCaption())
                .mediaUrl(request.getMediaUrl())
                .mediaType(parseMediaType(request.getMediaType()))
                .status(SocialMediaPost.PostStatus.PUBLISHING)
                .createdBy(user)
                .scheduledAt(request.getScheduledAt())
                .build();
        post = postRepository.save(post);

        try {
            // Step 1: Create media container
            String containerId = createMediaContainer(
                    account.getPlatformAccountId(),
                    account.getAccessToken(),
                    request.getMediaUrl(),
                    request.getCaption(),
                    request.getMediaType()
            );

            // Step 2: Wait for container to be ready (Instagram processes media)
            waitForMediaReady(containerId, account.getAccessToken());

            // Step 3: Publish the container
            String postId = publishMediaContainer(
                    account.getPlatformAccountId(),
                    containerId,
                    account.getAccessToken()
            );

            // Step 4: Get post permalink
            String permalink = getPostPermalink(postId, account.getAccessToken());

            // Update post record
            post.setPlatformPostId(postId);
            post.setPermalink(permalink);
            post.setStatus(SocialMediaPost.PostStatus.PUBLISHED);
            post.setPublishedAt(LocalDateTime.now());
            post = postRepository.save(post);

            // Update account stats
            account.setLastPostAt(LocalDateTime.now());
            account.setTotalPosts(account.getTotalPosts() + 1);
            accountRepository.save(account);

            log.info("Published to Instagram: {}", permalink);
            return SocialMediaPostResponse.fromEntity(post);

        } catch (Exception e) {
            log.error("Failed to publish to Instagram: {}", e.getMessage());
            post.setStatus(SocialMediaPost.PostStatus.FAILED);
            post.setErrorMessage(e.getMessage());
            postRepository.save(post);
            throw new BadRequestException("Failed to publish to Instagram: " + e.getMessage());
        }
    }

    // ============ Account Management ============

    /**
     * Get all connected social media accounts for a company
     */
    public List<SocialMediaAccountResponse> getConnectedAccounts(Long companyId) {
        return accountRepository.findByCompanyId(companyId).stream()
                .map(SocialMediaAccountResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get Instagram accounts only
     */
    public List<SocialMediaAccountResponse> getInstagramAccounts(Long companyId) {
        return accountRepository.findByCompanyIdAndPlatform(companyId, SocialMediaAccount.Platform.INSTAGRAM).stream()
                .map(SocialMediaAccountResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Disconnect an account
     */
    @Transactional
    public void disconnectAccount(Long companyId, Long accountId) {
        SocialMediaAccount account = accountRepository.findByIdAndCompanyId(accountId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        
        account.setStatus(SocialMediaAccount.AccountStatus.DISCONNECTED);
        account.setAccessToken(null);
        accountRepository.save(account);
        
        log.info("Disconnected Instagram account: @{}", account.getAccountUsername());
    }

    /**
     * Refresh token if expiring soon
     */
    @Transactional
    public void refreshTokenIfNeeded(Long accountId) {
        SocialMediaAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (account.isTokenExpiringSoon() && account.getAccessToken() != null) {
            try {
                TokenResponse newToken = refreshLongLivedToken(account.getAccessToken());
                account.setAccessToken(newToken.accessToken);
                account.setTokenExpiresAt(LocalDateTime.now().plusDays(60));
                accountRepository.save(account);
                log.info("Refreshed token for @{}", account.getAccountUsername());
            } catch (Exception e) {
                log.error("Failed to refresh token: {}", e.getMessage());
                account.setStatus(SocialMediaAccount.AccountStatus.TOKEN_EXPIRED);
                accountRepository.save(account);
            }
        }
    }

    // ============ Helper Methods ============

    private String exchangeCodeForToken(String code, String redirectUri) {
        String url = config.getGraphApiUrl() + "/oauth/access_token";
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", config.getAppId());
        params.add("client_secret", config.getAppSecret());
        params.add("redirect_uri", redirectUri);
        params.add("code", code);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("access_token").asText();
        } catch (Exception e) {
            throw new BadRequestException("Failed to exchange code for token: " + e.getMessage());
        }
    }

    private TokenResponse exchangeForLongLivedToken(String shortLivedToken) {
        String url = config.getGraphApiUrl() + "/oauth/access_token" +
                "?grant_type=fb_exchange_token" +
                "&client_id=" + config.getAppId() +
                "&client_secret=" + config.getAppSecret() +
                "&fb_exchange_token=" + shortLivedToken;

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return new TokenResponse(
                    json.get("access_token").asText(),
                    json.has("expires_in") ? json.get("expires_in").asLong() : 5184000 // 60 days
            );
        } catch (Exception e) {
            throw new BadRequestException("Failed to exchange for long-lived token: " + e.getMessage());
        }
    }

    private TokenResponse refreshLongLivedToken(String token) {
        String url = config.getGraphApiUrl() + "/oauth/access_token" +
                "?grant_type=fb_exchange_token" +
                "&client_id=" + config.getAppId() +
                "&client_secret=" + config.getAppSecret() +
                "&fb_exchange_token=" + token;

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return new TokenResponse(
                    json.get("access_token").asText(),
                    json.has("expires_in") ? json.get("expires_in").asLong() : 5184000
            );
        } catch (Exception e) {
            throw new BadRequestException("Failed to refresh token: " + e.getMessage());
        }
    }

    private JsonNode getFacebookPages(String accessToken) {
        String url = config.getGraphApiUrl() + "/me/accounts?access_token=" + accessToken;
        
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new BadRequestException("Failed to get Facebook pages: " + e.getMessage());
        }
    }

    private JsonNode getInstagramBusinessAccount(String pageId, String accessToken) {
        String url = config.getGraphApiUrl() + "/" + pageId + 
                "?fields=instagram_business_account&access_token=" + accessToken;
        
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new BadRequestException("Failed to get Instagram business account: " + e.getMessage());
        }
    }

    private JsonNode getInstagramAccountDetails(String instagramAccountId, String accessToken) {
        String url = config.getGraphApiUrl() + "/" + instagramAccountId + 
                "?fields=id,username,profile_picture_url,followers_count,media_count&access_token=" + accessToken;
        
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new BadRequestException("Failed to get Instagram account details: " + e.getMessage());
        }
    }

    private String createMediaContainer(String instagramAccountId, String accessToken, 
                                        String mediaUrl, String caption, String mediaType) {
        String url = config.getGraphApiUrl() + "/" + instagramAccountId + "/media";
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("access_token", accessToken);
        params.add("caption", caption);
        
        if ("VIDEO".equalsIgnoreCase(mediaType) || "REELS".equalsIgnoreCase(mediaType)) {
            params.add("media_type", "REELS");
            params.add("video_url", mediaUrl);
        } else {
            params.add("image_url", mediaUrl);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("id").asText();
        } catch (Exception e) {
            throw new BadRequestException("Failed to create media container: " + e.getMessage());
        }
    }

    private void waitForMediaReady(String containerId, String accessToken) throws InterruptedException {
        String url = config.getGraphApiUrl() + "/" + containerId + 
                "?fields=status_code&access_token=" + accessToken;
        
        int maxAttempts = 30;
        int attempt = 0;
        
        while (attempt < maxAttempts) {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            try {
                JsonNode json = objectMapper.readTree(response.getBody());
                String status = json.has("status_code") ? json.get("status_code").asText() : "IN_PROGRESS";
                
                if ("FINISHED".equals(status)) {
                    return;
                } else if ("ERROR".equals(status)) {
                    throw new BadRequestException("Media processing failed");
                }
                
                Thread.sleep(2000); // Wait 2 seconds
                attempt++;
            } catch (InterruptedException e) {
                throw e;
            } catch (Exception e) {
                throw new BadRequestException("Failed to check media status: " + e.getMessage());
            }
        }
        
        throw new BadRequestException("Media processing timeout");
    }

    private String publishMediaContainer(String instagramAccountId, String containerId, String accessToken) {
        String url = config.getGraphApiUrl() + "/" + instagramAccountId + "/media_publish";
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("access_token", accessToken);
        params.add("creation_id", containerId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        
        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.get("id").asText();
        } catch (Exception e) {
            throw new BadRequestException("Failed to publish media: " + e.getMessage());
        }
    }

    private String getPostPermalink(String postId, String accessToken) {
        String url = config.getGraphApiUrl() + "/" + postId + 
                "?fields=permalink&access_token=" + accessToken;
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.has("permalink") ? json.get("permalink").asText() : null;
        } catch (Exception e) {
            return null; // Non-critical, don't fail
        }
    }

    private SocialMediaPost.MediaType parseMediaType(String type) {
        if (type == null) return SocialMediaPost.MediaType.IMAGE;
        try {
            return SocialMediaPost.MediaType.valueOf(type.toUpperCase());
        } catch (Exception e) {
            return SocialMediaPost.MediaType.IMAGE;
        }
    }

    private record TokenResponse(String accessToken, long expiresIn) {}
}
