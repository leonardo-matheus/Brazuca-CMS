package com.brazucacms.dto.media;

import com.brazucacms.model.Media;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaResponse {

    private Long id;
    private String filename;
    private String originalFilename;
    private String url;
    private String mimeType;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private String altText;
    private String caption;
    private String type;
    private String uploadedByName;
    private LocalDateTime createdAt;

    public static MediaResponse fromEntity(Media media) {
        return MediaResponse.builder()
                .id(media.getId())
                .filename(media.getFilename())
                .originalFilename(media.getOriginalFilename())
                .url(media.getUrl())
                .mimeType(media.getMimeType())
                .fileSize(media.getFileSize())
                .width(media.getWidth())
                .height(media.getHeight())
                .altText(media.getAltText())
                .caption(media.getCaption())
                .type(media.getType().name())
                .uploadedByName(media.getUploadedBy() != null ? media.getUploadedBy().getName() : null)
                .createdAt(media.getCreatedAt())
                .build();
    }
}
