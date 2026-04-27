import axiosClient from './axiosClient'

// Returns all alerts for the given center.
export async function getAlerts(centerId) {
  try {
    const response = await axiosClient.get(`/api/alerts?centerId=${centerId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Returns only unresolved alerts for the given center.
export async function getUnresolvedAlerts(centerId) {
  try {
    const response = await axiosClient.get(`/api/alerts/unresolved?centerId=${centerId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Marks a single alert as resolved by the given user.
export async function resolveAlert(alertId, resolvedByUserId) {
  try {
    const response = await axiosClient.put(
      `/api/alerts/${alertId}/resolve?resolvedByUserId=${resolvedByUserId}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}
