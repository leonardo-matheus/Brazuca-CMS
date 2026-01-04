package com.brazucacms.repository;

import com.brazucacms.model.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SettingsRepository extends JpaRepository<Settings, Long> {

    Optional<Settings> findByKey(String key);

    List<Settings> findByGroup(String group);

    List<Settings> findByIsPublicTrue();

    boolean existsByKey(String key);
}
