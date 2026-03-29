import { Request, Response } from 'express'
import Contact from '../models/Contact.js'
import AuditLog from '../models/AuditLog.js'
import { sendContactReplyEmail } from '../services/emailService.js'

interface AuthRequest extends Request {
  user?: any
}

/**
 * POST /api/contact
 * Submit contact form (Public)
 */
export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phone, subject, message } = req.body

    if (!fullName || !email || !phone || !subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
      })
      return
    }

    const contact = await Contact.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    })

    res.status(201).json({
      success: true,
      message: 'Tin nhắn đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn sớm.',
      data: contact,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi xảy ra khi gửi tin nhắn',
    })
  }
}

/**
 * GET /api/contact/admin/all
 * Get all contacts with pagination and filters (Admin/Staff)
 */
export const getAllContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query

    const filter: any = {}
    if (status && status !== 'all') filter.status = status

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Contact.countDocuments(filter)
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('repliedBy', 'name email')
      .lean()

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tải danh sách liên hệ' })
  }
}

/**
 * GET /api/contact/admin/stats
 * Get contact stats (Admin/Staff)
 */
export const getContactStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [stats] = await Contact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
          replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        },
      },
    ])

    res.json({
      success: true,
      data: stats || { total: 0, pending: 0, read: 0, replied: 0, closed: 0 },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * PATCH /api/contact/admin/:id/status
 * Update contact status (Admin/Staff)
 */
export const updateContactStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, adminNotes, replyMessage } = req.body

    if (!['pending', 'read', 'replied', 'closed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' })
      return
    }

    const oldContact = await Contact.findById(id)
    if (!oldContact) {
      res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' })
      return
    }

    const oldStatus = oldContact.status
    const oldNotes = oldContact.adminNotes
    const oldReply = oldContact.replyMessage

    const update: any = { status }
    if (adminNotes !== undefined) update.adminNotes = adminNotes
    if (status === 'replied') {
      update.repliedBy = req.user?._id
      update.repliedAt = new Date()
      if (typeof replyMessage === 'string' && replyMessage.trim().length > 0) {
        update.replyMessage = replyMessage.trim()
      } else {
        res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung trả lời cho khách hàng.' })
        return
      }
    }

    const contact = await Contact.findByIdAndUpdate(id, update, { new: true })
      .populate('repliedBy', 'name email')

    // Gửi email khi trả lời khách
    if (status === 'replied' && update.replyMessage) {
      await sendContactReplyEmail(
        oldContact.email,
        update.replyMessage,
        {
          fullName: oldContact.fullName,
          subject: oldContact.subject,
          message: oldContact.message,
        }
      )
    }

    const changes: Record<string, { old: any; new: any }> = {}
    if (oldStatus !== status) changes.status = { old: oldStatus, new: status }
    if (adminNotes !== undefined && oldNotes !== adminNotes) changes.adminNotes = { old: oldNotes, new: adminNotes }
    if (status === 'replied' && oldReply !== update.replyMessage) changes.replyMessage = { old: oldReply, new: update.replyMessage }

    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        action: oldStatus !== status ? 'STATUS_CHANGE' : 'UPDATE',
        entity: 'Contact',
        entityId: id,
        changes,
        userId: req.user?._id,
        ipAddress: req.ip,
      })
    }

    res.json({ success: true, data: contact, message: 'Cập nhật thành công' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * DELETE /api/contact/admin/:id
 * Delete a contact (Admin/Staff — requires OTP)
 */
export const deleteContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contact = await Contact.findByIdAndDelete(id)

    if (!contact) {
      res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' })
      return
    }

    await AuditLog.create({
      action: 'DELETE',
      entity: 'Contact',
      entityId: id,
      oldValue: contact.toObject(),
      userId: req.user?._id,
      ipAddress: req.ip,
    })

    res.json({ success: true, message: 'Đã xóa liên hệ' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
