/**
 * Send reply to contact email
 */
export const sendContactReplyEmail = async (to: string, replyMessage: string, contact: { fullName: string; subject: string; message: string }) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
        <div style="background: #2c3e50; color: #fff; padding: 24px 32px; border-bottom: 4px solid #3498db;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Phản hồi liên hệ từ VOLTRIX</h2>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 15px; color: #333;">Xin chào <strong>${contact.fullName}</strong>,</p>
          <p style="font-size: 15px; color: #333;">Chúng tôi đã nhận được liên hệ của bạn với chủ đề: <strong>${contact.subject}</strong></p>
          <div style="margin: 18px 0 28px 0; padding: 18px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 4px;">
            <div style="font-size: 14px; color: #666;">Nội dung liên hệ của bạn:</div>
            <div style="font-size: 15px; color: #222; margin-top: 6px; white-space: pre-line;">${contact.message}</div>
          </div>
          <div style="margin: 18px 0 28px 0; padding: 18px; background: #f0fdf4; border-left: 4px solid #27ae60; border-radius: 4px;">
            <div style="font-size: 14px; color: #15803d; font-weight: 600;">Phản hồi từ Admin:</div>
            <div style="font-size: 15px; color: #222; margin-top: 6px; white-space: pre-line;">${replyMessage}</div>
          </div>
          <p style="font-size: 14px; color: #888; margin-top: 32px;">Nếu bạn có thêm câu hỏi, vui lòng phản hồi email này hoặc liên hệ lại với chúng tôi qua website.</p>
        </div>
        <div style="background: #f8f9fa; color: #888; text-align: center; font-size: 13px; padding: 18px 0; border-top: 1px solid #e0e0e0;">&copy; ${new Date().getFullYear()} VOLTRIX</div>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: `[VOLTRIX] Phản hồi liên hệ của bạn`,
    html: htmlBody,
  });
};
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('📧 Email Service Error:', error)
  } else {
    console.log('✅ Email Service Ready')
  }
})

