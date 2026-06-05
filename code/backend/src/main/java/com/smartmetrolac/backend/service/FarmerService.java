package com.smartmetrolac.backend.service;

import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.UserEntity;
import com.smartmetrolac.backend.repository.CollectionCenterRepository;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FarmerService {

    private final FarmerRepository farmerRepository;
    private final CollectionCenterRepository collectionCenterRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public FarmerService(FarmerRepository farmerRepository,
                         CollectionCenterRepository collectionCenterRepository,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.farmerRepository = farmerRepository;
        this.collectionCenterRepository = collectionCenterRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Farmer> getAllFarmersByCenter(Long centerId) {
        CollectionCenter collectionCenter = collectionCenterRepository.findById(centerId)
                .orElseThrow(() -> new RuntimeException("Collection center not found"));
        return farmerRepository.findByCollectionCenter(collectionCenter);
    }

    public Farmer getFarmerById(Long id) {
        return farmerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
    }

    public Farmer createFarmer(String name, String address, String phoneNumber, Long collectionCenterId) {
        CollectionCenter collectionCenter = collectionCenterRepository.findById(collectionCenterId)
                .orElseThrow(() -> new RuntimeException("Collection center not found"));

        Farmer farmer = new Farmer();
        farmer.setName(name);
        farmer.setAddress(address);
        farmer.setPhoneNumber(phoneNumber);
        farmer.setCollectionCenter(collectionCenter);

        Farmer savedFarmer = farmerRepository.save(farmer);

        UserEntity userAccount = new UserEntity();
        userAccount.setUsername("F" + String.format("%04d", savedFarmer.getId()));
        userAccount.setEmail("F" + String.format("%04d", savedFarmer.getId()) + "@smartmetrolac.local");
        userAccount.setPasswordHash(passwordEncoder.encode("00000000"));
        userAccount.setRole("farmer");
        userAccount.setMustChangePassword(true);
        userRepository.save(userAccount);

        return savedFarmer;
    }

    public Farmer updateFarmer(Long id, String name, String address, String phoneNumber) {
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        farmer.setName(name);
        farmer.setAddress(address);
        farmer.setPhoneNumber(phoneNumber);

        return farmerRepository.save(farmer);
    }

    public void deleteFarmer(Long id) {
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        farmerRepository.delete(farmer);
    }
}
