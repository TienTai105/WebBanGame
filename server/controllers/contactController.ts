import { Request, Response } from 'express'

interface ContactFormData {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
}

export const submitContact = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, subject, message }: ContactFormData = req.body

    // Validation
    if (!fullName || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin',
      })
    }

    // TODO: Send email to admin
    // For now, just log it and return success
    console.log('📧 Contact form submission:', {
      fullName,
      email,
      phone,
      subject,
      message,
      submittedAt: new Date(),
    })

    // In production, you would:
    // 1. Save to database (Contact/Message model)
    // 2. Send email to admin using nodemailer/sendgrid
    // 3. Send confirmation email to user

    res.status(200).json({
      success: true,
      message: 'Tin nhắn đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn sớm.',
      data: {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date(),
      },
    })
  } catch (error: any) {
    console.error('Contact form error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi xảy ra khi gửi tin nhắn',
    })
  }
}

export default {
  submitContact,
}