interface OrderEmailPayload {
  to: string
  orderCode: string
  orderItems: Array<{
    name: string
    quantity: number
    price?: number
    priceAtPurchase?: number
    variantSku?: string
    variant?: string
    warranty?: string
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    phone: string
    district?: string
    ward?: string
  }
  totalPrice: number
  discountAmount: number
  discountCode?: string
  shippingFee: number
  finalTotal: number
  paymentMethod: string
  paymentStatus: string
}

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (data: OrderEmailPayload) => {
  try {
    const itemsHtml = data.orderItems
      .map(
        item => `
      <tr>
        <td class="item-name">
          ${item.name}
          ${item.warranty ? `<br><span style="font-size: 12px; color: #7f8c8d;">Bảo hành: ${item.warranty}</span>` : ''}
          ${item.variant ? `<br><span style="font-size: 12px; color: #7f8c8d;">Loại: ${item.variant}</span>` : ''}
        </td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-price">${(item.priceAtPurchase || item.price || 0).toLocaleString('vi-VN')} ₫</td>
      </tr>
    `
      )
      .join('')

    const paymentStatusBadge = data.paymentStatus === 'paid'
      ? '<span style="background-color: #27ae60; color: white; padding: 6px 12px; border-radius: 3px; font-size: 13px; font-weight: 500;">Đã thanh toán</span>'
      : '<span style="background-color: #e67e22; color: white; padding: 6px 12px; border-radius: 3px; font-size: 13px; font-weight: 500;">Chờ thanh toán</span>'

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8f9fa;
    }
    .wrapper {
      background-color: #f8f9fa;
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #2c3e50;
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #3498db;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .header-subtitle {
      font-size: 14px;
      font-weight: 300;
      color: #ecf0f1;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 35px 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #333;
    }
    .greeting strong {
      color: #2c3e50;
      font-weight: 600;
    }
    .intro-text {
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .order-code-section {
      background-color: #ecf7ff;
      border-left: 4px solid #3498db;
      padding: 20px;
      margin: 25px 0;
      border-radius: 3px;
    }
    .order-code-label {
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .order-code-value {
      font-size: 22px;
      font-weight: 700;
      color: #2c3e50;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
    }
    .payment-status-section {
      text-align: center;
      margin: 20px 0 30px 0;
    }
    .section-header {
      font-size: 16px;
      font-weight: 700;
      color: #2c3e50;
      margin: 35px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid #ecf0f1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
    }
    .items-table th {
      background-color: #f8f9fa;
      padding: 14px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e0e0e0;
    }
    .items-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
      color: #555;
    }
    .items-table tr:last-child td {
      border-bottom: 1px solid #e0e0e0;
    }
    .item-name {
      font-weight: 500;
      color: #2c3e50;
    }
    .item-qty {
      text-align: center;
      color: #7f8c8d;
    }
    .item-price {
      text-align: right;
      color: #27ae60;
      font-weight: 600;
    }
    .pricing-table td {
      padding: 12px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }
    .pricing-table td:first-child {
      color: #666;
      font-weight: 500;
    }
    .pricing-table td:last-child {
      text-align: right;
      color: #333;
    }
    .pricing-table .discount-row td {
      color: #27ae60;
      font-weight: 600;
    }
    .pricing-table .total-row {
      background-color: #f8f9fa;
      font-weight: 700;
      border-top: 2px solid #e0e0e0;
    }
    .pricing-table .total-row td:last-child {
      color: #3498db;
      font-size: 18px;
    }
    .address-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 3px;
      margin-bottom: 25px;
    }
    .address-title {
      font-size: 13px;
      font-weight: 600;
      color: #7f8c8d;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .address-content {
      font-size: 14px;
      line-height: 1.8;
      color: #333;
    }
    .address-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }
    .address-phone {
      margin-top: 10px;
      font-weight: 500;
      color: #2c3e50;
    }
    .payment-method {
      font-size: 14px;
      color: #555;
      padding: 15px 0;
    }
    .payment-method strong {
      color: #2c3e50;
      font-weight: 600;
    }
    .steps-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 3px;
      margin-bottom: 25px;
    }
    .steps-section ol {
      margin: 0;
      padding-left: 24px;
    }
    .steps-section li {
      margin-bottom: 10px;
      color: #555;
      font-size: 14px;
      line-height: 1.6;
    }
    .steps-section li:last-child {
      margin-bottom: 0;
    }
    .support-section {
      background-color: #e8f8f5;
      border-left: 4px solid #27ae60;
      padding: 20px;
      border-radius: 3px;
      margin-bottom: 25px;
    }
    .support-title {
      font-size: 14px;
      font-weight: 700;
      color: #27ae60;
      margin-bottom: 12px;
    }
    .support-content {
      font-size: 14px;
      color: #333;
      line-height: 1.8;
    }
    .support-content strong {
      color: #27ae60;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer-text {
      font-size: 12px;
      color: #999;
      line-height: 1.8;
      margin: 0;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">VOLTRIX</div>
        <div class="header-subtitle">XÁC NHẬN ĐƠN HÀNG</div>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="greeting">Xin chào <strong>${data.shippingAddress.name}</strong>,</p>
        
        <p class="intro-text">Cảm ơn bạn đã đặt hàng tại VOLTRIX. Đơn hàng của bạn đã được tạo thành công. Vui lòng lưu lại thông tin bên dưới để theo dõi đơn hàng.</p>

        <!-- Order Code -->
        <div class="order-code-section">
          <div class="order-code-label">Mã đơn hàng</div>
          <div class="order-code-value">${data.orderCode}</div>
        </div>

        <!-- Payment Status -->
        <div class="payment-status-section">
          ${paymentStatusBadge}
        </div>

        <!-- Order Items -->
        <h2 class="section-header">Chi tiết sản phẩm</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th style="width: 80px; text-align: center;">Số lượng</th>
              <th style="width: 120px; text-align: right;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Pricing Summary -->
        <h2 class="section-header">Tóm tắt đơn hàng</h2>
        <table class="pricing-table">
          <tr>
            <td style="padding: 14px 12px; font-size: 14px; color: #666; font-weight: 500;">Tạm tính:</td>
            <td style="padding: 14px 12px; text-align: right; font-size: 14px; color: #333;">${data.totalPrice.toLocaleString('vi-VN')} ₫</td>
          </tr>
          ${data.discountAmount > 0 ? `
          <tr style="background-color: #f0fdf4; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 14px 12px; font-size: 14px; color: #15803d; font-weight: 600;">Giảm giá${data.discountCode ? ` (${data.discountCode})` : ''}:</td>
            <td style="padding: 14px 12px; text-align: right; font-size: 15px; color: #15803d; font-weight: 700;">-${data.discountAmount.toLocaleString('vi-VN')} ₫</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 14px 12px; font-size: 14px; color: #666; font-weight: 500;">
              ${data.shippingFee > 0 ? 'Phí vận chuyển:' : 'Miễn phí vận chuyển:'}
            </td>
            <td style="padding: 14px 12px; text-align: right; font-size: 14px; color: ${data.shippingFee > 0 ? '#d97706' : '#15803d'}; font-weight: 600;">
              ${data.shippingFee > 0 ? data.shippingFee.toLocaleString('vi-VN') + ' ₫' : 'Miễn phí'}
            </td>
          </tr>
          <tr style="background-color: #eff6ff; border-top: 2px solid #0ea5e9; border-bottom: 1px solid #0ea5e9;">
            <td style="padding: 16px 12px; font-size: 15px; font-weight: 700; color: #0c4a6e;">TỔNG CỘNG:</td>
            <td style="padding: 16px 12px; text-align: right; font-size: 20px; font-weight: 700; color: #0284c7;">${data.finalTotal.toLocaleString('vi-VN')} ₫</td>
          </tr>
        </table>

        <!-- Warranty Information -->
        ${data.orderItems.some(item => item.warranty) ? `
        <h2 class="section-header">Thông tin bảo hành</h2>
        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 18px 16px; border-radius: 3px; margin-bottom: 25px;">
          <div style="font-size: 14px; line-height: 1.8; color: #333;">
            ${data.orderItems
              .filter(item => item.warranty)
              .map(item => `
                <div style="margin-bottom: 10px; display: flex; align-items: flex-start;">
                  <span style="color: #0284c7; font-weight: 600; margin-right: 8px; margin-top: 2px;">✓</span>
                  <div>
                    <strong style="color: #0c4a6e;">${item.name}</strong><br>
                    <span style="color: #666; font-size: 13px;">Bảo hành: ${item.warranty}</span>
                  </div>
                </div>
              `)
              .join('')}
          </div>
        </div>
        ` : ''}

        <!-- Shipping Address -->
        <h2 class="section-header">Địa chỉ giao hàng</h2>
        <div class="address-section">
          <div class="address-content">
            <div class="address-name">${data.shippingAddress.name}</div>
            <div>${data.shippingAddress.address}</div>
            <div>${data.shippingAddress.ward ? data.shippingAddress.ward + ', ' : ''}${data.shippingAddress.district ? data.shippingAddress.district + ', ' : ''}${data.shippingAddress.city}</div>
            <div class="address-phone">${data.shippingAddress.phone}</div>
          </div>
        </div>

        <!-- Payment Method -->
        <h2 class="section-header">Phương thức thanh toán</h2>
        <div class="payment-method">
          <strong>${data.paymentMethod === 'Momo' ? 'Ví Momo' : 'Thanh toán khi nhận hàng (COD)'}</strong>
        </div>

        <!-- Next Steps -->
        <h2 class="section-header">Các bước tiếp theo</h2>
        <div class="steps-section">
          <ol>
            <li>Chúng tôi sẽ xác nhận đơn hàng trong vòng 1-2 giờ</li>
            <li>Sản phẩm sẽ được chuẩn bị và gửi đi</li>
            <li>Bạn sẽ nhận được thông báo cập nhật trạng thái</li>
            ${data.paymentMethod === 'COD' ? '<li>Vui lòng chuẩn bị tiền mặt khi nhận hàng</li>' : ''}
          </ol>
        </div>

        <!-- Support -->
        <div class="support-section">
          <div class="support-title">Hỗ trợ khách hàng</div>
          <div class="support-content">
            Có thắc mắc? Liên hệ với chúng tôi:<br>
            <strong>Hotline:</strong> 1800-9324263<br>
            <strong>Email:</strong> 2200010298@nttu.edu.vn<br>
            <strong>Giờ làm việc:</strong> Thứ 2 - Chủ nhật, 8:00 - 22:00
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">© 2026 VOLTRIX. Tất cả quyền được bảo lưu.</p>
        <p class="footer-text">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    const mailOptions = {
      from: `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: `Xác nhận đơn hàng ${data.orderCode} - VOLTRIX`,
      html: htmlBody,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`Order confirmation email sent successfully to ${data.to} - Message ID: ${result.messageId}`)
    return result
  } catch (error: any) {
    console.error(`Failed to send order confirmation email to ${data.to}:`, {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      stack: error?.stack,
    })
    throw error
  }
}

