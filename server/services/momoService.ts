import crypto from 'crypto'
import axios from 'axios'

interface MomoPaymentRequest {
  orderId: string
  amount: number
  orderInfo: string
  redirectUrl: string
  ipnUrl: string
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
    const extraData = ''
    const lang = 'vi'

    // Build raw signature string (must be alphabetical order)
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

    try {
      const response = await axios.post<MomoPaymentResponse>(this.momoUrl, requestBody, {
        headers: { 'Content-Type': 'application/json' },
      })

      return response.data
    } catch (error: any) {
      console.error('❌ Momo API Error:', error.response?.data || error.message)
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
}

export default new MomoService()
