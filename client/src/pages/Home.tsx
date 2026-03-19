import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HeroSlider,
  CategoryShowcase,
  FlashSaleSection,
} from '../components/modules'
import {
  NewArrivalsSection,
  CategoryBannersSection,
  BestSellersSection,
  NewsSection,
  PromoSection,
  NewsletterSection,
} from '../components/sections'

const Home: FC<{ setCartCount?: (count: number | ((prev: number) => number)) => void }> = ({ setCartCount }) => {
  const navigate = useNavigate()

  const handleAddToCart = (product: any) => {
    if (setCartCount) setCartCount(prev => prev + 1)
    console.log(`Added ${product.name} to cart`)
  }

  const handleQuickview = (product: any) => {
    console.log(`Quickview ${product.name}`)
    navigate(`/product/${product._id}`)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ==================== HERO SLIDER ==================== */}
      <HeroSlider
        onExplore={() => navigate('/products')}
        onTrailer={() => console.log('Open trailer')}
        slides={[
          {
            backgroundImage: '/images/banner.png',
            title: 'Resident Evil',
            subtitle: 'Requiem',
            description: 'Bước vào thế giới kinh dị tối tân. Đối mặt với những con quái vật đáng sợ trong một tòa manh kỳ quái đầy bí ẩn.',
          },
          {
            backgroundImage: '/images/banner2.png',
            title: 'Nioh 3',
            subtitle: '仁王３',
            description: 'Chinh phục các demon độc đáo. Hành động sôi động kết hợp với sự thách thức khó khăn từ những quái vật mạnh mẽ.',
          },
          {
            backgroundImage: '/images/marvel-spider-man-miles-morales-ps5-1.png',
            title: 'Spider-Man',
            subtitle: 'Miles Morales',
            description: 'Trở thành Spider-Man mới. Cứu New York khỏi nguy hiểm với những kỹ năng siêu anh hùng độc đáo của Miles Morales.',
          },
          {
            backgroundImage: '/images/banner3.png',
            title: 'Monster Hunter',
            subtitle: 'Wilds',
            description: 'Săn lùng những con quái vật huyền thoại. Chuẩn bị chiến đấu với những loài quái vật khổng lồ trong một thế giới hoang dã.',
          },
          {
            backgroundImage: '/images/banner4.png',
            title: 'Spider-Man 2',
            subtitle: 'Ultimate Edition',
            description: 'Cuộc phiêu lưu Spider-Man tiếp theo. Chơi hai Spider-Man cùng lúc và chiến đấu chống lại các kẻ thù mạnh mẽ.',
          },
        ]}
      />

      {/* ==================== CATEGORY SHOWCASE ==================== */}
      <CategoryShowcase />

      {/* ==================== FLASH SALE SECTION ==================== */}
      <FlashSaleSection
        saleEndTime={Date.now() + 3 * 60 * 60 * 1000}
        onAddToCart={handleAddToCart}
        onQuickview={handleQuickview}
      />

      {/* ==================== NEW ARRIVALS SECTION ==================== */}
      <NewArrivalsSection />

      {/* ==================== CATEGORY BANNERS SECTION ==================== */}
      <CategoryBannersSection />

      {/* ==================== BEST SELLERS SECTION ==================== */}
      <BestSellersSection />

      {/* ==================== NEWS SECTION ==================== */}
      <NewsSection />

      {/* ==================== PROMO SECTION ==================== */}
      <PromoSection />

      {/* ==================== NEWSLETTER SECTION ==================== */}
      <NewsletterSection />
    </div>
  )
}

export default Home
