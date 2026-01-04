package com.brazucacms.repository;

import com.brazucacms.model.MediaFolder;
import com.brazucacms.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaFolderRepository extends JpaRepository<MediaFolder, Long> {
    
    List<MediaFolder> findByWorkspace(Workspace workspace);
    
    List<MediaFolder> findByWorkspaceAndParent(Workspace workspace, MediaFolder parent);
    
    List<MediaFolder> findByWorkspaceAndParentIsNull(Workspace workspace);
    
    Optional<MediaFolder> findByWorkspaceAndPath(Workspace workspace, String path);
    
    boolean existsByWorkspaceAndPath(Workspace workspace, String path);
}
