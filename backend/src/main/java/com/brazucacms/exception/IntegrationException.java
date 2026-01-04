package com.brazucacms.exception;

/**
 * Exception for integration-related errors.
 */
public class IntegrationException extends RuntimeException {
    
    private final String platform;
    private final String errorCode;

    public IntegrationException(String message) {
        super(message);
        this.platform = null;
        this.errorCode = null;
    }

    public IntegrationException(String message, Throwable cause) {
        super(message, cause);
        this.platform = null;
        this.errorCode = null;
    }

    public IntegrationException(String platform, String message) {
        super(message);
        this.platform = platform;
        this.errorCode = null;
    }

    public IntegrationException(String platform, String message, String errorCode) {
        super(message);
        this.platform = platform;
        this.errorCode = errorCode;
    }

    public IntegrationException(String platform, String message, Throwable cause) {
        super(message, cause);
        this.platform = platform;
        this.errorCode = null;
    }

    public String getPlatform() {
        return platform;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
