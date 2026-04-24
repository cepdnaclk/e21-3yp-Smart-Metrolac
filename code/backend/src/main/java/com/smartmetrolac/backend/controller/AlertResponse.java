package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Alert;

import java.time.LocalDateTime;

public class AlertResponse {

    Long id;
    Long invoiceId;
    String alertType;
    String severity;
    String message;
    boolean resolved;
    Long resolvedByUserId;
    String resolvedByUsername;
    LocalDateTime createdDate;

    public static AlertResponse from(Alert alert) {
        AlertResponse response = new AlertResponse();
        response.id = alert.getId();
        response.invoiceId = alert.getInvoice().getId();
        response.alertType = alert.getAlertType();
        response.severity = alert.getSeverity();
        response.message = alert.getMessage();
        response.resolved = alert.isResolved();
        response.resolvedByUserId = alert.getResolvedBy() != null ? alert.getResolvedBy().getId() : null;
        response.resolvedByUsername = alert.getResolvedBy() != null ? alert.getResolvedBy().getUsername() : null;
        response.createdDate = alert.getCreatedDate();
        return response;
    }

    public Long getId() { return id; }
    public Long getInvoiceId() { return invoiceId; }
    public String getAlertType() { return alertType; }
    public String getSeverity() { return severity; }
    public String getMessage() { return message; }
    public boolean isResolved() { return resolved; }
    public Long getResolvedByUserId() { return resolvedByUserId; }
    public String getResolvedByUsername() { return resolvedByUsername; }
    public LocalDateTime getCreatedDate() { return createdDate; }
}
