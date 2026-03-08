// src/api/invoiceApi.js

export const fetchManagerDashboardData = async () => {
  // TODO: REPLACE WITH ACTUAL BACKEND ENDPOINT
  // const response = await axios.get('http://localhost:5000/api/manager/dashboard-init');
  // return response.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        deviceStatus: { id: 'D_ID_01', status: 'Online', lastPing: 'Just now' },
        currentPricePerLiter: 850, // Rs. 850 per Kg of Dry Rubber (Sri Lankan context)
        liveDRC: 31.4, // Simulated live reading from the load cell/sensor
        farmers: [
          { F_ID: 1, Name: 'Nimal Perera' },
          { F_ID: 2, Name: 'Sunil Shantha' },
          { F_ID: 3, Name: 'Champa Kumari' },
        ],
        recentInvoices: [
          { I_ID: 1001, FarmerName: 'Sunil Shantha', Total_Litres: 12.5, DRC: 32.1, Total_Amount: 3410.62, Time: '07:15 AM' },
          { I_ID: 1002, FarmerName: 'Champa Kumari', Total_Litres: 8.0, DRC: 29.5, Total_Amount: 2006.00, Time: '07:42 AM' },
        ]
      });
    }, 1000);
  });
};

export const submitDailyInvoice = async (invoiceData) => {
  // TODO: REPLACE WITH ACTUAL BACKEND ENDPOINT
  // const response = await axios.post('http://localhost:5000/api/invoices', invoiceData);
  // return response.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Invoice successfully recorded.',
        newInvoice: {
          I_ID: Math.floor(Math.random() * 9000) + 1000,
          FarmerName: invoiceData.farmerName,
          Total_Litres: invoiceData.Total_Litres,
          DRC: invoiceData.DRC,
          Total_Amount: invoiceData.Total_Amount,
          Time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      });
    }, 800); // Slightly faster to simulate snappy form submission
  });
};