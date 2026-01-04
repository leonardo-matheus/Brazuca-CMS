package com.brazucacms.controller;

import com.brazucacms.dto.common.ApiResponse;
import com.brazucacms.dto.settings.SettingsRequest;
import com.brazucacms.dto.settings.SettingsResponse;
import com.brazucacms.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "Application settings management endpoints")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @Operation(summary = "Get all settings")
    public ResponseEntity<ApiResponse<List<SettingsResponse>>> getAllSettings() {
        List<SettingsResponse> response = settingsService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/group/{group}")
    @Operation(summary = "Get settings by group")
    public ResponseEntity<ApiResponse<List<SettingsResponse>>> getSettingsByGroup(@PathVariable String group) {
        List<SettingsResponse> response = settingsService.getSettingsByGroup(group);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/public")
    @Operation(summary = "Get public settings (no auth required)")
    public ResponseEntity<ApiResponse<List<SettingsResponse>>> getPublicSettings() {
        List<SettingsResponse> response = settingsService.getPublicSettings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get setting by ID")
    public ResponseEntity<ApiResponse<SettingsResponse>> getSettingById(@PathVariable Long id) {
        SettingsResponse response = settingsService.getSettingById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/key/{key}")
    @Operation(summary = "Get setting by key")
    public ResponseEntity<ApiResponse<SettingsResponse>> getSettingByKey(@PathVariable String key) {
        SettingsResponse response = settingsService.getSettingByKey(key);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new setting")
    public ResponseEntity<ApiResponse<SettingsResponse>> createSetting(
            @Valid @RequestBody SettingsRequest request) {
        
        SettingsResponse response = settingsService.createSetting(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Setting created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a setting")
    public ResponseEntity<ApiResponse<SettingsResponse>> updateSetting(
            @PathVariable Long id,
            @Valid @RequestBody SettingsRequest request) {
        
        SettingsResponse response = settingsService.updateSetting(id, request);
        return ResponseEntity.ok(ApiResponse.success("Setting updated successfully", response));
    }

    @PutMapping("/key/{key}")
    @Operation(summary = "Update a setting by key")
    public ResponseEntity<ApiResponse<SettingsResponse>> updateSettingByKey(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        
        String value = body.get("value");
        SettingsResponse response = settingsService.updateSettingByKey(key, value);
        return ResponseEntity.ok(ApiResponse.success("Setting updated successfully", response));
    }

    @PutMapping("/batch")
    @Operation(summary = "Update multiple settings at once")
    public ResponseEntity<ApiResponse<List<SettingsResponse>>> updateMultipleSettings(
            @RequestBody Map<String, String> settings) {
        
        List<SettingsResponse> response = settingsService.updateMultipleSettings(settings);
        return ResponseEntity.ok(ApiResponse.success("Settings updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a setting")
    public ResponseEntity<ApiResponse<Void>> deleteSetting(@PathVariable Long id) {
        settingsService.deleteSetting(id);
        return ResponseEntity.ok(ApiResponse.success("Setting deleted successfully", null));
    }
}
