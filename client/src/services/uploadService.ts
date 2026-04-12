import api from './api'

/**
 * Upload avatar to Cloudinary via backend
 * @param file - Image file to upload
 * @returns Promise with uploaded image URL
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('images', file)

  try {
    const response = await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success && response.data.data.images && response.data.data.images.length > 0) {
      return response.data.data.images[0].url
    } else {
      throw new Error('Upload failed: No image URL returned')
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Upload failed'
    throw new Error(errorMsg)
  }
}
