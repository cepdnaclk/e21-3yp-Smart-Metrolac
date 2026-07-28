import axiosClient from './axiosClient'

// Returns all payments for the given collection center.
export async function getPaymentsByCenter(centerId) {
  try {
    const response = await axiosClient.get(`/api/payments?centerId=${centerId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Returns all payments for a specific farmer.
export async function getPaymentsByFarmer(farmerId) {
  try {
    const response = await axiosClient.get(`/api/payments?farmerId=${farmerId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Returns payments for a farmer filtered by ISO week number and year.
export async function getPaymentsByFarmerAndWeek(farmerId, week, year) {
  try {
    const response = await axiosClient.get(
      `/api/payments?farmerId=${farmerId}&week=${week}&year=${year}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}

// Triggers a payment recalculation for a farmer's specific week.
// No request body — all parameters are passed as query params.
export async function calculatePayment(farmerId, week, year) {
  try {
    const response = await axiosClient.post(
      `/api/payments/calculate?farmerId=${farmerId}&week=${week}&year=${year}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}
