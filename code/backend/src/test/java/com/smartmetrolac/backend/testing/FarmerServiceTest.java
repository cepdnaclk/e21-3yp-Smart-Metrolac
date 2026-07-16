package com.smartmetrolac.backend.testing;

import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.UserEntity;
import com.smartmetrolac.backend.repository.CollectionCenterRepository;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.UserRepository;
import com.smartmetrolac.backend.service.FarmerService;
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
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmerServiceTest {

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private CollectionCenterRepository collectionCenterRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FarmerService farmerService;

    private CollectionCenter center;

    @BeforeEach
    void setUp() {
        center = new CollectionCenter();
        center.setId(10L);
    }

    // Equivalence partitioning: valid name/address/phone/center id -> farmer is built and saved with those fields.
    @Test
    void createFarmer_validInput_savesFarmerWithSuppliedFields() {
        when(collectionCenterRepository.findById(10L)).thenReturn(Optional.of(center));
        when(farmerRepository.save(any(Farmer.class))).thenAnswer(inv -> {
            Farmer f = inv.getArgument(0);
            f.setId(4L);
            return f;
        });
        when(passwordEncoder.encode("00000000")).thenReturn("default-hash");

        Farmer result = farmerService.createFarmer("Kamal Perera", "Kandy", "0771234567", 10L);

        ArgumentCaptor<Farmer> captor = ArgumentCaptor.forClass(Farmer.class);
        verify(farmerRepository).save(captor.capture());
        Farmer saved = captor.getValue();
        assertEquals("Kamal Perera", saved.getName());
        assertEquals("Kandy", saved.getAddress());
        assertEquals("0771234567", saved.getPhoneNumber());
        assertEquals(center, saved.getCollectionCenter());
        assertEquals(4L, result.getId());
    }

    // Error case: collection center id does not resolve -> service throws before touching farmer/user repositories.
    @Test
    void createFarmer_collectionCenterNotFound_throwsAndSavesNothing() {
        when(collectionCenterRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> farmerService.createFarmer("Name", "Addr", "071", 99L));
        assertEquals("Collection center not found", ex.getMessage());
        verify(farmerRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    // Equivalence partitioning: creating a farmer also provisions a linked login with generated default credentials.
    @Test
    void createFarmer_createsLinkedUserAccountWithDefaultCredentials() {
        when(collectionCenterRepository.findById(10L)).thenReturn(Optional.of(center));
        when(farmerRepository.save(any(Farmer.class))).thenAnswer(inv -> {
            Farmer f = inv.getArgument(0);
            f.setId(4L);
            return f;
        });
        when(passwordEncoder.encode("00000000")).thenReturn("default-hash");

        farmerService.createFarmer("Name", "Addr", "071", 10L);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());
        UserEntity user = captor.getValue();
        assertEquals("F0004", user.getUsername());
        assertEquals("F0004@smartmetrolac.local", user.getEmail());
        assertEquals("default-hash", user.getPasswordHash());
        assertEquals("farmer", user.getRole());
        assertTrue(user.isMustChangePassword());
    }

    // Boundary value: a single-digit farmer id must be zero-padded to 4 digits in the generated username.
    @Test
    void createFarmer_smallId_zeroPadsUsernameToFourDigits() {
        when(collectionCenterRepository.findById(10L)).thenReturn(Optional.of(center));
        when(farmerRepository.save(any(Farmer.class))).thenAnswer(inv -> {
            Farmer f = inv.getArgument(0);
            f.setId(7L);
            return f;
        });
        when(passwordEncoder.encode("00000000")).thenReturn("default-hash");

        farmerService.createFarmer("Name", "Addr", "071", 10L);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());
        assertEquals("F0007", captor.getValue().getUsername());
    }

    // Boundary value: an id wider than 4 digits is not truncated by "%04d", only padded up to the minimum width.
    @Test
    void createFarmer_largeId_usernameNotTruncated() {
        when(collectionCenterRepository.findById(10L)).thenReturn(Optional.of(center));
        when(farmerRepository.save(any(Farmer.class))).thenAnswer(inv -> {
            Farmer f = inv.getArgument(0);
            f.setId(123456L);
            return f;
        });
        when(passwordEncoder.encode("00000000")).thenReturn("default-hash");

        farmerService.createFarmer("Name", "Addr", "071", 10L);

        ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
        verify(userRepository).save(captor.capture());
        assertEquals("F123456", captor.getValue().getUsername());
    }

    // Equivalence partitioning: the method returns exactly what the repository persisted, not a re-fetched copy.
    @Test
    void createFarmer_returnsSameInstanceReturnedByRepository() {
        when(collectionCenterRepository.findById(10L)).thenReturn(Optional.of(center));
        Farmer persisted = new Farmer();
        persisted.setId(4L);
        when(farmerRepository.save(any(Farmer.class))).thenReturn(persisted);
        when(passwordEncoder.encode("00000000")).thenReturn("default-hash");

        Farmer result = farmerService.createFarmer("Name", "Addr", "071", 10L);

        assertSame(persisted, result);
    }
}
