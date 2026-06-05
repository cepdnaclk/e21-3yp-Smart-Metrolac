package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.Farmer;
import com.smartmetrolac.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByFarmer(Farmer farmer);

    Optional<Payment> findByFarmerAndWeekAndYear(Farmer farmer, int week, int year);

    @Query("SELECT p FROM Payment p WHERE p.farmer.collectionCenter.id = :centerId")
    List<Payment> findByCollectionCenterId(@Param("centerId") Long centerId);
}
