package com.brazucacms.dto.media;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaUpdateRequest {

    private String name;
    private String altText;
    private String caption;
    private String folder;
}