/**
 * Send email verification
 */
export const sendVerificationEmail = async (to: string, verificationToken: string) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8f9fa;
    }
    .wrapper {
      background-color: #f8f9fa;
      padding: 40px 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #2c3e50;
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #3498db;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .header-subtitle {
      font-size: 14px;
      font-weight: 300;
      color: #ecf0f1;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 15px;
    }
    .description {
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .button-container {
      margin: 35px 0;
    }
    .verify-button {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 14px 40px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    .verify-button:hover {
      background-color: #2980b9;
    }
    .or-divider {
      margin: 25px 0;
      color: #999;
      font-size: 13px;
    }
    .link-section {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 3px;
      margin-bottom: 25px;
    }
    .link-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .link-text {
      font-size: 12px;
      color: #3498db;
      word-break: break-all;
      font-family: 'Courier New', monospace;
    }
    .expire-info {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer-text {
      font-size: 12px;
      color: #999;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">VOLTRIX</div>
        <div class="header-subtitle">XÁC MINH EMAIL</div>
      </div>

      <!-- Content -->
      <div class="content">
        <h1 class="title">Xác minh Email của bạn</h1>
        
        <p class="description">
          Cảm ơn bạn đã đăng ký tài khoản VOLTRIX!<br>
          Để hoàn tất quá trình đăng ký, vui lòng xác minh email của bạn.
        </p>

        <div class="button-container">
          <a href="${verificationUrl}" class="verify-button">Xác minh Email</a>
        </div>

        <div class="or-divider">hoặc sao chép link dưới đây</div>

        <div class="link-section">
          <div class="link-label">Liên kết xác minh:</div>
          <div class="link-text">${verificationUrl}</div>
        </div>

        <div class="expire-info">
          Liên kết này sẽ hết hạn trong 24 giờ.<br>
          Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">© 2026 VOLTRIX. Tất cả quyền được bảo lưu.</p>
        <p class="footer-text">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    const mailOptions = {
      from: `${process.env.GMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Xác minh email - VOLTRIX',
      html: htmlBody,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Verification email sent to ${to}`)
    return result
  } catch (error: any) {
    console.error(`❌ Failed to send verification email:`, error.message)
    throw error
  }
}

export default {
  sendOrderConfirmationEmail,
  sendVerificationEmail,
}
