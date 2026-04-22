package com.smartmetrolac.backend.controller;

import com.smartmetrolac.backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('collection_center_admin')")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long id) {
        userService.resetPasswordToDefault(id);
        return ResponseEntity.ok(Map.of("message", "Password reset to default"));
    }

    static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;
        @NotBlank(message = "New password is required")
        private String newPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
