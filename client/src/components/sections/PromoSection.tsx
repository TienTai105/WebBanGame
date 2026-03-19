import { FC } from 'react'
import PromoCard from '../small/PromoCard'

const PromoSection: FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
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
            image="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop"
          />

          {/* Pre-order Promo */}
          <PromoCard
            variant="preorder"
            title="Pre-Order Now"
            subtitle="Get exclusive items and save up to 30% on new releases"
            buttonText="Pre-Order"
            buttonAction={() => console.log('Pre-order')}
            image="https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400&h=300&fit=crop"
          />
        </div>
      </div>
    </section>
  )
}

export default PromoSection
