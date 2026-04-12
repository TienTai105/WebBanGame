import { useMutation } from '@tanstack/react-query'
import api from '../../services/api'

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ChangePasswordResponse {
  success: boolean
  message: string
}

const changePassword = async (data: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
  const response = await api.post('/auth/change-password', data)
  return response.data
}

export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordPayload>({
    mutationFn: changePassword,
  })
}
