import { FC } from 'react'
import PromoCard from '../small/PromoCard'

const PromoSection: FC = () => {
  return (
    <section className="py-15 " style={{
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
        linear-gradient(135deg, 
          rgba(15, 23, 42, 1) 0%,
          rgba(30, 27, 75, 0.5) 25%,
          rgba(15, 23, 42, 1) 50%,
          rgba(30, 27, 75, 0.5) 75%,
          rgba(15, 23, 42, 1) 100%)
      `,
      backgroundAttachment: 'fixed',
    }}>
      <div className="px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-4">
            Special Offers & Promotions
          </h2>
          <p className="text-slate-400">
            Don't miss out on exclusive deals just for you
          </p>
        </div>

        {/* Promo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Membership Promo */}
          <PromoCard
            variant="membership"
            title="VIP Membership"
            subtitle="Unlock exclusive benefits and save big on every purchase"
            buttonText="Join Now"
            buttonAction={() => console.log('Join membership')}
            image="/images/banner8.png"
          />

          {/* Pre-order Promo */}
          <PromoCard
            variant="preorder"
            title="Pre-Order Now"
            subtitle="Get exclusive items and save up to 30% on new releases"
            buttonText="Pre-Order"
            buttonAction={() => console.log('Pre-order')}
            image="/images/banner7.png"
          />
        </div>
      </div>
    </section>
  )
}

export default PromoSection
