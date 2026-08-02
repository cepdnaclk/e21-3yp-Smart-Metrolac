package com.smartmetrolac.backend.service;

import com.smartmetrolac.backend.entity.UserEntity;
import com.smartmetrolac.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void changePassword_updatesPasswordAndClearsMustChangeFlagWhenCurrentPasswordMatches() {
        UserEntity user = new UserEntity();
        user.setUsername("F0001");
        user.setPasswordHash("encoded-current");
        user.setMustChangePassword(true);

        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctPass", "encoded-current")).thenReturn(true);
        when(passwordEncoder.encode("NewPass123")).thenReturn("encoded-new");
        when(userRepository.save(user)).thenReturn(user);

        UserEntity result = userService.changePassword("F0001", "correctPass", "NewPass123");

        assertSame(user, result);
        assertEquals("encoded-new", user.getPasswordHash());
        assertFalse(user.isMustChangePassword());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_throwsWhenCurrentPasswordDoesNotMatch() {
        UserEntity user = new UserEntity();
        user.setPasswordHash("encoded-current");

        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPass", "encoded-current")).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userService.changePassword("F0001", "wrongPass", "NewPass123"));

        assertEquals("Current password is incorrect", exception.getMessage());
        verify(userRepository, never()).save(user);
    }

    @Test
    void changePassword_throwsWhenUserDoesNotExist() {
        when(userRepository.findByUsername("F9999")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userService.changePassword("F9999", "correctPass", "NewPass123"));

        assertEquals("User not found", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_acceptsSamePasswordBecauseServiceDoesNotRejectIt() {
        UserEntity user = new UserEntity();
        user.setPasswordHash("encoded-current");
        user.setMustChangePassword(true);

        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctPass", "encoded-current")).thenReturn(true);
        when(passwordEncoder.encode("correctPass")).thenReturn("encoded-same");
        when(userRepository.save(user)).thenReturn(user);

        UserEntity result = userService.changePassword("F0001", "correctPass", "correctPass");

        assertSame(user, result);
        assertEquals("encoded-same", user.getPasswordHash());
        assertFalse(user.isMustChangePassword());
    }

    @Test
    void changePassword_acceptsShortNewPasswordBecauseServiceDoesNotValidateLength() {
        UserEntity user = new UserEntity();
        user.setPasswordHash("encoded-current");

        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correctPass", "encoded-current")).thenReturn(true);
        when(passwordEncoder.encode("Pas1")).thenReturn("encoded-short");
        when(userRepository.save(user)).thenReturn(user);

        UserEntity result = userService.changePassword("F0001", "correctPass", "Pas1");

        assertSame(user, result);
        assertEquals("encoded-short", user.getPasswordHash());
    }
}