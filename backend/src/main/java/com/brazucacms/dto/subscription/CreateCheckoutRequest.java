package com.brazucacms.dto.subscription;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCheckoutRequest {

    @NotNull(message = "Plan ID is required")
    private Long planId;

    @NotBlank(message = "Billing interval is required")
    private String billingInterval; // MONTHLY or YEARLY

    private String successUrl;
    private String cancelUrl;
}
