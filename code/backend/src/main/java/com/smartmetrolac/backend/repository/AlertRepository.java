package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findTop20ByOrderByCreatedDateDesc();
}
