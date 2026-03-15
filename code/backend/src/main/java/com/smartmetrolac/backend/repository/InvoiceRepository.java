package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("""
            SELECT cc.name, COALESCE(SUM(i.totalLitres), 0)
            FROM CollectionCenter cc
            LEFT JOIN Invoice i
              ON i.collectionCenter = cc
             AND i.measurementDateTime BETWEEN :start AND :end
            GROUP BY cc.id, cc.name
            ORDER BY cc.name
            """)
    List<Object[]> aggregateLitresPerCenterForPeriod(@Param("start") LocalDateTime start,
                                                     @Param("end") LocalDateTime end);
}
