import { FC } from 'react'
import { cn } from '../../utils/cn'
import Icon from '../atomic/Icon'

interface FooterProps {
  className?: string
}

/**
 * Footer with 4 columns: company info, contact, links, newsletter
 * @component
 */
const Footer: FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn('bg-bg-dark border-t border-primary/20 pt-20 pb-10 relative overflow-hidden', className)}>
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Company Info */}
          <div className="space-y-6">
            <div className="text-3xl font-black tracking-[0.2em] text-white">
              VOLT<span className="text-secondary">RIX</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tiên phong công nghệ gaming tại Việt Nam. Chúng tôi mang đến hệ sinh thái thiết bị
              giải trí đỉnh cao cho cộng đồng game thủ đích thực.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              >
                <Icon name="facebook" size="md" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
              >
                <Icon name="play_circle" size="md" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]"
              >
                <Icon name="music_note" size="md" />
              </a>
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-[0.2em] mb-6">
              Kết nối với chúng tôi
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <Icon name="location_on" size="md" className="text-secondary flex-shrink-0 mt-0.5" />
                <span>92 Pasteur, Quận 1, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="call" size="md" className="text-secondary flex-shrink-0" />
                <span>1900 888 999</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="mail" size="md" className="text-secondary flex-shrink-0" />
                <a href="mailto:contact@voltrix.vn" className="hover:text-secondary transition-colors">
                  contact@voltrix.vn
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Links */}
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-[0.2em] mb-6">
              Chăm sóc khách hàng
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              {[
                'Chính sách bảo hành',
                'Đổi trả & Hoàn tiền',
                'Vận chuyển & Giao nhận',
                'Hướng dẫn thanh toán',
                'Câu hỏi thường gặp',
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-primary transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-primary rounded-full group-hover:w-2 transition-all" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-white font-bold uppercase text-xs tracking-[0.2em] mb-6">
              Newsletter
            </h4>
            <p className="text-slate-400 text-xs mb-4">
              Nhận cập nhật về các sản phẩm mới nhất và ưu đãi độc quyền.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Địa chỉ Email..."
                className="w-full bg-slate-800 border-none rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-indigo-700 text-white font-bold text-xs uppercase py-2.5 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                Đăng ký ngay
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest">
            Copyright © 2025 VOLTRIX Gaming Store. All Rights Reserved.
          </p>
          {/* Payment Methods - Placeholder */}
          <div className="flex items-center gap-4 grayscale opacity-50">
            <span className="text-xs text-slate-500">Accepted Payments:</span>
            <span className="text-sm">💳 Visa • Mastercard • Momo</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
