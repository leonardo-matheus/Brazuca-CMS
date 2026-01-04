package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.social.*;
import com.brazucacms.service.InstagramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for social media integrations (Instagram, Facebook, etc.)
 */
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Social Media", description = "Social media integration APIs")
public class SocialMediaController {

    private final InstagramService instagramService;
    private final com.brazucacms.repository.UserRepository userRepository;

    // ============ OAuth ============

    @GetMapping("/instagram/oauth-url")
    @Operation(summary = "Get Instagram OAuth URL", description = "Get the URL to redirect user for Instagram/Facebook login")
    public ResponseEntity<ApiResponse<Map<String, String>>> getInstagramOAuthUrl(
            @RequestParam String redirectUri,
            @RequestParam(required = false, defaultValue = "") String state
    ) {
        String oauthUrl = instagramService.getOAuthUrl(redirectUri, state);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", oauthUrl)));
    }

    @PostMapping("/instagram/connect")
    @Operation(summary = "Connect Instagram account", description = "Exchange OAuth code and connect Instagram Business account")
    public ResponseEntity<ApiResponse<SocialMediaAccountResponse>> connectInstagram(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody InstagramConnectRequest request
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        SocialMediaAccountResponse response = instagramService.connectInstagramAccount(
                companyId, user.getId(), request);
        
        return ResponseEntity.ok(ApiResponse.success(
                "Instagram account connected successfully", response));
    }

    // ============ Account Management ============

    @GetMapping("/accounts")
    @Operation(summary = "Get connected accounts", description = "Get all connected social media accounts")
    public ResponseEntity<ApiResponse<List<SocialMediaAccountResponse>>> getConnectedAccounts(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        List<SocialMediaAccountResponse> accounts = instagramService.getConnectedAccounts(companyId);
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/instagram/accounts")
    @Operation(summary = "Get Instagram accounts", description = "Get connected Instagram accounts only")
    public ResponseEntity<ApiResponse<List<SocialMediaAccountResponse>>> getInstagramAccounts(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        List<SocialMediaAccountResponse> accounts = instagramService.getInstagramAccounts(companyId);
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @DeleteMapping("/accounts/{accountId}")
    @Operation(summary = "Disconnect account", description = "Disconnect a social media account")
    public ResponseEntity<ApiResponse<Void>> disconnectAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long accountId
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        instagramService.disconnectAccount(companyId, accountId);
        return ResponseEntity.ok(ApiResponse.success("Account disconnected successfully", null));
    }

    @PostMapping("/accounts/{accountId}/refresh-token")
    @Operation(summary = "Refresh token", description = "Refresh access token if expiring soon")
    public ResponseEntity<ApiResponse<Void>> refreshToken(
            @PathVariable Long accountId
    ) {
        instagramService.refreshTokenIfNeeded(accountId);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", null));
    }

    // ============ Publishing ============

    @PostMapping("/instagram/publish")
    @Operation(summary = "Publish to Instagram", description = "Publish a post to Instagram")
    public ResponseEntity<ApiResponse<SocialMediaPostResponse>> publishToInstagram(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody InstagramPublishRequest request
    ) {
        var user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long companyId = user.getCompany().getId();
        
        SocialMediaPostResponse response = instagramService.publishToInstagram(
                companyId, user.getId(), request);
        
        return ResponseEntity.ok(ApiResponse.success(
                "Published to Instagram successfully", response));
    }
}
