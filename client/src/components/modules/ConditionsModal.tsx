import { FC } from 'react'
import { X, CheckCircle } from 'lucide-react'

interface ConditionsModalProps {
  isOpen: boolean
  title: string
  conditions?: string[]
  onClose: () => void
}

const ConditionsModal: FC<ConditionsModalProps> = ({
  isOpen,
  title,
  conditions = [],
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl transform transition-all ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[80vh] overflow-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-0 right-0 z-10 float-right m-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-white mb-2">
                  {title}
                </h2>
                <p className="text-slate-400">
                  Điều kiện áp dụng và lưu ý quan trọng
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />

            {/* Conditions List */}
            {conditions.length > 0 ? (
              <div className="space-y-4">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/40">
                        <span className="text-sm font-bold text-indigo-300">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-slate-300 leading-relaxed">
                        {condition}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">
                  Không có điều kiện áp dụng bổ sung
                </p>
              </div>
            )}

            {/* Footer Info */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <p className="text-sm text-slate-400">
                💡 <span className="text-slate-300 font-medium">Mẹo:</span> Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với đội hỗ trợ khách hàng của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConditionsModal
