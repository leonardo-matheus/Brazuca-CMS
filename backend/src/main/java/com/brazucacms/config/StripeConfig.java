package com.brazucacms.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class StripeConfig {

    @Value("${stripe.api-key}")
    private String apiKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${stripe.prices.starter:}")
    private String starterPriceId;

    @Value("${stripe.prices.pro-monthly:}")
    private String proMonthlyPriceId;

    @Value("${stripe.prices.pro-yearly:}")
    private String proYearlyPriceId;

    @Value("${stripe.prices.enterprise-monthly:}")
    private String enterpriseMonthlyPriceId;

    @Value("${stripe.prices.enterprise-yearly:}")
    private String enterpriseYearlyPriceId;

    @PostConstruct
    public void init() {
        Stripe.apiKey = apiKey;
    }
}
