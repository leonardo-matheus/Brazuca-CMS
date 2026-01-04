package com.brazucacms.service;

import com.brazucacms.dto.webhook.*;
import com.brazucacms.exception.BadRequestException;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.model.*;
import com.brazucacms.repository.WebhookLogRepository;
import com.brazucacms.repository.WebhookRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookRepository webhookRepository;
    private final WebhookLogRepository webhookLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Transactional
    public WebhookDTO createWebhook(Long workspaceId, CreateWebhookRequest request, Workspace workspace) {
        String eventsJson;
        try {
            eventsJson = objectMapper.writeValueAsString(request.getEvents());
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Invalid events format");
        }

        Webhook webhook = Webhook.builder()
                .workspace(workspace)
                .url(request.getUrl())
                .description(request.getDescription())
                .events(eventsJson)
                .status(Webhook.WebhookStatus.ACTIVE)
                .failureCount(0)
                .build();

        webhook = webhookRepository.save(webhook);
        return toDTO(webhook);
    }

    public List<WebhookDTO> getWorkspaceWebhooks(Long workspaceId, Workspace workspace) {
        return webhookRepository.findByWorkspace(workspace).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<WebhookDTO> getWorkspaceWebhooks(Workspace workspace, Pageable pageable) {
        return webhookRepository.findByWorkspace(workspace, pageable)
                .map(this::toDTO);
    }

    public WebhookDTO getWebhook(Long webhookId) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));
        return toDTO(webhook);
    }

    @Transactional
    public WebhookDTO updateWebhook(Long webhookId, UpdateWebhookRequest request) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));

        if (request.getUrl() != null) {
            webhook.setUrl(request.getUrl());
        }
        if (request.getDescription() != null) {
            webhook.setDescription(request.getDescription());
        }
        if (request.getEvents() != null) {
            try {
                webhook.setEvents(objectMapper.writeValueAsString(request.getEvents()));
            } catch (JsonProcessingException e) {
                throw new BadRequestException("Invalid events format");
            }
        }
        if (request.getStatus() != null) {
            webhook.setStatus(request.getStatus());
        }

        webhook = webhookRepository.save(webhook);
        return toDTO(webhook);
    }

    @Transactional
    public void deleteWebhook(Long webhookId) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));
        webhookRepository.delete(webhook);
    }

    public WebhookTestResponse testWebhook(Long webhookId) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));

        Map<String, Object> testPayload = new HashMap<>();
        testPayload.put("event", "test");
        testPayload.put("timestamp", LocalDateTime.now().toString());
        testPayload.put("data", new HashMap<>());

        long startTime = System.currentTimeMillis();
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(testPayload, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    webhook.getUrl(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            long responseTime = System.currentTimeMillis() - startTime;

            return WebhookTestResponse.builder()
                    .statusCode(response.getStatusCode().value())
                    .responseTime(responseTime)
                    .message("Webhook test successful")
                    .payload(testPayload)
                    .build();

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            
            return WebhookTestResponse.builder()
                    .statusCode(500)
                    .responseTime(responseTime)
                    .message("Webhook test failed: " + e.getMessage())
                    .payload(testPayload)
                    .build();
        }
    }

    public Page<WebhookLogDTO> getWebhookLogs(Long webhookId, Pageable pageable) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));

        return webhookLogRepository.findByWebhookOrderByTimestampDesc(webhook, pageable)
                .map(this::toLogDTO);
    }

    // Trigger webhooks for events
    @Async
    @Transactional
    public void triggerWebhooks(Long workspaceId, String event, Object data) {
        List<Webhook> webhooks = webhookRepository.findActiveWebhooksForEvent(workspaceId, event);

        for (Webhook webhook : webhooks) {
            sendWebhook(webhook, event, data);
        }
    }

    @Async
    public void sendWebhook(Webhook webhook, String event, Object data) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", event);
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("workspaceId", webhook.getWorkspace().getId());
        payload.put("data", data);

        WebhookLog webhookLog = WebhookLog.builder()
                .webhook(webhook)
                .event(event)
                .attempt(1)
                .status(WebhookLog.LogStatus.PENDING)
                .timestamp(LocalDateTime.now())
                .build();

        try {
            webhookLog.setPayload(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize webhook payload", e);
        }

        long startTime = System.currentTimeMillis();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Add custom headers if any
            if (webhook.getHeaders() != null && !webhook.getHeaders().isEmpty()) {
                try {
                    Map<String, String> customHeaders = objectMapper.readValue(
                            webhook.getHeaders(), 
                            new TypeReference<Map<String, String>>() {}
                    );
                    customHeaders.forEach(headers::set);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to parse webhook custom headers", e);
                }
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    webhook.getUrl(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            long responseTime = System.currentTimeMillis() - startTime;

            webhookLog.setStatusCode(response.getStatusCode().value());
            webhookLog.setResponseTime(responseTime);
            webhookLog.setResponse(response.getBody());
            webhookLog.setStatus(WebhookLog.LogStatus.SUCCESS);

            // Update webhook success
            webhook.setLastSuccessAt(LocalDateTime.now());
            webhook.setFailureCount(0);

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;

            webhookLog.setResponseTime(responseTime);
            webhookLog.setErrorMessage(e.getMessage());
            webhookLog.setStatus(WebhookLog.LogStatus.FAILED);

            // Update webhook failure
            webhook.setLastFailedAt(LocalDateTime.now());
            webhook.setFailureCount(webhook.getFailureCount() + 1);

            // Disable webhook after 5 consecutive failures
            if (webhook.getFailureCount() >= 5) {
                webhook.setStatus(Webhook.WebhookStatus.FAILED);
            }

            log.error("Webhook delivery failed for webhook {}: {}", webhook.getId(), e.getMessage());
        }

        webhookRepository.save(webhook);
        webhookLogRepository.save(webhookLog);
    }

    private WebhookDTO toDTO(Webhook webhook) {
        List<String> events = new ArrayList<>();
        if (webhook.getEvents() != null) {
            try {
                events = objectMapper.readValue(webhook.getEvents(), new TypeReference<List<String>>() {});
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse webhook events", e);
            }
        }

        return WebhookDTO.builder()
                .id(webhook.getId())
                .url(webhook.getUrl())
                .description(webhook.getDescription())
                .events(events)
                .status(webhook.getStatus())
                .failureCount(webhook.getFailureCount())
                .lastFailedAt(webhook.getLastFailedAt())
                .lastSuccessAt(webhook.getLastSuccessAt())
                .createdAt(webhook.getCreatedAt())
                .testUrl("https://api.cms-saas.com/webhooks/test/" + webhook.getId())
                .build();
    }

    private WebhookLogDTO toLogDTO(WebhookLog log) {
        Object payload = null;
        if (log.getPayload() != null) {
            try {
                payload = objectMapper.readValue(log.getPayload(), Object.class);
            } catch (JsonProcessingException e) {
                payload = log.getPayload();
            }
        }

        return WebhookLogDTO.builder()
                .id(log.getId())
                .event(log.getEvent())
                .statusCode(log.getStatusCode())
                .responseTime(log.getResponseTime())
                .attempt(log.getAttempt())
                .timestamp(log.getTimestamp())
                .payload(payload)
                .status(log.getStatus())
                .build();
    }
}
