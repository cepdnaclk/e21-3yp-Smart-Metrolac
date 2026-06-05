package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findTop20ByOrderByCreatedDateDesc();

    @Query("SELECT a FROM Alert a WHERE a.invoice.collectionCenter.id = :centerId")
    List<Alert> findByCollectionCenterId(@Param("centerId") Long centerId);

    @Query("SELECT a FROM Alert a WHERE a.invoice.collectionCenter.id = :centerId AND a.resolved = false")
    List<Alert> findUnresolvedByCollectionCenterId(@Param("centerId") Long centerId);

    @Query("SELECT a FROM Alert a WHERE a.resolved = false")
    List<Alert> findAllUnresolved();
}
