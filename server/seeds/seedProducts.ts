import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Brand from '../models/Brand.js'
import Platform from '../models/Platform.js'
import Genre from '../models/Genre.js'
import connectDB from '../config/db.js'

dotenv.config()

// Master data - tổng hợp tất cả reference data từ các bảng khác
const SEED_CRITERIA = {
  // Từ seedCategories.ts
  categories: {
    game: { slug: 'game', name: 'Game' },
    machineGame: { slug: 'may-game', name: 'Máy Game' },
    accessory: { slug: 'phu-kien', name: 'Phụ kiện' },
    controller: { slug: 'controller', name: 'Controller' },
    headset: { slug: 'headset', name: 'Headset' },
    hubStandDock: { slug: 'hub-stand-dock', name: 'Hub - Stand - Dock' },
    caseBag: { slug: 'case-bag', name: 'Case - Bag' },
    memory: { slug: 'memory', name: 'Memory' },
    racingAccessories: { slug: 'racing-accessories', name: 'Racing Accessories' },
    skin: { slug: 'skin', name: 'Skin' },
  },
  
  // Từ seedBrands.ts
  brands: {
    sony: { slug: 'sony', name: 'Sony' },
    microsoft: { slug: 'microsoft', name: 'Microsoft' },
    nintendo: { slug: 'nintendo', name: 'Nintendo' },
  },
  
  // Từ seedPlatforms.ts
  platforms: {
    ps5: { slug: 'ps5', name: 'PlayStation 5' },
    ps4: { slug: 'ps4', name: 'PlayStation 4' },
    xbox: { slug: 'xbox', name: 'Xbox' },
    handheldPc: { slug: 'handheld-pc', name: 'Handheld PC' },
    nintendoSwitch: { slug: 'nintendo-switch', name: 'Nintendo Switch' },
    metaQuest: { slug: 'meta-quest', name: 'Meta Quest' },
    retro: { slug: 'retro', name: 'Retro' },
  },
  
  // Từ seedGenres.ts
  genres: {
    actionAdventure: { slug: 'action-adventure', name: 'Action Adventure' },
    arcadePuzzle: { slug: 'arcade-puzzle', name: 'Arcade/Puzzle' },
    familyParty: { slug: 'family-party', name: 'Family/Party' },
    fighting: { slug: 'fighting', name: 'Fighting' },
    gameVr: { slug: 'game-vr', name: 'Game VR' },
    indie: { slug: 'indie', name: 'Indie' },
    musicDance: { slug: 'music-dance', name: 'Music/Dance' },
    platformer: { slug: 'platformer', name: 'Platformer' },
    racing: { slug: 'racing', name: 'Racing' },
    rpg: { slug: 'rpg', name: 'RPG' },
    shooter: { slug: 'shooter', name: 'Shooter' },
    sport: { slug: 'sport', name: 'Sport' },
    strategySim: { slug: 'strategy-sim', name: 'Strategy/Sim' },
  },
}

