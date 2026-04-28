import axiosClient from './axiosClient'

// Returns all farmers belonging to the given collection center.
export async function getFarmers(centerId) {
  try {
    const response = await axiosClient.get(`/api/farmers?centerId=${centerId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Returns a single farmer by their ID.
export async function getFarmerById(id) {
  try {
    const response = await axiosClient.get(`/api/farmers/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Creates a new farmer and associates them with a collection center.
export async function createFarmer(data) {
  try {
    const response = await axiosClient.post('/api/farmers', {
      name:               data.name,
      address:            data.address,
      phoneNumber:        data.phoneNumber,
      collectionCenterId: data.collectionCenterId,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// Updates a farmer's editable fields (center association is not changed).
export async function updateFarmer(id, data) {
  try {
    const response = await axiosClient.put(`/api/farmers/${id}`, {
      name:        data.name,
      address:     data.address,
      phoneNumber: data.phoneNumber,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// Permanently deletes a farmer record.
export async function deleteFarmer(id) {
  try {
    const response = await axiosClient.delete(`/api/farmers/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}
