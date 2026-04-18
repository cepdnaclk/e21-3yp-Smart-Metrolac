package com.smartmetrolac.backend.repository;

import com.smartmetrolac.backend.entity.CollectionCenter;
import com.smartmetrolac.backend.entity.Farmer;
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

    List<Invoice> findByCollectionCenter(CollectionCenter collectionCenter);

    List<Invoice> findByCollectionCenterAndMeasurementDateTimeBetween(
            CollectionCenter collectionCenter,
            LocalDateTime start,
            LocalDateTime end);

    List<Invoice> findByFarmer(Farmer farmer);

    @Query("SELECT i FROM Invoice i WHERE i.collectionCenter = :center " +
           "AND FUNCTION('date_part', 'week', i.measurementDateTime) = :week " +
           "AND FUNCTION('date_part', 'year', i.measurementDateTime) = :year")
    List<Invoice> findByCollectionCenterAndWeekAndYear(
            @Param("center") CollectionCenter center,
            @Param("week") int week,
            @Param("year") int year);
}
