// src/api/farmerApi.js

export const fetchFarmerDashboardData = async (farmerId) => {
  // TODO: REPLACE WITH ACTUAL BACKEND ENDPOINT
  // const response = await axios.get(`http://localhost:5000/api/farmer/${farmerId}/dashboard`);
  // return response.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        paymentSummary: {
          Month: 'March',
          Year: 2026,
          Total_Amount: 45200.50,
          Status: 'Processing'
        },
        invoices: [
          { I_ID: 2001, Date: '08 Mar 2026', Total_Litres: 12.5, DRC: 32.1, Total_Amount: 3410.62, PH_Status: 'Normal', TDS_Status: 'Normal' },
          { I_ID: 2002, Date: '07 Mar 2026', Total_Litres: 15.0, DRC: 31.5, Total_Amount: 4016.25, PH_Status: 'Normal', TDS_Status: 'Normal' },
          { I_ID: 2003, Date: '05 Mar 2026', Total_Litres: 10.2, DRC: 28.0, Total_Amount: 2427.60, PH_Status: 'Warning (Low)', TDS_Status: 'Normal' },
          { I_ID: 2004, Date: '03 Mar 2026', Total_Litres: 14.0, DRC: 33.2, Total_Amount: 3950.80, PH_Status: 'Normal', TDS_Status: 'High (Salt Suspected)' },
          { I_ID: 2005, Date: '01 Mar 2026', Total_Litres: 11.5, DRC: 32.5, Total_Amount: 3176.88, PH_Status: 'Normal', TDS_Status: 'Normal' },
        ]
      });
    }, 1000); // 1-second simulated network delay
  });
};