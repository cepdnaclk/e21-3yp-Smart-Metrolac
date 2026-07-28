    package com.smartmetrolac.backend.controller;

    import java.math.BigDecimal;

    import org.springframework.http.ResponseEntity;
    import org.springframework.security.access.prepost.PreAuthorize;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.PostMapping;
    import org.springframework.web.bind.annotation.RequestBody;
    import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartmetrolac.backend.service.RubberPriceService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

    @RestController
    @RequestMapping("/api/price")
    public class RubberPriceController {

        private final RubberPriceService rubberPriceService;

        public RubberPriceController(RubberPriceService rubberPriceService) {
            this.rubberPriceService = rubberPriceService;
        }

        @GetMapping("/current")
        public ResponseEntity<RubberPriceResponse> getCurrentPrice(@RequestParam Long companyId) {
            return ResponseEntity.ok(RubberPriceResponse.from(rubberPriceService.getCurrentPrice(companyId)));
        }

        @PostMapping
        @PreAuthorize("hasAuthority('company_admin')")
        public ResponseEntity<RubberPriceResponse> setPrice(@Valid @RequestBody SetPriceRequest request) {
            return ResponseEntity.ok(RubberPriceResponse.from(
                    rubberPriceService.setPrice(request.getCompanyId(), request.getPricePerKg())));
        }

        static class SetPriceRequest {
            @NotNull(message = "Company ID is required")
            private Long companyId;
            @NotNull(message = "Price per kg is required")
            private BigDecimal pricePerKg;

            public Long getCompanyId() { return companyId; }
            public void setCompanyId(Long companyId) { this.companyId = companyId; }

            public BigDecimal getPricePerKg() { return pricePerKg; }
            public void setPricePerKg(BigDecimal pricePerKg) { this.pricePerKg = pricePerKg; }
        }
    }
