package com.brazucacms.service;

import com.brazucacms.dto.settings.SettingsRequest;
import com.brazucacms.dto.settings.SettingsResponse;
import com.brazucacms.exception.ResourceNotFoundException;
import com.brazucacms.exception.DuplicateResourceException;
import com.brazucacms.model.Settings;
import com.brazucacms.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SettingsRepository settingsRepository;

    public List<SettingsResponse> getAllSettings() {
        return settingsRepository.findAll().stream()
                .map(SettingsResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SettingsResponse> getSettingsByGroup(String group) {
        return settingsRepository.findByGroup(group).stream()
                .map(SettingsResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SettingsResponse> getPublicSettings() {
        return settingsRepository.findByIsPublicTrue().stream()
                .map(SettingsResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SettingsResponse getSettingByKey(String key) {
        Settings settings = settingsRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with key: " + key));
        return SettingsResponse.fromEntity(settings);
    }

    public SettingsResponse getSettingById(Long id) {
        Settings settings = settingsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with id: " + id));
        return SettingsResponse.fromEntity(settings);
    }

    @Transactional
    public SettingsResponse createSetting(SettingsRequest request) {
        if (settingsRepository.existsByKey(request.getKey())) {
            throw new DuplicateResourceException("Setting with key '" + request.getKey() + "' already exists");
        }

        Settings settings = Settings.builder()
                .key(request.getKey())
                .value(request.getValue())
                .type(request.getType() != null ? request.getType() : "string")
                .description(request.getDescription())
                .group(request.getGroup() != null ? request.getGroup() : "general")
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .build();

        Settings savedSettings = settingsRepository.save(settings);
        return SettingsResponse.fromEntity(savedSettings);
    }

    @Transactional
    public SettingsResponse updateSetting(Long id, SettingsRequest request) {
        Settings settings = settingsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with id: " + id));

        if (request.getValue() != null) {
            settings.setValue(request.getValue());
        }

        if (request.getType() != null) {
            settings.setType(request.getType());
        }

        if (request.getDescription() != null) {
            settings.setDescription(request.getDescription());
        }

        if (request.getGroup() != null) {
            settings.setGroup(request.getGroup());
        }

        if (request.getIsPublic() != null) {
            settings.setIsPublic(request.getIsPublic());
        }

        Settings savedSettings = settingsRepository.save(settings);
        return SettingsResponse.fromEntity(savedSettings);
    }

    @Transactional
    public SettingsResponse updateSettingByKey(String key, String value) {
        Settings settings = settingsRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with key: " + key));

        settings.setValue(value);
        Settings savedSettings = settingsRepository.save(settings);
        return SettingsResponse.fromEntity(savedSettings);
    }

    @Transactional
    public List<SettingsResponse> updateMultipleSettings(Map<String, String> settingsMap) {
        return settingsMap.entrySet().stream()
                .map(entry -> {
                    Settings settings = settingsRepository.findByKey(entry.getKey())
                            .orElse(Settings.builder()
                                    .key(entry.getKey())
                                    .build());
                    settings.setValue(entry.getValue());
                    return SettingsResponse.fromEntity(settingsRepository.save(settings));
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSetting(Long id) {
        if (!settingsRepository.existsById(id)) {
            throw new ResourceNotFoundException("Setting not found with id: " + id);
        }
        settingsRepository.deleteById(id);
    }

    @Transactional
    public void deleteSettingByKey(String key) {
        Settings settings = settingsRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found with key: " + key));
        settingsRepository.delete(settings);
    }
}
