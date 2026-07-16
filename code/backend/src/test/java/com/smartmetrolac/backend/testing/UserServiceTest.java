package com.smartmetrolac.backend.testing;

import com.smartmetrolac.backend.entity.UserEntity;
import com.smartmetrolac.backend.repository.UserRepository;
import com.smartmetrolac.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    private UserEntity existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new UserEntity();
        existingUser.setId(1L);
        existingUser.setUsername("F0001");
        existingUser.setPasswordHash("old-hash");
        existingUser.setMustChangePassword(true);
    }

    // Equivalence partitioning: valid username + correct current password -> password is changed and persisted.
    @Test
    void changePassword_withCorrectCurrentPassword_updatesPasswordAndSaves() {
        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("oldPass", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("new-hash");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UserEntity result = userService.changePassword("F0001", "oldPass", "newPass");

        assertEquals("new-hash", result.getPasswordHash());
        verify(userRepository).save(existingUser);
    }

    // Equivalence partitioning: a successful password change also clears the mustChangePassword flag.
    @Test
    void changePassword_withCorrectCurrentPassword_clearsMustChangePasswordFlag() {
        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("oldPass", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("new-hash");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UserEntity result = userService.changePassword("F0001", "oldPass", "newPass");

        assertFalse(result.isMustChangePassword());
    }

    // Error case: username does not exist -> service throws instead of returning null.
    @Test
    void changePassword_unknownUsername_throwsRuntimeException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.changePassword("ghost", "any", "new"));
        assertEquals("User not found", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    // Error case: current password does not match the stored hash -> throws and never persists.
    @Test
    void changePassword_incorrectCurrentPassword_throwsAndDoesNotSave() {
        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrongPass", "old-hash")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.changePassword("F0001", "wrongPass", "newPass"));
        assertEquals("Current password is incorrect", ex.getMessage());
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }

    // Boundary value: empty-string new password is still accepted and encoded since the service performs no length validation.
    @Test
    void changePassword_withEmptyNewPassword_stillEncodesAndSaves() {
        when(userRepository.findByUsername("F0001")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("oldPass", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("")).thenReturn("empty-hash");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UserEntity result = userService.changePassword("F0001", "oldPass", "");

        assertEquals("empty-hash", result.getPasswordHash());
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).encode(captor.capture());
        assertEquals("", captor.getValue());
    }
}
