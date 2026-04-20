package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Invoice;
import com.smartmetrolac.backend.service.InvoiceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('company_admin', 'collection_center_admin')")
    public ResponseEntity<List<InvoiceResponse>> getInvoices(
            @RequestParam Long centerId,
            @RequestParam(required = false) LocalDateTime start,
            @RequestParam(required = false) LocalDateTime end,
            @RequestParam(required = false) Integer week,
            @RequestParam(required = false) Integer year) {

        List<Invoice> invoices;

        if (start != null && end != null) {
            invoices = invoiceService.getInvoicesByCenterAndDateRange(centerId, start, end);
        } else if (week != null && year != null) {
            invoices = invoiceService.getInvoicesByCenterAndWeek(centerId, week, year);
        } else {
            invoices = invoiceService.getInvoicesByCenter(centerId);
        }

        List<InvoiceResponse> response = invoices.stream()
                .map(InvoiceResponse::from)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('company_admin', 'collection_center_admin')")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(InvoiceResponse.from(invoiceService.getInvoiceById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Invoice created = invoiceService.createInvoice(
                request.getFarmerId(),
                request.getDeviceId(),
                request.getCenterId(),
                request.getMeasurementDateTime(),
                request.getDrc(),
                request.getTotalLitres(),
                request.getTotalAmount(),
                request.getTemperature(),
                request.getPhStatus(),
                request.getTdsStatus()
        );
        return ResponseEntity.ok(InvoiceResponse.from(created));
    }

    // ---- Request body class ----

    static class CreateInvoiceRequest {
        @NotNull(message = "Farmer ID is required")
        private Long farmerId;
        @NotNull(message = "Device ID is required")
        private Long deviceId;
        @NotNull(message = "Center ID is required")
        private Long centerId;
        private LocalDateTime measurementDateTime;
        @NotNull(message = "DRC is required")
        private BigDecimal drc;
        @NotNull(message = "Total litres is required")
        private BigDecimal totalLitres;
        private BigDecimal totalAmount;
        private BigDecimal temperature;
        private String phStatus;
        private String tdsStatus;

        public Long getFarmerId() { return farmerId; }
        public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

        public Long getDeviceId() { return deviceId; }
        public void setDeviceId(Long deviceId) { this.deviceId = deviceId; }

        public Long getCenterId() { return centerId; }
        public void setCenterId(Long centerId) { this.centerId = centerId; }

        public LocalDateTime getMeasurementDateTime() { return measurementDateTime; }
        public void setMeasurementDateTime(LocalDateTime measurementDateTime) { this.measurementDateTime = measurementDateTime; }

        public BigDecimal getDrc() { return drc; }
        public void setDrc(BigDecimal drc) { this.drc = drc; }

        public BigDecimal getTotalLitres() { return totalLitres; }
        public void setTotalLitres(BigDecimal totalLitres) { this.totalLitres = totalLitres; }

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public BigDecimal getTemperature() { return temperature; }
        public void setTemperature(BigDecimal temperature) { this.temperature = temperature; }

        public String getPhStatus() { return phStatus; }
        public void setPhStatus(String phStatus) { this.phStatus = phStatus; }

        public String getTdsStatus() { return tdsStatus; }
        public void setTdsStatus(String tdsStatus) { this.tdsStatus = tdsStatus; }
    }
}
