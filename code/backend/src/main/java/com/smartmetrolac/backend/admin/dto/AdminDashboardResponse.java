package com.smartmetrolac.backend.admin.dto;

import java.util.List;

public record AdminDashboardResponse(
        Kpis kpis,
        List<CenterMonthlyLitres> chartData,
        List<SystemAlert> alerts
) {
    public record Kpis(int totalCenters, int totalFarmers) {}

    public record CenterMonthlyLitres(String centerName, long totalLitres) {}

    public record SystemAlert(
            long Alert_ID,
            String Alert_Type,
            String Severity,
            String Message,
            boolean Resolved
    ) {}
}
