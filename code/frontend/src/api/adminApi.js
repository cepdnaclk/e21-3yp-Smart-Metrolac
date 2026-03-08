// src/api/adminApi.js

export const fetchAdminDashboardData = async () => {
  // TODO: REPLACE WITH ACTUAL BACKEND ENDPOINT
  // const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats');
  // return response.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        kpis: {
          totalCenters: 14,
          totalFarmers: 1250,
        },
        chartData: [
          { centerName: 'Kalutara Main', totalLitres: 45000 },
          { centerName: 'Kegalle Hub', totalLitres: 38200 },
          { centerName: 'Ratnapura South', totalLitres: 52100 },
          { centerName: 'Galle Estate', totalLitres: 29000 },
        ],
        alerts: [
          { Alert_ID: 101, Alert_Type: 'High TDS', Severity: 'Critical', Message: 'Possible salt adulteration detected.', Resolved: false },
          { Alert_ID: 102, Alert_Type: 'Device Offline', Severity: 'Warning', Message: 'IoT Scale disconnected for 2 hours.', Resolved: true },
          { Alert_ID: 103, Alert_Type: 'Low pH', Severity: 'High', Message: 'Spoiled latex risk. pH dropped below 5.0.', Resolved: false },
          { Alert_ID: 104, Alert_Type: 'Anomalous DRC', Severity: 'Warning', Message: 'Sudden 15% drop in average DRC.', Resolved: true },
        ]
      });
    }, 1000); // 1-second simulated network delay
  });
};