export const seedProducts = async () => {
  try {
    await Product.deleteMany({})
    console.log('✓ Cleared existing products') 

    // ==================== QUERY TẤT CẢ DỮ LIỆU REFERENCE ====================
    
    // Categories
    const gameCategory = await Category.findOne(SEED_CRITERIA.categories.game)
    const machineGameCategory = await Category.findOne(SEED_CRITERIA.categories.machineGame)
    const accessoryCategory = await Category.findOne(SEED_CRITERIA.categories.accessory)
    const controllerCategory = await Category.findOne(SEED_CRITERIA.categories.controller)
    const headsetCategory = await Category.findOne(SEED_CRITERIA.categories.headset)
    const hubStandDockCategory = await Category.findOne(SEED_CRITERIA.categories.hubStandDock)
    const caseBagCategory = await Category.findOne(SEED_CRITERIA.categories.caseBag)
    const memoryCategory = await Category.findOne(SEED_CRITERIA.categories.memory)
    const racingAccessoriesCategory = await Category.findOne(SEED_CRITERIA.categories.racingAccessories)
    const skinCategory = await Category.findOne(SEED_CRITERIA.categories.skin)
    
    // Brands
    const sonyBrand = await Brand.findOne(SEED_CRITERIA.brands.sony)
    const microsoftBrand = await Brand.findOne(SEED_CRITERIA.brands.microsoft)
    const nintendoBrand = await Brand.findOne(SEED_CRITERIA.brands.nintendo)
    
    // Platforms
    const ps5Platform = await Platform.findOne(SEED_CRITERIA.platforms.ps5)
    const ps4Platform = await Platform.findOne(SEED_CRITERIA.platforms.ps4)
    const xboxPlatform = await Platform.findOne(SEED_CRITERIA.platforms.xbox)
    const handheldPcPlatform = await Platform.findOne(SEED_CRITERIA.platforms.handheldPc)
    const nintendoSwitchPlatform = await Platform.findOne(SEED_CRITERIA.platforms.nintendoSwitch)
    const metaQuestPlatform = await Platform.findOne(SEED_CRITERIA.platforms.metaQuest)
    const retroPlatform = await Platform.findOne(SEED_CRITERIA.platforms.retro)
    
    // Genres
    const actionAdventureGenre = await Genre.findOne(SEED_CRITERIA.genres.actionAdventure)
    const arcadePuzzleGenre = await Genre.findOne(SEED_CRITERIA.genres.arcadePuzzle)
    const familyPartyGenre = await Genre.findOne(SEED_CRITERIA.genres.familyParty)
    const fightingGenre = await Genre.findOne(SEED_CRITERIA.genres.fighting)
    const gameVrGenre = await Genre.findOne(SEED_CRITERIA.genres.gameVr)
    const indieGenre = await Genre.findOne(SEED_CRITERIA.genres.indie)
    const musicDanceGenre = await Genre.findOne(SEED_CRITERIA.genres.musicDance)
    const platformerGenre = await Genre.findOne(SEED_CRITERIA.genres.platformer)
    const racingGenre = await Genre.findOne(SEED_CRITERIA.genres.racing)
    const rpgGenre = await Genre.findOne(SEED_CRITERIA.genres.rpg)
    const shooterGenre = await Genre.findOne(SEED_CRITERIA.genres.shooter)
    const sportGenre = await Genre.findOne(SEED_CRITERIA.genres.sport)
    const strategySimGenre = await Genre.findOne(SEED_CRITERIA.genres.strategySim)

    // Validation
    if (!gameCategory || !machineGameCategory || !sonyBrand || !ps5Platform || !ps4Platform || !rpgGenre || !actionAdventureGenre || !nintendoSwitchPlatform || !xboxPlatform || !retroPlatform || !handheldPcPlatform || !metaQuestPlatform) {
      throw new Error('Required categories, brands, platforms, or genres not found - run seedCategories, seedBrands, seedPlatforms, and seedGenres first')
    }

    // ==================== NHẬP SẢN PHẨM DỮ LIỆU ====================
    
    // Sample products with embedded variants
    const products = await Product.create([
      //Thiết bị game
      {
        name: 'PS5 Slim Standard – Playstation 5 Slim Standard Ghost Of Yõtei Gold – Limited Edition – VN',
        slug: 'PS5 Slim Standard Edition',
        description: 'PS5 Slim Standard Ghost of Yōtei Gold Limited Edition - Máy chơi game thế hệ mới với hiệu năng vượt trội. Thiết kế độc đáo lấy cảm hứng từ kintsugi, tượng trưng cho sự tái sinh. Hỗ trợ chơi game 4K mượt mà, tốc độ tải siêu nhanh nhờ SSD tùy chỉnh. Kèm voucher game Ghost of Yōtei đầy đủ với nội dung số đặt trước. Số lượng giới hạn, phù hợp cho những fan sưu tầm.',
        sku: '22980',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [ps5Platform._id],
        price: 19500000,
        cost: 12000000,
        discount: 0,
        finalPrice: 19500000,
        stock: 50,
        images: [
          {
            url: '/images/pr1.png',
            alt: 'PlayStation 5 ',
            isMain: true,
          },
          {
            url: '/images/pr1.1.png',
            alt: 'PlayStation 5 ',
          },
          {
            url: '/images/pr1.2.png',
            alt: 'PlayStation 5 ',
          },
          {
            url: '/images/pr1.3.png',
            alt: 'PlayStation 5 ',
          },
        ],
        specifications: {
          productcode:'PS5 Slim Standard Edition',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen'],
        ratingAverage: 4.8,
        ratingCount: 2540,
        soldCount: 15000,
        isActive: true,
        views: 45600,
      },
        {
        name: 'PS5 Slim Digital – Playstation 5 Slim Digital – 30th Anniversary Limited',
        slug: 'ps5-slim-digital-30th-anniversary-limited',
        description: 'PS5 Slim Digital 30th Anniversary Limited Edition - Máy chơi game thế hệ mới với hiệu năng vượt trội. Thiết kế độc đáo lấy cảm hứng từ kintsugi, tượng trưng cho sự tái sinh. Hỗ trợ chơi game 4K mượt mà, tốc độ tải siêu nhanh nhờ SSD tùy chỉnh. Kèm voucher game Ghost of Yōtei đầy đủ với nội dung số đặt trước. Số lượng giới hạn, phù hợp cho những fan sưu tầm.',
        sku: '21672',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [ps5Platform._id],
        price: 16500000,
        cost: 11500000,
        discount: 5,
        finalPrice: 15675000,
        stock: 50,
        images: [
          {
            url: '/images/pr5.png',
            alt: 'PlayStation 5 ',
            isMain: true,
          },
          {
            url: '/images/pr5.1.png',
            alt: 'PlayStation 5 ',
          },
          {
            url: '/images/pr5.2.png',
            alt: 'PlayStation 5 ',
          },
        ],
        specifications: {
          productcode:'PS5 Slim Standard Edition',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen'],
        ratingAverage: 4.8,
        ratingCount: 2540,
        soldCount: 15000,
        isActive: true,
        views: 45600,
      },
        {
        name: 'PlayStation 4/PS4 Slim- 1TB – Đen – FW 13.04',
        slug: 'ps4-slim-1tb-den-fw-13-04',
        description: 'PlayStation 4/PS4 Slim 1TB – Đen – FW 13.04 - Máy chơi game thế hệ trước với hiệu năng ổn định. Thiết kế nhỏ gọn, phù hợp cho không gian giải trí tại nhà. Hỗ trợ chơi game Full HD mượt mà, tốc độ tải nhanh nhờ ổ cứng 1TB. Số lượng giới hạn, phù hợp cho những fan sưu tầm.',
        sku: 'P4S1188',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [ps4Platform._id],
        price: 4200000,
        cost: 2500000,
        discount: 0,
        finalPrice: 4200000,
        stock: 50,
        images: [
          {
            url: '/images/pr9.png',
            alt: 'PlayStation 4  ',
            isMain: true, 
          },
          {
            url: '/images/pr9.1.png',
            alt: 'PlayStation 4 ',
          },
          {
            url: '/images/pr9.2.png',
            alt: 'PlayStation 4 ',
          },
        ],
        specifications: {
          productcode:'PS4 Slim Standard Edition',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen'],
        ratingAverage: 4.8,
        ratingCount: 2540,
        soldCount: 10000,
        isActive: true,
        views: 40600,
      },
      {
        name: 'Nintendo Switch 2',
        slug: 'nintendo-switch-2',
        description: 'Nintendo Switch 2 - Máy chơi game cầm tay thế hệ mới với hiệu năng vượt trội. Thiết kế nhỏ gọn, phù hợp cho không gian giải trí tại nhà. Hỗ trợ chơi game Full HD mượt mà, tốc độ tải nhanh nhờ ổ cứng 1TB. Số lượng giới hạn, phù hợp cho những fan sưu tầm.',
        sku: 'NSW22340',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [nintendoSwitchPlatform._id],
        price: 12490000,
        cost: 10000000,
        discount: 0,
        finalPrice: 12490000,
        stock: 50,
        images: [
          {
            url: '/images/pr13.png',
            alt: 'Nintendo Switch 2',
            isMain: true, 
          },
          {
            url: '/images/pr13.1.png',
            alt: 'Nintendo Switch 2',
          },
          {
            url: '/images/pr13.2.png',
            alt: 'Nintendo Switch 2',
          },
          {
            url: '/images/pr13.3.png',
            alt: 'Nintendo Switch 2',
          },
        ],
        specifications: {
          productcode:'Nintendo Switch 2 Standard Edition',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen'],
        ratingAverage: 4.8,
        ratingCount: 2540,
        soldCount: 10000,
        isActive: true,
        views: 40600,
      },
      {
        name: 'Nintendo Switch OLED model with White Joy‑Con',
        slug: 'nintendo-switch-oled-white-joycon',
        description: 'Nintendo Switch OLED model with White Joy‑Con - Máy chơi game cầm tay thế hệ mới với hiệu năng vượt trội. Thiết kế nhỏ gọn, phù hợp cho không gian giải trí tại nhà. Hỗ trợ chơi game Full HD mượt mà, tốc độ tải nhanh nhờ ổ cứng 1TB. Số lượng giới hạn, phù hợp cho những fan sưu tầm.',
        sku: 'SWS996',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [nintendoSwitchPlatform._id],
        price: 7000000,
        cost: 5000000,
        discount: 0,
        finalPrice: 7000000,
        stock: 50,
        images: [
          {
            url: '/images/pr19.png',
            alt: 'Nintendo Switch ',
            isMain: true, 
          },
          {
            url: '/images/pr19.1.png',
            alt: 'Nintendo Switch',
          },
          {
            url: '/images/pr19.2.png',
            alt: 'Nintendo Switch',
          },
          {
            url: '/images/pr19.3.png',
            alt: 'Nintendo Switch',
          },
        ],
        specifications: {
          productcode:'Nintendo Switch 2 Standard Edition',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen'],
        ratingAverage: 4.8,
        ratingCount: 2540,
        soldCount: 10000,
        isActive: true,
        views: 40600,
      },
      {
        name: 'Xbox Series X',
        slug: 'xbox-series-x',
        description: 'Xbox Series X - Máy chơi game console thế hệ mới với hiệu năng vượt trội. Thiết kế mạnh mẽ, phù hợp cho không gian giải trí tại nhà. Hỗ trợ chơi game 4K mượt mà, tốc độ tải nhanh nhờ ổ cứng 1TB. Số lượng giới hạn, phù hợp cho những fan sưu tầm.',
        sku: '16985',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [xboxPlatform._id],
        price: 16500000,
        cost: 10000000,
        discount: 10,
        finalPrice: 14850000,
        stock: 50,
        images: [
          {
            url: '/images/pr31.png',
            alt: 'Xbox Series X',
            isMain: true, 
          },
          {
            url: '/images/pr31.1.png',
            alt: 'Xbox Series X',
          },
          {
            url: '/images/pr31.2.png',
            alt: 'Xbox Series X',
          },
          {
            url: '/images/pr31.3.png',
            alt: 'Xbox Series X',
          },
        ],
        specifications: {
          productcode:'Xbox Series X',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen', 'Sale'],
        ratingAverage: 4.8,
        ratingCount: 2540,
        soldCount: 5000,
        isActive: true,
        views: 30600,
      },
      {
        name: 'Máy Lenovo Legion Go S Steamos – 16GB – 512GB (AMD RYZEN Z2 Go) – Nebula',
        slug: 'lenovo-legion-go-s-steamos',
        description: 'Máy Lenovo Legion Go S Steamos – 16GB – 512GB (AMD RYZEN Z2 Go) – Nebula',
        sku: '23082',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [handheldPcPlatform._id],
        price: 20500000,
        cost: 15000000,
        discount: 0,
        finalPrice: 20500000,
        stock: 50,
        images: [
          {
            url: '/images/pr36.png',
            alt: 'Lenovo Legion',
            isMain: true, 
          },
          {
            url: '/images/pr36.1.png',
            alt: 'Lenovo Legion',
          },
          {
            url: '/images/pr36.2.png',
            alt: 'Lenovo Legion',
          },
          {
            url: '/images/pr36.3.png',
            alt: 'Lenovo Legion',
          },
        ],
        specifications: {
          productcode:'Xbox Series X',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen', 'Sale'],
        ratingAverage: 4.2,
        ratingCount: 2540,
        soldCount: 4000,
        isActive: true,
        views: 20600,
      },
      {
        name: 'Kính thực tế ảo Meta Quest 3 512GB',
        slug: 'meta-quest-3-512gb',
        description: 'Meta Quest 3 là thiết bị kính thực tế ảo đời tiếp theo của chiếc kính vốn đã quá nổi tiếng là Oculus/Meta Quest 2, với cái tên đã chuyển hẳn sang công ty mẹ là Meta, cũng là công ty mẹ của Facebook. Và để tiếp nối sự thành công của Quest 2, Quest 3 sẽ là chiếc kính thực tế ảo hỗn hợp MR (Mixed Reality) dạng Standalone, không cần kết nối với bất kì thiết bị nào khác để có thể sử dụng, có thể nâng cao trải nghiệm chơi game, xem phim online 3D với môi trường cực kì sống động và chân thật, hòa quyện giữa thực tế ảo và cảnh quan thực tế, cạnh tranh trực tiếp với lại các loại kính thực tế ảo của Samsung, hay đích danh kính Vision Pro của Apple,…Là một đời nâng cấp tiếp theo của Quest, Meta Quest 3 giờ đây sẽ gọn hơn về mọi thứ với công nghệ mới, từ chiếc kính đến tay cầm điều khiển, với thiết kế mới của kính cho phép ôm đầu chắc chắn hơn và thoải mái hơn, và điều khiển sẽ gọn hơn bao giờ hết!Meta Quest 3 sẽ được ra mắt với 2 phiên bản là 128GB và 512GB, bỏ đi bản 256GB. Khá là buồn vì 256GB là bản khá là hoàn hảo.',
        sku: '19839',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [metaQuestPlatform._id],
        price: 20500000,
        cost: 15000000,
        discount: 0,
        finalPrice: 20500000,
        stock: 50,
        images: [
          {
            url: '/images/meta-quest-3-1.png',
            alt: 'Meta Quest 3',
            isMain: true, 
          },
          {
            url: '/images/meta-quest-3-2.png',
            alt: 'Meta Quest 3',
          },
          {
            url: '/images/meta-quest-3-3.png',
            alt: 'Meta Quest 3',
          },
          {
            url: '/images/meta-quest-3-4.png',
            alt: 'Meta Quest 3',
          },
        ],
        specifications: {
          productcode:'Meta Quest 3',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen', 'Sale'],
        ratingAverage: 4.2,
        ratingCount: 2540,
        soldCount: 4000,
        isActive: true,
        views: 20600,
      },
      {
        name: 'Super Mini SFC S-03 Wires Gamepad – 621 Tro',
        slug: 'super-mini-sfc-s-03-wires-gamepad-621-tro',
        description: 'Super Mini SFC S-03 là một bộ điều khiển có dây (wired gamepad) đi kèm với hệ máy Super Mini SFC, một bản sao (Famiclone) của Super Nintendo Classic Mini, tích hợp 621 trò chơi NES cổ điển.Thiết kế: Gamepad mô phỏng kiểu dáng của tay cầm Super Famicom, sử dụng cổng 9-pin để kết nối với máy. Các nút B và A được hoán đổi vị trí so với bản gốc; nút Y và L là turbo B, nút X và R là turbo A.Trò chơi: Máy có sẵn 621 tựa game NES, bao gồm Super Mario Bros. 3 (bản Nhật, màu sắc không chính xác), Contra, Pacman, Donkey Kong, v.v. Tuy nhiên, một số trò có thể trùng lặp hoặc là bản hack không chính thức.Tính năng: Hỗ trợ kết nối HDMI, đi kèm 2 tay cầm, cáp Micro USB cấp nguồn, cho phép chơi trên TV màn hình lớn.Hạn chế: Chất lượng tay cầm có thể không bền, nút bấm đôi khi kém nhạy. Một số trò chơi có lỗi màu sắc hoặc không hoạt động mượt mà (theo nhận xét từ người dùng trên YouTube và KeenGamer).',
        sku: '22129',
        categoryId: machineGameCategory._id,  // Máy Game category
        platforms: [retroPlatform._id],
        price: 1000000,
        cost: 500000,
        discount: 0,
        finalPrice: 1000000,
        stock: 50,
        images: [
          {
            url: '/images/SUPER-MINI-SFC-S-03-WIRES-GAMEPAD-621-TRO-1.png',
            alt: 'retro',
            isMain: true, 
          },
          {
            url: '/images/SUPER-MINI-SFC-S-03-WIRES-GAMEPAD-621-TRO-2.png',
            alt: 'retro',
          },
          {
            url: '/images/SUPER-MINI-SFC-S-03-WIRES-GAMEPAD-621-TRO-3.png',
            alt: 'retro',
          },
          {
            url: '/images/SUPER-MINI-SFC-S-03-WIRES-GAMEPAD-621-TRO-4.png',
            alt: 'retro',
          },
        ],
        specifications: {
          productcode:'Meta Quest 3',
          cpudetails: 'AMD Zen 2 8 nhân 16 luồng, xung nhịp 3.5GHz',
          gpu: 'Kiến trúc RDNA 2 của AMD, sức mạnh 10.3 TFLOPS, tốc độ 2.23GHz, hỗ trợ Ray-Tracing',
          ram: '16GB GDDR6',
          internalmemory: '1TB SSD tốc độ đạt 5,5 GB/s',
          newfeutures: 'Hỗ trợ Ray-Tracing, hỗ trợ chơi game 8K 120Hz, âm thanh vòm 3D audio, tương thích ngược với game PS4',
          disc:'Ultra HD Blu-ray (up to 100GB/disc) ~Disc Drive port',
          wifi:'802.11 a/b/g/n/ac/ax',
          conectionport: 'HDMI 2.1, 1 x USB-A, 2 x USB-C',
          avoutputport: 'HDMI 2.1 (4K@120Hz, 8K@60Hz)',
          networkconection: 'Ethernet (10BASE-T, 100BASE-TX, 1000BASE-T)',
          color: 'Trắng',
          size: '358 × 80 × 216 mm',
          weight: '3.2kg',
          power: '100-240V, 50/60Hz',
        },
        tags: ['New Product', 'Gaming', 'Latest Release', 'Next-Gen', 'Sale'],
        ratingAverage: 4.2,
        ratingCount: 2540,
        soldCount: 4000,
        isActive: true,
        views: 20600,
      },
      //Game
      {
        name: 'Game Resident Evil Requiem – PS5',
        slug: 'resident-evil-requiem-ps5',
        description: 'Được vận hành bởi RE ENGINE và tận dụng tối đa sức mạnh của các dòng máy console hiện đại, Resident Evil Requiem mang đến sự chân thực đến rợn người. Từ những chi tiết nhân vật phức tạp như biểu cảm khuôn mặt sống động, kết cấu da thực tế cho đến cả những giọt mồ hôi độ phân giải cao – tất cả chắc chắn sẽ khiến người chơi phải nín thở vì hồi hộp. Resident Evil Requiem đưa loạt truyện trở lại thành phố Raccoon mang tính biểu tượng, nơi khởi nguồn của thảm họa sinh học chấn động thế giới, kết hợp hoàn hảo giữa những khía cạnh kinh dị tâm lý đáng sợ với những pha hành động nghẹt thở mà người hâm mộ bấy lâu nay hằng yêu mến.',
        sku: 'RE-PS5-001',
        categoryId: gameCategory._id,  // Game category
        platforms: [ps5Platform._id],
        genres: [actionAdventureGenre._id],
        images: [
          {
            url: '/images/Game-resident-evil-requiem.png',
            alt: 'Resident Evil Requiem',
            isMain: true,
          },
          {
            url: '/images/Game-resident-evil-requiem.png',
            alt: 'Resident Evil Requiem',
          },
          {
            url: '/images/Game-resident-evil-requiem.png',
            alt: 'Resident Evil Requiem',
          },
          {
            url: '/images/Game-resident-evil-requiem.png',
            alt: 'Resident Evil Requiem',
          },
          {
            url: '/images/Game-resident-evil-requiem.png',
            alt: 'Resident Evil Requiem',
          },
        ],
        specifications: {
          publisher: 'Capcom',
          releaseDate: 'February 27, 2026',
          ESRB: 'Mature 17+',
          numberOfPlayers: '1',
        },
        variants: [
          {
            sku: 'RE-PS5-002',
            attributes: {
              verson: 'Asia',
            },
            price: 1850000 ,
            cost: 900000,
            finalPrice: 1850000,
            stock: 150,
            status: 'active',
          },
          {
            sku: 'RE-PS5-003',
            attributes: {
              verson: 'Euro',
            },
            price: 1850000,
            cost: 900000,
            finalPrice: 1850000,
            stock: 200,
            status: 'active',
          },
          {
            sku: 'RE-PS5-004',
            attributes: {
              verson: 'Usa',
            },
            price: 1950000,
            cost: 1000000,
            finalPrice: 1950000,
            stock: 100,
            status: 'active',
          },
          
        ],
        multiplayer: {
          isMultiplayer: true,
          minPlayers: 1,
          maxPlayers: 1,
          modes: [],
        },
        tags: ['Adventure', 'Best Seller', 'Game Hot', 'Trending'],
        ratingAverage: 4.9,
        ratingCount: 8950,
        soldCount: 12000,
        isActive: true,
        views: 185000,
      },
      {
        name: 'Game Assassin’s Creed Shadows – Nintendo Switch 2',
        slug: 'assassins-creed-shadows-nintendo-switch-2',
        description: 'Trở thành một Thích Khách shinobi nguy hiểm và một võ sĩ đạo samurai huyền thoại mạnh mẽ khi bạn khám phá một thế giới mở tuyệt đẹp trong thời kỳ hỗn loạn. Dù bạn đang ở nhà hay đang di chuyển, hãy trải nghiệm Assassin’s Creed Shadows theo một cách hoàn toàn mới và độc đáo với Nintendo Switch 2.',
        sku: 'AS123',
        categoryId: gameCategory._id,  // Game category
        platforms: [nintendoSwitchPlatform._id],
        genres: [actionAdventureGenre._id],
        images: [
          {
            url: '/images/assassins_creed_shadow_switch-2.png',
            alt: 'Assassin’s Creed Shadows',
            isMain: true,
          },
          {
            url: '/images/assassins_creed_shadow_switch-2-1.png',
            alt: 'Assassin’s Creed Shadows',
          },
          {
            url: '/images/assassins_creed_shadow_switch-2-2.png',
            alt: 'Assassin’s Creed Shadows',
          },
        ],
        specifications: {
          publisher: 'Koei',
          releaseDate: '06/02/2026',
          ESRB: 'Mature 17+',
          numberOfPlayers: '1',
        },
        variants: [
          {
            sku: 'AS-NS-002',
            attributes: {
              verson: 'Asia',
            },
            price: 1550000 ,
            cost: 900000,
            finalPrice: 1550000,
            stock: 150,
            status: 'active',
          },
          {
            sku: 'AS-NS-003',
            attributes: {
              verson: 'Usa',
            },
            price: 1800000,
            cost: 900000,
            finalPrice: 1800000,
            stock: 200,
            status: 'active',
          },
          
        ],
        multiplayer: {
          isMultiplayer: true,
          minPlayers: 1,
          maxPlayers: 1,
          modes: [],
        },
        tags: ['Adventure', 'Best Seller', 'Game Hot', 'Trending'],
        ratingAverage: 4.9,
        ratingCount: 8950,
        soldCount: 12000,
        isActive: true,
        views: 185000,
      },
    ])

    console.log(`✓ Products seeded: ${products.length} created`)
    return { 
      created: products.length, 
      message: `Products seeded: ${products.length} created`,
      ids: products
    }
  } catch (error: any) {
    throw new Error(`Product seed error: ${error.message}`)
  }
}

// Run independently if executed directly
const runDirectly = process.argv[1]?.includes('seedProducts')

if (runDirectly) {
  (async () => {
    try {
      await connectDB()
      console.log('✓ Connected to MongoDB\n')
      
      console.log('🌱 Seeding products...\n')
      const result = await seedProducts()
      
      console.log(`\n✅ Seed completed: ${result.created} products created`)
      process.exit(0)
    } catch (error: any) {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    }
  })()
}
