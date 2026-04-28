package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.RubberPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RubberPriceRepository extends JpaRepository<RubberPrice, Long> {

    Optional<RubberPrice> findByCompanyIdAndEffectiveDate(Long companyId, LocalDate effectiveDate);

    @Query("SELECT r FROM RubberPrice r WHERE r.company.id = :companyId ORDER BY r.effectiveDate DESC")
    List<RubberPrice> findLatestByCompanyId(@Param("companyId") Long companyId);
}
