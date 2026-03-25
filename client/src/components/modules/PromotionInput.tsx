import React, { useState, useEffect } from 'react'
import { Button } from '../atomic'
import { useValidatePromotion } from '../../hooks/queries/usePromotion'

interface PromotionInputProps {
  orderValue: number
  onDiscountApplied?: (discount: number, code: string, promotion?: any) => void
  onError?: (error: string) => void
  userId?: string
  cartItems?: Array<{
    productId?: string
    categoryId?: string
    brandId?: string
  }>
  isDark?: boolean
}

const PromotionInput: React.FC<PromotionInputProps> = ({
  orderValue,
  onDiscountApplied = () => {},
  onError = () => {},
  userId,
  cartItems = [],
  isDark = false,
}) => {
  const [code, setCode] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [validatedPromotion, setValidatedPromotion] = useState<any>(null)

  const validateMutation = useValidatePromotion()
  const isLoading = validateMutation.isPending
  const error = validateMutation.error as Error | null

  const handleValidate = async () => {
    if (!code.trim()) {
      onError('Please enter a promotion code')
      return
    }

    try {
      const result = await validateMutation.mutateAsync({
        code: code.toUpperCase(),
        userId,
        orderValue,
        cartItems,
      })

      if (result.success && result.data) {
        setValidatedPromotion(result.data)
        onDiscountApplied(result.data.discount, result.data.code, result.data)
        setShowDetails(true)
      }
    } catch (err: any) {
      onError(err.message || 'Invalid promotion code')
      setValidatedPromotion(null)
    }
  }

  const handleClear = () => {
    setCode('')
    setValidatedPromotion(null)
    setShowDetails(false)
    onDiscountApplied(0, '', null)
  }

  useEffect(() => {
    if (!validatedPromotion) {
      setShowDetails(false)
    }
  }, [validatedPromotion])

  return (
    <div className="w-full">
      {/* Input Section */}
      <div className="mb-4">
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
          Mã khuyến mãi (tuỳ chọn)
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
            placeholder="Nhập mã khuyến mãi..."
            disabled={!!validatedPromotion}
            className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 disabled:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-indigo-500 disabled:bg-slate-100'
            }`}
          />
          {validatedPromotion ? (
            <Button
              onClick={handleClear}
              variant="secondary"
              size="md"
              className={isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}
            >
              Xóa
            </Button>
          ) : (
            <Button
              onClick={handleValidate}
              disabled={isLoading || !code.trim()}
              variant="primary"
              size="md"
              isLoading={isLoading}
              loadingText="Đang kiểm tra..."
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Áp dụng
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-4 p-3 border-l-4 rounded text-sm font-medium ${
          isDark
            ? 'bg-red-900/30 border-red-600 text-red-300'
            : 'bg-red-50 border-red-500 text-red-700'
        }`}>
          {error.message}
        </div>
      )}

      {/* Success Message & Details */}
      {validatedPromotion && (
        <div className={`mb-4 p-4 border-l-4 rounded ${
          isDark
            ? 'bg-green-900/30 border-green-600'
            : 'bg-green-50 border-green-500'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className={`font-semibold mb-1 ${isDark ? 'text-green-300' : 'text-green-900'}`}>
                ✓ Mã khuyến mãi được áp dụng!
              </h4>
              <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                {validatedPromotion.description ||
                  `Giảm ${validatedPromotion.discount.toLocaleString()} VND`}
              </p>
            </div>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="secondary"
              size="sm"
              className={isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}
            >
              {showDetails ? 'Ẩn' : 'Chi tiết'}
            </Button>
          </div>

          {/* Discount Summary */}
          <div className={`mt-3 pt-3 border-t text-sm ${isDark ? 'border-green-700 text-green-300' : 'border-green-200'}`}>
            <div className={`flex justify-between font-medium mb-1 ${isDark ? 'text-green-200' : 'text-green-700'}`}>
              <span>Giá gốc:</span>
              <span>{validatedPromotion.originalValue.toLocaleString()} VND</span>
            </div>
            <div className={`flex justify-between font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              <span>Giảm giá:</span>
              <span>-{validatedPromotion.discount.toLocaleString()} VND</span>
            </div>
          </div>

          {/* Details Section */}
          {showDetails && (
            <div className={`mt-4 pt-4 border-t text-xs space-y-1 ${isDark ? 'border-green-700 text-slate-300' : 'border-green-200 text-slate-700'}`}>
              <div className="flex justify-between">
                <span>Loại khuyến mãi:</span>
                <span className="font-medium">
                  {validatedPromotion.type === 'percentage'
                    ? `${validatedPromotion.value}%`
                    : `${(validatedPromotion.value / 1000).toFixed(0)}k VND`}
                </span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <span>Mã:</span>
                <span className="font-mono font-semibold">
                  {validatedPromotion.code}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

    
    </div>
  )
}

export default PromotionInput
