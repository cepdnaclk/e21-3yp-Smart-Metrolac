import axiosClient from './axiosClient'

// Returns the current rubber price for the given company.
// Response shape: { pricePerKg: number, effectiveDate: string } or null/empty.
export async function getCurrentPrice(companyId) {
  try {
    const response = await axiosClient.get(`/api/price/current?companyId=${companyId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Creates a new price entry for the given company.
// Body sent: { companyId, pricePerKg }
export async function setPrice(companyId, pricePerKg) {
  try {
    const response = await axiosClient.post('/api/price', { companyId, pricePerKg })
    return response.data
  } catch (error) {
    throw error
  }
}
