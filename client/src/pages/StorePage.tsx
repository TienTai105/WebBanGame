import React from 'react'
import StoreCard from '../components/modules/StoreCard'
import ContactForm from '../components/modules/ContactForm'

const StorePage: React.FC = () => {
  const stores = [
    {
      name: 'Voltrix Flagship',
      type: 'flagship' as const,
      address: '235 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      hours: ['Thứ 2 - Thứ 6: 09:00 - 20:00', 'Cuối tuần: 10:00 - 18:00'],
      phone: '+84 (28) 3822 1234',
    },
    {
      name: 'Voltrix Studio',
      type: 'showroom' as const,
      address: 'Lotte Center, 54 Liễu Giai, Quận Ba Đình, Hà Nội',
      hours: ['Hàng ngày: 10:00 - 22:00'],
      phone: '+84 (24) 3333 5678',
    },
  ]

  return (
    <div
      className="min-h-screen bg-slate-950 relative overflow-hidden"
      style={{
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
      }}
    >
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <span className="inline-block uppercase tracking-widest text-cyan-400 font-bold mb-6 text-xs">
                Store Locator & Contact
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-space-grotesk tracking-tighter text-white leading-tight mb-6">
                Hệ Thống Cửa Hàng <br />
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  Voltrix Global
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl">
                Tìm kiếm cửa hàng gần nhất hoặc gửi lời nhắn cho đội ngũ chuyên gia của chúng tôi. Chúng tôi luôn sẵn sàng hỗ trợ bạn.
              </p>
            </div>
          </div>
        </section>

        {/* Main Content: Split Layout */}
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Map & Locations */}
            <div className="lg:col-span-2 space-y-12">
              {/* Map Placeholder */}
              <div className="relative w-full aspect-video bg-slate-800 rounded-2xl overflow-hidden group border border-slate-700">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0710145357553!2d106.70202631533195!3d10.772193492328033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f1340145a57%3A0x2212ad2c1d0e36c7!2s235%20%C4%90%C3%B4ng%20Kh%C3%B4i%2C%20B%C1%BA%20%C4%90%C3%ACnh%2C%20Ho%20Chi%20Minh%20City%2C%20Vietnam!5e0!3m2!1sen!2s!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none" />
              </div>

              {/* Locations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stores.map((store, idx) => (
                  <StoreCard
                    key={idx}
                    name={store.name}
                    type={store.type}
                    address={store.address}
                    hours={store.hours}
                    phone={store.phone}
                  />
                ))}
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-1">
              <ContactForm />
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

export default StorePage
