package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('collection_center_admin', 'company_admin')")
    public ResponseEntity<List<AlertResponse>> getAlerts(
            @RequestParam(required = false) Long centerId) {

        List<AlertResponse> response;

        if (centerId != null) {
            response = alertService.getAlertsByCenter(centerId)
                    .stream()
                    .map(AlertResponse::from)
                    .toList();
        } else {
            response = alertService.getAllUnresolvedAlerts()
                    .stream()
                    .map(AlertResponse::from)
                    .toList();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unresolved")
    @PreAuthorize("hasAnyAuthority('collection_center_admin', 'company_admin')")
    public ResponseEntity<List<AlertResponse>> getUnresolvedAlerts(@RequestParam Long centerId) {
        List<AlertResponse> response = alertService.getUnresolvedAlertsByCenter(centerId)
                .stream()
                .map(AlertResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<AlertResponse> resolveAlert(@PathVariable Long id,
                                                      @RequestParam Long resolvedByUserId) {
        return ResponseEntity.ok(AlertResponse.from(alertService.resolveAlert(id, resolvedByUserId)));
    }
}
