package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
}
