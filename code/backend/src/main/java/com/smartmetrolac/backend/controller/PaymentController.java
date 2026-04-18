package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('farmer', 'collection_center_admin', 'company_admin')")
    public ResponseEntity<?> getPayments(
            @RequestParam(required = false) Long farmerId,
            @RequestParam(required = false) Long centerId,
            @RequestParam(required = false) Integer week,
            @RequestParam(required = false) Integer year) {

        if (centerId != null) {
            List<PaymentResponse> response = paymentService.getPaymentsByCenter(centerId)
                    .stream()
                    .map(PaymentResponse::from)
                    .toList();
            return ResponseEntity.ok(response);
        }

        if (farmerId != null && week != null && year != null) {
            PaymentResponse response = PaymentResponse.from(
                    paymentService.getPaymentByFarmerAndWeek(farmerId, week, year));
            return ResponseEntity.ok(response);
        }

        if (farmerId != null) {
            List<PaymentResponse> response = paymentService.getPaymentsByFarmer(farmerId)
                    .stream()
                    .map(PaymentResponse::from)
                    .toList();
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body("Provide farmerId or centerId");
    }

    @PostMapping("/calculate")
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<PaymentResponse> calculateWeeklyPayment(
            @RequestParam Long farmerId,
            @RequestParam int week,
            @RequestParam int year) {
        PaymentResponse response = PaymentResponse.from(
                paymentService.calculateAndSaveWeeklyPayment(farmerId, week, year));
        return ResponseEntity.ok(response);
    }
}
