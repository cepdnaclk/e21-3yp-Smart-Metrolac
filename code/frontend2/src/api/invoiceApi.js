import axiosClient from './axiosClient'

// Returns all invoices for the given collection center.
export async function getInvoices(centerId) {
  try {
    const response = await axiosClient.get(`/api/invoices?centerId=${centerId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Returns invoices within an inclusive datetime range (ISO strings expected).
export async function getInvoicesByDateRange(centerId, start, end) {
  try {
    const response = await axiosClient.get(
      `/api/invoices?centerId=${centerId}&start=${start}&end=${end}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}

// Returns invoices for a specific ISO week number and year.
export async function getInvoicesByWeek(centerId, week, year) {
  try {
    const response = await axiosClient.get(
      `/api/invoices?centerId=${centerId}&week=${week}&year=${year}`
    )
    return response.data
  } catch (error) {
    throw error
  }
}

// Creates a new invoice record.
export async function createInvoice(data) {
  try {
    const response = await axiosClient.post('/api/invoices', {
      farmerId:            data.farmerId,
      deviceId:            data.deviceId,
      centerId:            data.centerId,
      measurementDateTime: data.measurementDateTime,
      drc:                 data.drc,
      totalLitres:         data.totalLitres,
      totalAmount:         data.totalAmount,
      temperature:         data.temperature,
      phStatus:            data.phStatus,
      tdsStatus:           data.tdsStatus,
    })
    return response.data
  } catch (error) {
    throw error
  }
}
