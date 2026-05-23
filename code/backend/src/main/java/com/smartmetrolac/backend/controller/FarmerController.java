package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.repository.UserRepository;
import com.smartmetrolac.backend.service.FarmerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {

    private final FarmerService farmerService;
    private final UserRepository userRepository;

    public FarmerController(FarmerService farmerService, UserRepository userRepository) {
        this.farmerService = farmerService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('company_admin', 'collection_center_admin')")
    public ResponseEntity<List<FarmerResponse>> getAllFarmersByCenter(@RequestParam Long centerId) {
        List<FarmerResponse> response = farmerService.getAllFarmersByCenter(centerId)
                .stream()
                .map(f -> FarmerResponse.from(f, resolveUserId(f)))
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('company_admin', 'collection_center_admin')")
    public ResponseEntity<FarmerResponse> getFarmerById(@PathVariable Long id) {
        Farmer farmer = farmerService.getFarmerById(id);
        return ResponseEntity.ok(FarmerResponse.from(farmer, resolveUserId(farmer)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<FarmerResponse> createFarmer(@Valid @RequestBody CreateFarmerRequest request) {
        Farmer created = farmerService.createFarmer(
                request.getName(),
                request.getAddress(),
                request.getPhoneNumber(),
                request.getCollectionCenterId()
        );
        return ResponseEntity.ok(FarmerResponse.from(created, resolveUserId(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<FarmerResponse> updateFarmer(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateFarmerRequest request) {
        Farmer updated = farmerService.updateFarmer(
                id,
                request.getName(),
                request.getAddress(),
                request.getPhoneNumber()
        );
        return ResponseEntity.ok(FarmerResponse.from(updated, resolveUserId(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<Void> deleteFarmer(@PathVariable Long id) {
        farmerService.deleteFarmer(id);
        return ResponseEntity.noContent().build();
    }

    private Long resolveUserId(Farmer farmer) {
        String username = "F" + String.format("%04d", farmer.getId());
        return userRepository.findByUsername(username)
                .map(u -> u.getId())
                .orElse(null);
    }

    // ---- Request body classes ----

    static class CreateFarmerRequest {
        @NotBlank(message = "Name is required")
        private String name;
        private String address;
        private String phoneNumber;
        @NotNull(message = "Collection center ID is required")
        private Long collectionCenterId;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

        public Long getCollectionCenterId() { return collectionCenterId; }
        public void setCollectionCenterId(Long collectionCenterId) { this.collectionCenterId = collectionCenterId; }
    }

    static class UpdateFarmerRequest {
        private String name;
        private String address;
        private String phoneNumber;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    }
}
