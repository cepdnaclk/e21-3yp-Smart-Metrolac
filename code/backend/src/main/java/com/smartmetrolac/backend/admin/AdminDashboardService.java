package com.smartmetrolac.backend.admin;

import com.smartmetrolac.backend.admin.dto.AdminDashboardResponse;
import com.smartmetrolac.backend.entity.Alert;
import com.smartmetrolac.backend.repository.AlertRepository;
import com.smartmetrolac.backend.repository.CollectionCenterRepository;
import com.smartmetrolac.backend.repository.FarmerRepository;
import com.smartmetrolac.backend.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    private final CollectionCenterRepository collectionCenterRepository;
    private final FarmerRepository farmerRepository;
    private final InvoiceRepository invoiceRepository;
    private final AlertRepository alertRepository;

    public AdminDashboardService(CollectionCenterRepository collectionCenterRepository,
                                 FarmerRepository farmerRepository,
                                 InvoiceRepository invoiceRepository,
                                 AlertRepository alertRepository) {
        this.collectionCenterRepository = collectionCenterRepository;
        this.farmerRepository = farmerRepository;
        this.invoiceRepository = invoiceRepository;
        this.alertRepository = alertRepository;
    }

    public AdminDashboardResponse getDashboard() {
        long totalCenters = collectionCenterRepository.count();
        long totalFarmers = farmerRepository.count();

        LocalDate today = LocalDate.now();
        LocalDate firstOfMonth = today.withDayOfMonth(1);
        LocalDateTime start = firstOfMonth.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atTime(LocalTime.MIDNIGHT);

        List<AdminDashboardResponse.CenterMonthlyLitres> chartData =
                invoiceRepository.aggregateLitresPerCenterForPeriod(start, end)
                        .stream()
                        .map(row -> {
                            String centerName = (String) row[0];
                            BigDecimal litres = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
                            return new AdminDashboardResponse.CenterMonthlyLitres(centerName, litres.longValue());
                        })
                        .collect(Collectors.toList());

        List<Alert> latestAlerts = alertRepository.findTop20ByOrderByCreatedDateDesc();

        List<AdminDashboardResponse.SystemAlert> alerts = latestAlerts.stream()
                .map(a -> new AdminDashboardResponse.SystemAlert(
                        a.getId(),
                        a.getAlertType(),
                        a.getSeverity(),
                        a.getMessage(),
                        a.isResolved()
                ))
                .collect(Collectors.toList());

        return new AdminDashboardResponse(
                new AdminDashboardResponse.Kpis((int) totalCenters, (int) totalFarmers),
                chartData,
                alerts
        );
    }
}
