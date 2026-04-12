import crypto from 'crypto'
import axios from 'axios'

interface MomoPaymentRequest {
  orderId: string
  amount: number
  orderInfo: string
  redirectUrl: string
  ipnUrl: string
  extraData?: string
}

interface MomoPaymentResponse {
  partnerCode: string
  requestId: string
  orderId: string
  amount: number
  responseTime: number
  message: string
  resultCode: number
  payUrl?: string
  deeplink?: string
  applink?: string
  qrCodeUrl?: string
}

class MomoService {
  private partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO'
  private accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85'
  private secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz'
  private momoUrl = process.env.MOMO_ENVIRONMENT === 'production'
    ? 'https://payment.momo.vn/v2/gateway/api/create'
    : 'https://test-payment.momo.vn/v2/gateway/api/create'

  /**
   * Generate HMAC SHA256 signature for Momo
   */
  private generateSignature(rawSignature: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(rawSignature).digest('hex')
  }

  /**
   * Create Momo payment request
   */
  async createPaymentUrl(params: MomoPaymentRequest): Promise<MomoPaymentResponse> {
    const requestId = `${this.partnerCode}${Date.now()}`
    const requestType = 'captureWallet'
    const extraData = params.extraData || ''
    const lang = 'vi'

    // Build raw signature string (must be alphabetical order, using UNENCODED values)
    // Momo API expects the original values in the signature, NOT URL-encoded
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${params.amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${params.ipnUrl}`,
      `orderId=${params.orderId}`,
      `orderInfo=${params.orderInfo}`,
      `partnerCode=${this.partnerCode}`,
      `redirectUrl=${params.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&')

    const signature = this.generateSignature(rawSignature)

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount: params.amount,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      redirectUrl: params.redirectUrl,
      ipnUrl: params.ipnUrl,
      extraData,
      requestType,
      signature,
      lang,
    }

    // 🔍 DEBUG: Log full request details
    console.log('🔍 MOMO REQUEST DEBUG:')
    console.log('  orderId:', params.orderId, '(length:', params.orderId.length + ')')
    console.log('  amount:', params.amount, '(type:', typeof params.amount + ')')
    console.log('  orderInfo:', params.orderInfo, '(length:', params.orderInfo.length + ')')
    console.log('  redirectUrl:', params.redirectUrl)
    console.log('  ipnUrl:', params.ipnUrl)
    console.log('  requestId:', requestId)
    console.log('  partnerCode:', this.partnerCode)
    console.log('  accessKey:', this.accessKey)
    console.log('  Raw Signature:', rawSignature)
    console.log('  Calculated Signature:', signature)
    console.log('  Full Request Body:', JSON.stringify(requestBody, null, 2))
    console.log('  API URL:', this.momoUrl)

    try {
      const response = await axios.post<MomoPaymentResponse>(this.momoUrl, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      })

      console.log('✅ MOMO RESPONSE:', JSON.stringify(response.data, null, 2))
      return response.data
    } catch (error: any) {
      console.error('❌ Momo API Error:')
      console.error('  Status:', error.response?.status)
      console.error('  Status Text:', error.response?.statusText)
      console.error('  Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('  Message:', error.message)
      console.error('  Full Error Response:', JSON.stringify(error.response, null, 2))
      throw new Error(`Momo payment creation failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Verify Momo callback signature
   */
  verifySignature(data: Record<string, any>, signature: string): boolean {
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `amount=${data.amount}`,
      `extraData=${data.extraData || ''}`,
      `ipnUrl=${data.ipnUrl}`,
      `orderId=${data.orderId}`,
      `orderInfo=${data.orderInfo}`,
      `partnerCode=${data.partnerCode}`,
      `redirectUrl=${data.redirectUrl}`,
      `requestId=${data.requestId}`,
      `requestType=${data.requestType}`,
    ].join('&')

    const expectedSignature = this.generateSignature(rawSignature)
    return expectedSignature === signature
  }

  /**
   * Query payment status from Momo
   * Check if a payment request has been completed
   */
  async queryPaymentStatus(requestId: string, orderId: string, amount: number): Promise<{
    resultCode: number
    message: string
    transId?: string
  }> {
    const queryUrl = process.env.MOMO_ENVIRONMENT === 'production'
      ? 'https://payment.momo.vn/v2/gateway/api/query'
      : 'https://test-payment.momo.vn/v2/gateway/api/query'

    // Build raw signature for query request
    const rawSignature = [
      `accessKey=${this.accessKey}`,
      `orderId=${orderId}`,
      `partnerCode=${this.partnerCode}`,
      `requestId=${requestId}`,
    ].join('&')

    const signature = this.generateSignature(rawSignature)

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      orderId,
      signature,
      lang: 'vi',
    }

    try {
      console.log('🔍 QUERYING MOMO PAYMENT STATUS:', { requestId, orderId })
      const response = await axios.post(queryUrl, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      })

      console.log('📊 MOMO QUERY RESPONSE:', JSON.stringify(response.data, null, 2))
      return {
        resultCode: response.data.resultCode,
        message: response.data.message,
        transId: response.data.transId,
      }
    } catch (error: any) {
      console.error('❌ Momo Query Error:', error.response?.data || error.message)
      throw error
    }
  }
}
export default new MomoService()
