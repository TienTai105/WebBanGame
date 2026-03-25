import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

/**
 * Generate OTP (6-digit code)
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP to email
 */
export const sendOTPEmail = async (email: string, otp: string, action: string): Promise<boolean> => {
  try {
    const actionLabel = getActionLabel(action)

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `[VOLTRIX Admin] Xác nhận ${actionLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1>VOLTRIX Admin Panel</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">Xin chào,</p>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              Bạn đã yêu cầu xác nhận để <strong>${actionLabel}</strong>. 
              Mã OTP của bạn là:
            </p>
            
            <div style="background-color: #fff; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 0;">
                ${otp}
              </p>
            </div>
            
            <p style="font-size: 13px; color: #999; margin: 20px 0;">
              ⏰ Mã OTP này sẽ hết hạn trong <strong>5 phút</strong>
            </p>
            
            <p style="font-size: 13px; color: #999; margin: 20px 0;">
              ⚠️ Không chia sẻ mã này với bất kỳ ai. VOLTRIX Admin sẽ không bao giờ yêu cầu mã OTP của bạn.
            </p>
            
            <p style="font-size: 12px; color: #ccc; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              © 2026 VOLTRIX. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ OTP sent to ${email} for action: ${action}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to send OTP email:`, error)
    return false
  }
}

/**
 * Get action label for display
 */
function getActionLabel(action: string): string {
  const labels: { [key: string]: string } = {
    EDIT_PRODUCT: 'chỉnh sửa sản phẩm',
    DELETE_PRODUCT: 'xóa sản phẩm',
    EDIT_ORDER: 'chỉnh sửa đơn hàng',
    REFUND_ORDER: 'hoàn tiền đơn hàng',
    CHANGE_ROLE: 'thay đổi quyền user',
    DELETE_USER: 'xóa user',
    UPDATE_SETTINGS: 'cập nhật cài đặt hệ thống',
    DELETE_NEWS: 'xóa bài viết',
  }
  return labels[action] || 'hành động'
}

/**
 * Send verification email for password reset
 */
export const sendVerificationEmail = async (
  email: string,
  resetLink: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: '[VOLTRIX Admin] Đặt Lại Mật Khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1>VOLTRIX Admin Panel</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333;">Xin chào,</p>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản admin của mình.
            </p>
            
            <p style="font-size: 14px; color: #666; margin: 20px 0;">
              Nhấp vào nút bên dưới hoặc copy link để đặt lại mật khẩu của bạn:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Đặt Lại Mật Khẩu
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666; margin: 20px 0; word-break: break-all;">
              Hoặc copy link này: <code style="background: #f0f0f0; padding: 5px;">${resetLink}</code>
            </p>
            
            <p style="font-size: 13px; color: #999; margin: 20px 0;">
              ⏰ Link này sẽ hết hạn trong <strong>24 giờ</strong>
            </p>
            
            <p style="font-size: 13px; color: #999; margin: 20px 0;">
              ⚠️ Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.
            </p>
            
            <p style="font-size: 12px; color: #ccc; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              © 2026 VOLTRIX. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to send verification email:`, error)
    return false
  }
}
