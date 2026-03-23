import News from '../models/News.js'
import User from '../models/User.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectDB from '../config/db.js'

dotenv.config()

export const seedNews = async (): Promise<{ created: number; message: string; ids: any[] }> => {
  try {
    // Clear existing news
    await News.deleteMany({})
    console.log('✓ Cleared existing news articles')

    // Get admin user for author, or create one if doesn't exist
    let adminUser = await User.findOne({ role: 'admin' })
    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@voltrix.local',
        password: 'temp_password_123',
        phone: '0000000000',
        role: 'admin',
        isActive: true,
      })
      console.log('✓ Created temporary admin user for news author')
    }

    const newsArticles = await News.create([
      {
        title: 'PlayStation 6 công bố lên kế hoạch với công nghệ Ray Tracing AI',
        slug: 'ps6-ai-ray-tracing',
        excerpt: 'Sony công bố chi tiết về PlayStation 6 với công nghệ Ray Tracing hỗ trợ AI mới nhất, dự kiến ra mắt năm 2027.',
        content: `<h2>Sony chính thức công bố PlayStation 6</h2>
          <p>Sony Interactive Entertainment vừa công bố chi tiết lần đầu tiên về PlayStation 6, thế hệ gaming console tiếp theo của công ty. Theo thông báo chính thức, PS6 sẽ được trang bị công nghệ Ray Tracing AI độc quyền, giúp cải thiện đáng kể hiệu suất xử lý đồ họa. Đây là bước tiến lớn trong ngành công nghiệp gaming, đánh dấu sự chuyển đổi sang era mới của tính toán AI trong game.</p>
          <p>Công ty đã hợp tác chặt chẽ với AMD để phát triển chip custom mới nhất, tích hợp công nghệ AI upscaling độc quyền. Console sẽ có khả năng render graphics với độ chi tiết chưa từng có, đồng thời vẫn duy trì hiệu suất ổn định ở 120fps.</p>
          <h3>Các tính năng chính</h3>
          <ul>
            <li>Chip custom AMD 5nm tiếp theo với 16 cores CPU</li>
            <li>GPU RDNA 4 với AI upscaling tích hợp</li>
            <li>Hỗ trợ 8K native gaming ở 120fps</li>
            <li>Tốc độ SSD lên tới 500GB/s</li>
            <li>RAM GDDR7 với dung lượng 24GB</li>
            <li>Ray Tracing real-time với công nghệ AI</li>
          </ul>
          <p>Console sẽ bắt đầu quá trình pre-order vào quý 3 năm nay, với mức giá dự kiến $699 cho phiên bản tiêu chuẩn. Phiên bản đặc biệt Pro với khả năng xử lý mạnh hơn sẽ có giá $899.</p>
          <p>Theo thông báo, Sony đã ký kết hợp đồng với các studio game hàng đầu để phát triển các tựa game độc quyền. Những game này sẽ tận dụng tối đa công nghệ AI Ray Tracing mới, mang đến trải nghiệm chưa từng có trên console.</p>
          <h3>Tương lai của Gaming</h3>
          <p>Giám đốc điều hành Sony Jim Ryan cho biết: "PS6 không chỉ là bước ngoặt trong công nghệ, mà còn là sự thay đổi toàn diện trong cách chúng ta thiết kế và phát triển game. AI Ray Tracing sẽ giải phóng sáng tạo của các nhà phát triển, cho phép họ tạo ra những thế giới sống động hơn, chi tiết hơn, và thú vị hơn."</p>`,
        author: adminUser._id,
        category: 'News',
        tags: ['PlayStation', 'Sony', 'Gaming', 'Console', 'Technology'],
        featured: true,
        status: 'published',
        featuredImage: {
          url: '/images/tintuc1.png',
          alt: 'PlayStation 6 Official Announcement',
        },
        seoTitle: 'PS6 công bố với công nghệ Ray Tracing AI | VOLTRIX',
        seoDescription: 'Chi tiết đầu tiên về PlayStation 6 với công nghệ Ray Tracing AI mới nhất.',
        seoKeywords: ['PS6', 'PlayStation 6', 'Sony', 'Gaming Console'],
        readTime: 12,
        blocks: [
          {
            id: 'ps6_h1',
            type: 'heading',
            level: 2,
            text: 'Sony chính thức công bố PlayStation 6',
          },
          {
            id: 'ps6_p1',
            type: 'paragraph',
            text: 'Sony Interactive Entertainment vừa công bố chi tiết lần đầu tiên về PlayStation 6, thế hệ gaming console tiếp theo của công ty. Theo thông báo chính thức, PS6 sẽ được trang bị công nghệ Ray Tracing AI độc quyền, giúp cải thiện đáng kể hiệu suất xử lý đồ họa. Đây là bước tiến lớn trong ngành công nghiệp gaming, đánh dấu sự chuyển đổi sang era mới của tính toán AI trong game.',
          },
          {
            id: 'ps6_p2',
            type: 'paragraph',
            text: 'Công ty đã hợp tác chặt chẽ với AMD để phát triển chip custom mới nhất, tích hợp công nghệ AI upscaling độc quyền. Console sẽ có khả năng render graphics với độ chi tiết chưa từng có, đồng thời vẫn duy trì hiệu suất ổn định ở 120fps.',
          },
          {
            id: 'ps6_h2',
            type: 'heading',
            level: 3,
            text: 'Các tính năng chính',
          },
          {
            id: 'ps6_list1',
            type: 'list',
            items: [
              'Chip custom AMD 5nm tiếp theo với 16 cores CPU',
              'GPU RDNA 4 với AI upscaling tích hợp',
              'Hỗ trợ 8K native gaming ở 120fps',
              'Tốc độ SSD lên tới 500GB/s',
              'RAM GDDR7 với dung lượng 24GB',
              'Ray Tracing real-time với công nghệ AI',
            ],
          },
          {
            id: 'ps6_p3',
            type: 'paragraph',
            text: 'Console sẽ bắt đầu quá trình pre-order vào quý 3 năm nay, với mức giá dự kiến $699 cho phiên bản tiêu chuẩn. Phiên bản đặc biệt Pro với khả năng xử lý mạnh hơn sẽ có giá $899.',
          },
          {
            id: 'ps6_p4',
            type: 'paragraph',
            text: 'Theo thông báo, Sony đã ký kết hợp đồng với các studio game hàng đầu để phát triển các tựa game độc quyền. Những game này sẽ tận dụng tối đa công nghệ AI Ray Tracing mới, mang đến trải nghiệm chưa từng có trên console.',
          },
          {
            id: 'ps6_h3',
            type: 'heading',
            level: 3,
            text: 'Tương lai của Gaming',
          },
          {
            id: 'ps6_p5',
            type: 'paragraph',
            text: 'Giám đốc điều hành Sony Jim Ryan cho biết: "PS6 không chỉ là bước ngoặt trong công nghệ, mà còn là sự thay đổi toàn diện trong cách chúng ta thiết kế và phát triển game. AI Ray Tracing sẽ giải phóng sáng tạo của các nhà phát triển, cho phép họ tạo ra những thế giới sống động hơn, chi tiết hơn, và thú vị hơn."',
          },
        ],
      },
      {
        title: 'Đánh giá chi tiết: Dragon\'s Dogma 2 - Tác phẩm ma thuật mới',
        slug: 'dragons-dogma-2-review',
        excerpt: 'Dragon\'s Dogma 2 mang đến trải nghiệm gaming đầy hứa hẹn với gameplay cải tiến và đồ họa tuyệt vời.',
        content: `<h2>Dragon's Dogma 2 Review - Tác Phẩm Ma Thuật Thực Sự</h2>
          <p>Capcom's Dragon's Dogma 2 đã chính thức ra mắt và mang đến một trải nghiệm gaming thực sự đặc biệt. Với gameplay được cải tiến đáng kể so với phần 1 và đồ họa siêu đẹp mắt, đây là một tác phẩm không nên bỏ lỡ. Sau gần 10 năm chờ đợi kể từ phần 1, Capcom đã tạo ra một game vượt trội hơn những gì fan hâm mộ kỳ vọng.</p>
          <p>Ngay từ những phút đầu chơi, bạn sẽ nhận thấy sự khác biệt. Thế giới Gransys được thiết kế lại hoàn toàn, với không gian rộng lớn, nhân vật NPC có cuộc sống riêng, và các cuộc chiến boss tỉ mỉ từng chi tiết. Hệ thống Pawn - các đồng hành AI - cũng được cải thiện để trở nên thông minh hơn và giúp đỡ hết mình.</p>
          <h3>Điểm mạnh</h3>
          <ul>
            <li><strong>Tự do gameplay tuyệt vời</strong> - Bạn có thể tiếp cận bất kỳ nhiệm vụ nào theo cách riêng của mình</li>
            <li><strong>Worldbuilding sâu sắc</strong> - Thế giới Gransys xứng đáng được khám phá chi tiết</li>
            <li><strong>Hệ thống pawn AI cải tiến</strong> - Các pawn học hỏi từ những trận chiến trước</li>
            <li><strong>Boss fights thú vị</strong> - Mỗi boss có cách chiến đấu độc đáo, yêu cầu chiến thuật khác nhau</li>
            <li><strong>Đồ họa 4K 60fps fluent</strong> - Cảnh quan tuyệt vời, chi tiết cao</li>
            <li><strong>Tùy chỉnh nhân vật sâu</strong> - Từ ngoại hình đến các kỹ năng, đều có thể tuỳ chỉnh</li>
          </ul>
          <h3>Điểm yếu</h3>
          <ul>
            <li><strong>Lối chơi độc đáo</strong> - Có thể không hợp với tất cả người chơi, các quest đôi khi mơ hồ</li>
            <li><strong>Camera có lúc gặp vấn đề</strong> - Đặc biệt trong các cảnh hẹp, camera có thể bị trì trệ</li>
            <li><strong>Performance chưa tối ưu</strong> - Một số area có hiện tượng frame rate giảm nhẹ</li>
            <li><strong>Chế độ lưu trữ</strong> - Chỉ có một tệp lưu trữ duy nhất, không thể load lại</li>
          </ul>
          <h3>Gameplay & Mechanics</h3>
          <p>Dragon's Dogma 2 duy trì hệ thống chiến đấu hành động nhanh nhạy từ phần 1, nhưng bổ sung thêm nhiều kỹ năng mới và lớp quấn. Sự kết hợp giữa các kỹ năng vật lý, phép thuật, và những tương tác với môi trường tạo ra những cuộc chiến cảnh sát tế nhị và thực hiện.</p>
          <p>Hệ thống Pawn cũng là một điểm nổi bật. Các pawn không chỉ đơn thuần theo lệnh, mà còn có tính cách riêng, có thể yêu cầu bạn làm việc gì đó, hoặc thậm chí bỏ đi nếu họ không thoả mãn. Điều này tạo ra những mối quan hệ phức tạp và thú vị.</p>
          <h3>Kết luận</h3>
          <p><strong>Điểm số: 9/10</strong> - Dragon's Dogma 2 là một game action RPG tuyệt vời, với thế giới sâu sắc, gameplay hấp dẫn, và ghi dấu ấn đúng đắn. Mặc dù có một số vấn đề nhỏ về camera và performance, nhưng đây vẫn là một tác phẩm xứng đáng chiếm vị trí top của năm.</p>`,
        author: adminUser._id,
        category: 'Review',
        tags: ['Dragon\'s Dogma 2', 'Review', 'Capcom', 'RPG', 'Gaming'],
        featured: true,
        status: 'published',
        featuredImage: {
          url: '/images/tintuc1.png',
          alt: 'Dragon\'s Dogma 2 Review',
        },
        seoTitle: 'Đánh giá Dragon\'s Dogma 2 - Tác phẩm ma thuật | VOLTRIX',
        seoDescription: 'Review chi tiết Dragon\'s Dogma 2 với gameplay tuyệt vời và đồ họa đẹp mắt.',
        seoKeywords: ['Dragon\'s Dogma 2', 'Review', 'Capcom', 'RPG'],
        readTime: 15,
        blocks: [
          {
            id: 'dd2_h1',
            type: 'heading',
            level: 2,
            text: 'Dragon\'s Dogma 2 Review - Tác Phẩm Ma Thuật Thực Sự',
          },
          {
            id: 'dd2_p1',
            type: 'paragraph',
            text: 'Capcom\'s Dragon\'s Dogma 2 đã chính thức ra mắt và mang đến một trải nghiệm gaming thực sự đặc biệt. Với gameplay được cải tiến đáng kể so với phần 1 và đồ họa siêu đẹp mắt, đây là một tác phẩm không nên bỏ lỡ. Sau gần 10 năm chờ đợi kể từ phần 1, Capcom đã tạo ra một game vượt trội hơn những gì fan hâm mộ kỳ vọng.',
          },
          {
            id: 'dd2_p2',
            type: 'paragraph',
            text: 'Ngay từ những phút đầu chơi, bạn sẽ nhận thấy sự khác biệt. Thế giới Gransys được thiết kế lại hoàn toàn, với không gian rộng lớn, nhân vật NPC có cuộc sống riêng, và các cuộc chiến boss tỉ mỉ từng chi tiết. Hệ thống Pawn - các đồng hành AI - cũng được cải thiện để trở nên thông minh hơn và giúp đỡ hết mình.',
          },
          {
            id: 'dd2_h2',
            type: 'heading',
            level: 3,
            text: 'Điểm mạnh',
          },
          {
            id: 'dd2_list1',
            type: 'list',
            items: [
              'Tự do gameplay tuyệt vời - Bạn có thể tiếp cận bất kỳ nhiệm vụ nào theo cách riêng của mình',
              'Worldbuilding sâu sắc - Thế giới Gransys xứng đáng được khám phá chi tiết',
              'Hệ thống pawn AI cải tiến - Các pawn học hỏi từ những trận chiến trước',
              'Boss fights thú vị - Mỗi boss có cách chiến đấu độc đáo, yêu cầu chiến thuật khác nhau',
              'Đồ họa 4K 60fps fluent - Cảnh quan tuyệt vời, chi tiết cao',
              'Tùy chỉnh nhân vật sâu - Từ ngoại hình đến các kỹ năng, đều có thể tuỳ chỉnh',
            ],
          },
          {
            id: 'dd2_h3',
            type: 'heading',
            level: 3,
            text: 'Điểm yếu',
          },
          {
            id: 'dd2_list2',
            type: 'list',
            items: [
              'Lối chơi độc đáo - Có thể không hợp với tất cả người chơi, các quest đôi khi mơ hồ',
              'Camera có lúc gặp vấn đề - Đặc biệt trong các cảnh hẹp, camera có thể bị trì trệ',
              'Performance chưa tối ưu - Một số area có hiện tượng frame rate giảm nhẹ',
              'Chế độ lưu trữ - Chỉ có một tệp lưu trữ duy nhất, không thể load lại',
            ],
          },
          {
            id: 'dd2_h4',
            type: 'heading',
            level: 3,
            text: 'Gameplay & Mechanics',
          },
          {
            id: 'dd2_p3',
            type: 'paragraph',
            text: 'Dragon\'s Dogma 2 duy trì hệ thống chiến đấu hành động nhanh nhạy từ phần 1, nhưng bổ sung thêm nhiều kỹ năng mới và lớp quấn. Sự kết hợp giữa các kỹ năng vật lý, phép thuật, và những tương tác với môi trường tạo ra những cuộc chiến cảnh sát tế nhị và thực hiện.',
          },
          {
            id: 'dd2_p4',
            type: 'paragraph',
            text: 'Hệ thống Pawn cũng là một điểm nổi bật. Các pawn không chỉ đơn thuần theo lệnh, mà còn có tính cách riêng, có thể yêu cầu bạn làm việc gì đó, hoặc thậm chí bỏ đi nếu họ không thoả mãn. Điều này tạo ra những mối quan hệ phức tạp và thú vị.',
          },
          {
            id: 'dd2_h5',
            type: 'heading',
            level: 3,
            text: 'Kết luận',
          },
          {
            id: 'dd2_p5',
            type: 'paragraph',
            text: 'Điểm số: 9/10 - Dragon\'s Dogma 2 là một game action RPG tuyệt vời, với thế giới sâu sắc, gameplay hấp dẫn, và ghi dấu ấn đúng đắn. Mặc dù có một số vấn đề nhỏ về camera và performance, nhưng đây vẫn là một tác phẩm xứng đáng chiếm vị trí top của năm.',
          },
        ],
      },
      {
        title: 'Hướng dẫn toàn tập: Cách tối ưu hiệu suất gaming trên PC',
        slug: 'optimize-gaming-pc-guide',
        excerpt: 'Hướng dẫn chi tiết giúp bạn tối ưu hiệu suất gaming PC và đạt FPS cao nhất.',
        content: `<h2>Hướng dẫn Tối Ưu Hiệu Suất Gaming PC - Toàn Tập</h2>
          <p>Để đạt được hiệu suất gaming tốt nhất trên PC của bạn, cần thực hiện một số bước tối ưu quan trọng. Dù máy tính của bạn mới hay cũ, hướng dẫn này sẽ giúp bạn tiết kiệm tiền mà vẫn được hiệu suất cao nhất.</p>
          <h3>Bước 1: Cập Nhật Driver - Nền Tảng Để Mọi Thứ Hoạt Động</h3>
          <p>Luôn cập nhật driver GPU (NVIDIA/AMD) và chipset lên phiên bản mới nhất để có hiệu suất tốt nhất. Driver mới thường bổ sung tối ưu hóa cho các game mới phát hành. Đôi khi, chỉ cần cập nhật driver là bạn có thể tăng FPS thêm 10-15%.</p>
          <p><strong>Cách thực hiện:</strong></p>
          <ul>
            <li>NVIDIA - Truy cập <em>nvidia.com/Download</em>, chọn card, driver version, tải và cài</li>
            <li>AMD - Truy cập <em>amd.com</em>, chọn Radeon Software, tải và cài</li>
            <li>Chipset - Truy cập trang hãng sản xuất mainboard (ASUS, MSI, Gigabyte, etc.)</li>
          </ul>
          <h3>Bước 2: Tối Ưu Cài Đặt BIOS - Nâng Cao Hiệu Năng CPU/RAM</h3>
          <p>BIOS là phần mềm gốc của motherboard. Việc kích hoạt một số tính năng trong BIOS có thể cải thiện hiệu suất đáng kể.</p>
          <ul>
            <li><strong>XMP/DOCP</strong> - Khởi động RAM ở tốc độ được quảng cáo. Bước này là cực kỳ quan trọng! RAM quảng cáo ở 3600MHz nhưng nếu không kích hoạt XMP, nó sẽ chạy ở 2133MHz.</li>
            <li><strong>Tắt Fast Boot</strong> - Tăng tốc độ khởi động không đáng kể nhưng có thể gây vấn đề với một số thiết bị</li>
            <li><strong>Tắt Intel ME / AMD PSP</strong> - Giảm độ trễ nhưng cần cẩn thận nếu không biết rõ</li>
            <li><strong>Cân chỉnh CPU Voltage/Clock</strong> - Cho advanced users, có thể tăng FPS nhưng đi kèm rủi ro</li>
          </ul>
          <h3>Bước 3: Cấu Hình In-Game - Điều Chỉnh Settings</h3>
          <p>Đây là bước quan trọng nhất vì nó trực tiếp ảnh hưởng đến FPS bạn nhận được. Mục tiêu là tìm cân bằng giữa chất lượng đồ họa và hiệu suất.</p>
          <p><strong>Ưu tiên từ cao nhất đến thấp nhất:</strong></p>
          <ol>
            <li><strong>Resolution</strong> - Giảm resolution từ 1440p xuống 1080p có thể tăng FPS 30-50%</li>
            <li><strong>Ray Tracing</strong> - Tắt hoàn toàn hoặc đặt thành Medium/Low (rất tốn resources)</li>
            <li><strong>Shadow Quality</strong> - Đặt High thay vì Ultra (người mắt khó phân biệt). Ultra ray-traced shadows rất tốn resources</li>
            <li><strong>Texture Quality</strong> - Giữ High hoặc Ultra (ảnh hưởng ít đến FPS, tác động VRAM)</li>
            <li><strong>Draw Distance / LOD</strong> - Giảm xuống Medium để giảm tải CPU</li>
            <li><strong>Water Quality / Reflections</strong> - Đặt Medium hoặc High thay vì Ultra</li>
            <li><strong>Motion Blur / Bloom</strong> - Tắt hoặc Low (chỉ ảnh hưởng thị giác)</li>
          </ol>
          <h3>Bước 4: Cài Đặt Hệ Điều Hành - Windows Tối Ưu</h3>
          <p><strong>Tắt các dịch vụ không cần thiết:</strong></p>
          <ul>
            <li>Windows Update (trong khi chơi)</li>
            <li>Background Apps (Settings → Privacy & Security → App Permissions)</li>
            <li>Visual Effects (Settings → System → About → Advanced system settings → Performance)</li>
            <li>Superfetch service (Services.msc → Superfetch → Disable)</li>
          </ul>
          <p><strong>Kích hoạt Gaming Mode:</strong> Windows 10/11 có Game Mode - kích hoạt để tối ưu hóa resources cho gaming.</p>
          <h3>Bước 5: Quản Lý Nhiệt Độ - Giữ PC Lạnh</h3>
          <p>Khi CPU/GPU nóng, chúng bị giảm xung (throttling) để tự bảo vệ, dẫn đến FPS giảm.</p>
          <ul>
            <li><strong>Làm sạch bụi</strong> - Mở thùng máy, dùng hơi nén để thổi bụi (đừng quên tắt máy)</li>
            <li><strong>Thay pasta nhiệt</strong> - Nếu máy cũ hơn 2 năm, pasta có thể bị khô, hãy thay mới</li>
            <li><strong>Kiểm tra fan</strong> - Đảm bảo tất cả fan quay bình thường</li>
            <li><strong>Nâng cấp cooling</strong> - Nếu đang dùng stock cooler, hãy nâng cấp lên aftermarket cooler</li>
          </ul>
          <h3>Bước 6: Monitoring & Benchmarking - Đo Lường Kết Quả</h3>
          <p>Sử dụng các công cụ để theo dõi hiệu suất:</p>
          <ul>
            <li><strong>MSI Afterburner</strong> - Theo dõi CPU/GPU/RAM usage, temperature, FPS</li>
            <li><strong>3DMark</strong> - Benchmark để so sánh hiệu suất với máy khác</li>
            <li><strong>GPU-Z & CPU-Z</strong> - Xem thông tin chi tiết hardware</li>
          </ul>
          <h3>Các Mẹo Bonus</h3>
          <ul>
            <li><strong>Hạ sàn FPS</strong> - Nếu FPS không ổn định, hạn chế FPS ở mức ổn định thay vì VSync</li>
            <li><strong>Frame Rate Limit</strong> - Giới hạn FPS ở 60/120/144 tùy monitor của bạn</li>
            <li><strong>DLSS (NVIDIA) / FSR (AMD)</strong> - Upscaling technology giúp tăng FPS mà không làm mất chất lượng</li>
            <li><strong>Tắt Overlay</strong> - Discord/Steam overlay có thể làm giảm FPS 5-10%</li>
          </ul>
          <h3>Kết Luận</h3>
          <p>Tối ưu hóa gaming PC không phải là một công việc dễ, nhưng với các bước này, bạn sẽ thấy cải thiện đáng kể. Hãy thực hiện từng bước một, benchmark sau mỗi bước để thấy sự khác biệt. Thành công!</p>`,
        author: adminUser._id,
        category: 'Guide',
        tags: ['Gaming PC', 'Performance', 'Guide', 'Optimization', 'Tips'],
        featured: false,
        status: 'published',
        featuredImage: {
          url: '/images/tintuc1.png',
          alt: 'Gaming PC Optimization Guide',
        },
        seoTitle: 'Hướng dẫn tối ưu PC gaming - Đạt FPS cao | VOLTRIX',
        seoDescription: 'Hướng dẫn chi tiết tối ưu hiệu suất gaming PC để đạt FPS cao nhất.',
        seoKeywords: ['Gaming PC', 'Optimization', 'Performance', 'Guide'],
        readTime: 20,
        blocks: [
          {
            id: 'pc_h1',
            type: 'heading',
            level: 2,
            text: 'Hướng dẫn Tối Ưu Hiệu Suất Gaming PC - Toàn Tập',
          },
          {
            id: 'pc_p1',
            type: 'paragraph',
            text: 'Nếu bạn muốn chơi game mới nhất với FPS cao, đây là hướng dẫn toàn diện mà bạn cần. Từ setting driver đến quản lý resources, tất cả sẽ được đề cập. Chúng ta sẽ cùng tối ưu hệ thống của bạn step-by-step.',
          },
          {
            id: 'pc_h2',
            type: 'heading',
            level: 3,
            text: 'Bước 1: Update Driver - GPU & CPU',
          },
          {
            id: 'pc_h3',
            type: 'heading',
            level: 3,
            text: 'Bước 2: Cài Đặt Game - Chọn Đúng Đường Dẫn',
          },
          {
            id: 'pc_h4',
            type: 'heading',
            level: 3,
            text: 'Bước 3: Graphics Settings - Cân Bằng Giữa Quality & FPS',
          },
          {
            id: 'pc_h5',
            type: 'heading',
            level: 3,
            text: 'Bước 4: Quản Lý System Resources - Giải Phóng RAM',
          },
          {
            id: 'pc_h6',
            type: 'heading',
            level: 3,
            text: 'Kết Luận',
          },
          {
            id: 'pc_p2',
            type: 'paragraph',
            text: 'Tối ưu hóa gaming PC không phải là một công việc dễ, nhưng với các bước này, bạn sẽ thấy cải thiện đáng kể. Hãy thực hiện từng bước một, benchmark sau mỗi bước để thấy sự khác biệt. Thành công!',
          },
        ],
      },
      {
        title: 'Tương lai của gaming: Phỏng vấn độc quyền với nhà đạo diễn Hideo Kojima',
        slug: 'interview-hideo-kojima',
        excerpt: 'Phỏng vấn độc quyền với Hideo Kojima về tương lai của gaming và các dự án sắp tới.',
        content: `<h2>Phỏng Vấn Hideo Kojima - Tương Lai của Gaming</h2>
          <p>Chúng tôi có cơ hội phỏng vấn độc quyền với huyền thoại Hideo Kojima, người sáng tạo ra series Metal Gear Solid nổi tiếng. Trong cuộc trò chuyện dài 2 giờ tại Tokyo, ông Kojima chia sẻ những suy nghĩ của mình về tương lai của ngành công nghiệp gaming, cũng như các dự án sắp tới của Kojima Productions.</p>
          <h3>Câu hỏi 1: Dự Án Tiếp Theo Là Gì?</h3>
          <p><strong>Phóng viên:</strong> Chúng tôi biết Kojima Productions đã ký hợp đồng với Sony Interactive Entertainment. Können bạn chia sẻ một chút về dự án tiếp theo?</p>
          <p><strong>Kojima:</strong> Đúng vậy, chúng tôi rất vui khi hợp tác với Sony. Dự án tiếp theo sẽ được công bố trong năm nay, có tên là "Death Stranding 2". Nó là một bước tiến lớn so với phần 1. Chúng tôi đã nghe những nhất phản hồi từ cộng đồng game thủ, và đã cải thiện đáng kể.</p>
          <p>Ngoài Death Stranding 2, chúng tôi cũng đang phát triển một dự án khác - một game action mới với nguồn cảm hứng từ phim ảnh. Nó sẽ kết hợp gameplay sáng tạo với những câu chuyện đẫm cảm xúc. Dự kiến ra mắt vào 2025.</p>
          <h3>Câu Hỏi 2: Tương Lai của Storytelling Trong Games?</h3>
          <p><strong>Phóng viên:</strong> Storytelling là điểm mạnh của Kojima Productions. Bạn thấy như thế nào về hướng đi của storytelling trong games?</p>
          <p><strong>Kojima:</strong> Theo tôi, storytelling trong games sẽ trở nên sâu sắc hơn. Chúng ta đang nhập vào era mới, nơi games không chỉ là giải trí, mà còn là một phương tiện để nói lên những điều sâu sắc về con người, xã hội, và cuộc sống.</p>
          <p>Tôi tin rằng games sẽ kết hợp kỹ thuật tiên tiến - AI, ray tracing, virtual reality - với những câu chuyện có ý nghĩa nhân văn. Nó không về graphics đẹp hay gameplay phức tạp. Đó là cảm xúc. Nó là sự kết nối giữa nhà sáng tạo và người chơi.</p>
          <h3>Câu Hỏi 3: Về AI Trong Games</h3>
          <p><strong>Phóng viên:</strong> AI đang trở nên công cụ mạnh mẽ trong lập trình game. Bạn có lo ngại về việc AI thay thế sáng tạo con người không?</p>
          <p><strong>Kojima:</strong> AI là công cụ. Không có gì sợ về nó. Nhưng cái gì làm game trở nên "game" không phải là AI hay graphics, mà là "human spirit" của nhà sáng tạo. AI có thể giúp tăng tốc độ phát triển, giúp cải thiện độ chi tiết, nhưng nó không thể thay thế sáng tạo con người.</p>
          <p>Trong Kojima Productions, chúng tôi sử dụng AI để giúp team phát triển game nhanh hơn, nhưng quyết định sáng tạo cuối cùng luôn là của con người. Ví dụ, AI có thể giúp tạo asset một cách nhanh chóng, nhưng cách chúng ta sắp xếp chúng, cách chúng ta thiết kế gameplay - đó là của con người.</p>
          <h3>Câu Hỏi 4: Về Khối Lượng Công Việc Trong Industry</h3>
          <p><strong>Phóng viên:</strong> Ngành công nghiệp game nổi tiếng vì khối lượng công việc cao. Kojima Productions có chính sách khác không?</p>
          <p><strong>Kojima:</strong> Đây là vấn đề lớn trong industry, và tôi rất quan tâm. Một nhân viên phải làm việc quá lâu, họ không thể sáng tạo tốt nhất. Creativity cần thời gian, cần sự thư giãn, cần cuộc sống ngoài công việc.</p>
          <p>Tại Kojima Productions, chúng tôi cố gắng tạo môi trường làm việc tốt. Chúng tôi giới hạn giờ làm việc, tôn trọng công việc cân bằng giữa cuộc sống. Nó không phải lúc nào cũng hoàn hảo, nhưng đó là mục tiêu của chúng tôi.</p>
          <h3>Câu Hỏi 5: Lời Khuyên Cho Lập Trình Viên Trẻ?</h3>
          <p><strong>Phóng viên:</strong> Nếu bạn có lời khuyên cho những lập trình viên game trẻ, bạn sẽ nói gì?</p>
          <p><strong>Kojima:</strong> Đầu tiên, hãy đam mê. Nếu bạn không yêu game, không yêu sự sáng tạo, đừng làm. Nó quá khó khăn để làm chỉ vì tiền.</p>
          <p>Thứ hai, hãy học hỏi từ mọi nơi - phim, sách, âm nhạc, nghệ thuật. Không phải tất cả cảm hứng đến từ games. Tôi là fan của cinema, phim Kurosawa là nguồn cảm hứng lớn cho tôi.</p>
          <p>Thứ ba, đừng sợ thất bại. Một số game của tôi không được mọi người yêu thích, nhưng tôi vẫn tiếp tục. Thất bại là một phần của quá trình sáng tạo.</p>
          <h3>Kết Luận</h3>
          <p>Phỏng vấn với Hideo Kojima là một trải nghiệm tuyệt vời. Ông có một tầm nhìn rõ ràng về tương lai của gaming, và đám mệ lớn với craftsmanship. Chúng tôi rất mong chờ những dự án sắp tới của Kojima Productions!</p>`,
        author: adminUser._id,
        category: 'Interview',
        tags: ['Hideo Kojima', 'Interview', 'Game Developers', 'Gaming Industry', 'Future'],
        featured: true,
        status: 'published',
        featuredImage: {
          url: '/images/tintuc4.png',
          alt: 'Hideo Kojima Interview',
        },
        seoTitle: 'Phỏng vấn Hideo Kojima - Tương lai gaming | VOLTRIX',
        seoDescription: 'Phỏng vấn độc quyền với Hideo Kojima về tương lai của gaming.',
        seoKeywords: ['Hideo Kojima', 'Interview', 'Gaming', 'Future'],
        readTime: 16,
        blocks: [
          {
            id: 'kojima_h1',
            type: 'heading',
            level: 2,
            text: 'Phỏng vấn: Hideo Kojima - Tương lai Gaming',
          },
          {
            id: 'kojima_p1',
            type: 'paragraph',
            text: 'Hideo Kojima, cha đẻ của series Metal Gear Solid, là một trong những tài năng sáng tạo nhất trong ngành game. Tuy nhiên, sau khi rời Konami, anh đã lập nên studio riêng - Kojima Productions, đặc biệt với Death Stranding.',
          },
          {
            id: 'kojima_quote',
            type: 'quote',
            text: 'Gaming sẽ là trung tâm của giải trí trong tương lai. Thế hệ tiếp theo sẽ là công kính xứ hãn một trong những ngành văn hóa lõng nhất.',
          },
          {
            id: 'kojima_h2',
            type: 'heading',
            level: 3,
            text: 'VR & New Technologies',
          },
          {
            id: 'kojima_h3',
            type: 'heading',
            level: 3,
            text: 'Storytelling trong Game',
          },
          {
            id: 'kojima_h4',
            type: 'heading',
            level: 3,
            text: 'Kết Luận',
          },
        ],
      },
      {
        title: 'Thảo luận: Có phải gaming chủ yếu dựa vào graphics?',
        slug: 'debate-gaming-graphics-gameplay',
        excerpt: 'Tranh luận sâu sắc về vai trò của graphics và gameplay trong việc tạo nên một tựa game tuyệt vời.',
        content: `<h2>Graphics hay Gameplay - Cái Nào Quan Trọng Hơn?</h2>
          <p>Đây là một tranh luận lâu đời trong cộng đồng gaming: Cái nào quan trọng hơn - đồ họa đẹp hay lối chơi hấp dẫn? Câu trả lời không đơn giản như bạn nghĩ.</p>
          <h3>Quan Điểm 1: Gameplay Là Vua</h3>
          <p>Nhiều game có đồ họa đơn giản nhưng lối chơi tuyệt vời như Tetris, Minecraft, hay Fortnite vẫn trở thành các tượng đài gaming và kiếm được hàng tỷ đô la.</p>
          <p><strong>Tetris (1989):</strong> Đồ họa là hình vuông pixel đơn giản, nhưng gameplay qua thời gian đã trở thành biểu tượng văn hóa. Nó giải trí hàng triệu người trên khắp thế giới.</p>
          <p><strong>Minecraft (2009):</strong> Toàn bộ thế giới là khối vuông, pixel art kiểu "thô" với tiêu chuẩn hiện đại, nhưng gameplay sáng tạo của nó tạo nên hiện tượng toàn cầu. Bạn có thể xây dựng bất cứ thứ gì, và đó là cái khiến nó tuyệt vời.</p>
          <p><strong>Fortnite (2017):</strong> Mặc dù có đồ họa tốt, nhưng thành công của nó đến từ gameplay Battle Royale đơn giản nhưng hấp dẫn, kết hợp với mechanics building độc đáo.</p>
          <p>Nếu gameplay không tốt, dù đồ họa đẹp cỡ nào, người chơi sẽ bỏ sau vài giờ.</p>
          <h3>Quan Điểm 2: Graphics Tạo Sự Immersion Hoàn Toàn</h3>
          <p>Mặt khác, đồ họa tuyệt vời có vai trò quan trọng trong việc tạo nên trải nghiệm gaming hiện đại.</p>
          <p><strong>Cyberpunk 2077:</strong> Mặc dù gặp vấn đề gameplay lúc ra mắt, mọi người vẫn tiếp tục chơi để khám phá thành phố Night City tuyệt vời với graphics đẹp hưởng.</p>
          <p><strong>Unreal Engine 5 Games:</strong> Các game sử dụng UE5 như Fortnite 5, The Matrix Awakens, demo Chaos, và State of Decay 3 đều cung cấp sự immersion ngoạn mục. Người chơi cảm thấy như đang sống trong một thế giới thực.</p>
          <p><strong>Red Dead Redemption 2:</strong> Game này yêu cầu PC/console mạnh mẽ vì đồ họa quá tuyệt vời. Mặc dù gameplay có vấn đề (cảm thấy chậm), graphics đẹp đó là lý do nhiều người vẫn chơi.</p>
          <p>Graphics tốt giúp:</p>
          <ul>
            <li>Tạo immersion - Bạn cảm thấy như đang sống trong thế giới game</li>
            <li>Hỗ trợ storytelling - Cảnh phim cinema-quality tạo cảm xúc sâu sắc</li>
            <li>Tăng giá trị sản phẩm - Game đẹp bán được giá cao hơn</li>
            <li>Tương tác với media khác - Game có thể đạt tiêu chuẩn điện ảnh</li>
          </ul>
          <h3>Thực Tế: Cần Cả Hai</h3>
          <p>Câu trả lời thực tế là: Cần cả hai, nhưng theo ưu tiên khác nhau tùy loại game.</p>
          <p><strong>Ưu Tiên Gameplay:</strong></p>
          <ul>
            <li>Game hành động (FPS, RPG hành động) - Gameplay trôi chảy là tối quan trọng</li>
            <li>Game indie - Màn hình bé, team nhỏ, gameplay là chìa khóa thành công</li>
            <li>Game mobile - Graphics tốt nhưng gameplay phải addictive</li>
          </ul>
          <p><strong>Ưu Tiên Graphics:</strong></p>
          <ul>
            <li>Game story-driven - Câu chuyện tuyệt vời cần graphics tuyệt vời</li>
            <li>Game simulator - Lái xe, mô phỏng, đồ họa thực tế là yêu cầu</li>
            <li>Game AAA - Budget lớn cho phép đầu tư vào cả hai</li>
          </ul>
          <h3>Ví Dụ: Những Game Thành Công Cân Bằng Tốt</h3>
          <p><strong>The Legend of Zelda: Breath of the Wild</strong> - Graphics có thể không state-of-the-art (Nintendo Switch yếu hơn PS5), nhưng gameplay thì vô cùng tuyệt vời. Nó thắng Game of the Year 2017.</p>
          <p><strong>Elden Ring</strong> - Graphics tốt, gameplay thách đấu, kết hợp cả hai yếu tố này tạo nên tác phẩm huyền thoại.</p>
          <p><strong>Baldur's Gate 3</strong> - Graphics tuyệt vời + gameplay deep (D&D mechanics) = Game được yêu thích nhất 2023.</p>
          <h3>Kết Luận & Suy Nghĩ Cá Nhân</h3>
          <p>Tôi tin rằng:</p>
          <ol>
            <li><strong>Gameplay là nền tảng</strong> - Nếu game không hay, graphics đẹp cũng không cứu được</li>
            <li><strong>Graphics là mầm tòi</strong> - Graphics tốt có thể giúp gamePlay tốt trở nên kiệt tác</li>
            <li><strong>Art direction > Thế hệ graphics</strong> - Một game với art direction tốt sẽ trông đẹp hơn một game đơn thuần chạy đua về graphics</li>
            <li><strong>Tương lai là cả hai</strong> - Với công nghệ AI, real-time ray tracing, và next-gen hardware, chúng ta sẽ có game vừa đẹp vừa hay trong tương lai</li>
          </ol>
          <p>Cuối cùng, game tuyệt vời cần cả hai: Graphics tốt để tạo sự hấp dẫn, nhưng Gameplay tốt để giữ chân người chơi và khiến họ muốn quay lại.</p>`,
        author: adminUser._id,
        category: 'Opinion',
        tags: ['Gaming Debate', 'Graphics', 'Gameplay', 'Gaming Industry', 'Opinion'],
        featured: false,
        status: 'published',
        featuredImage: {
          url: '/images/tintuc1.png',
          alt: 'Graphics vs Gameplay Debate',
        },
        seoTitle: 'Graphics hay Gameplay - Cái nào quan trọng? | VOLTRIX',
        seoDescription: 'Tranh luận về vai trò graphics và gameplay trong lập trình game.',
        seoKeywords: ['Graphics', 'Gameplay', 'Gaming', 'Debate', 'Opinion'],
        readTime: 14,
        blocks: [
          {
            id: 'debate_h1',
            type: 'heading',
            level: 2,
            text: 'Graphics hay Gameplay - Cái Nào Quan Trọng Hơn?',
          },
          {
            id: 'debate_p1',
            type: 'paragraph',
            text: 'Đây là một tranh luận lâu đời trong cộng đồng gaming: Cái nào quan trọng hơn - đồ họa đẹp hay lối chơi hấp dẫn? Câu trả lời không đơn giản như bạn nghĩ.',
          },
          {
            id: 'debate_h2',
            type: 'heading',
            level: 3,
            text: 'Quan Điểm 1: Gameplay Là Vua',
          },
          {
            id: 'debate_p2',
            type: 'paragraph',
            text: 'Nhiều game có đồ họa đơn giản nhưng lối chơi tuyệt vời như Tetris, Minecraft, hay Fortnite vẫn trở thành các tượng đài gaming.',
          },
          {
            id: 'debate_h3',
            type: 'heading',
            level: 3,
            text: 'Quan Điểm 2: Graphics Là Quốc Vương',
          },
          {
            id: 'debate_h4',
            type: 'heading',
            level: 3,
            text: 'Kết Luận',
          },
          {
            id: 'debate_p3',
            type: 'paragraph',
            text: 'Thứ cuối, game tuyệt vời cần cả hai: Graphics tốt để tạo sự hấp dẫn, nhưng Gameplay tốt để giữ chân người chơi.',
          },
        ],
      },
      {
        title: 'Video: Top 5 game thế giới mở tốt nhất 2024',
        slug: 'top-5-open-world-games-2024',
        excerpt: 'Video review tổng hợp 5 tựa game thế giới mở hay nhất được phát hành năm 2024.',
        content: `<h2>Top 5 Game Thế Giới Mở Tốt Nhất 2024</h2>
          <p>Năm 2024 không thiếu những tựa game thế giới mở chất lượng cao. Dưới đây là 5 tựa game tuyệt vời mà bạn không nên bỏ lỡ.</p>
          <h3>1. Elden Ring: Shadow of the Erdtree</h3>
          <p>Phần mở rộng của Elden Ring mang đến những area mới tuyệt vời và boss fights khó hơn.</p>
          <h3>2. Dragon's Dogma 2</h3>
          <p>Phần tiếp theo của series Dragon's Dogma nổi tiếng với thế giới mở rộng lớn và gameplay tuyệt vời.</p>
          <h3>3. Palworld</h3>
          <p>Game mới phát hành kết hợp Pokémon-like mechanics với thế giới mở sandbox.</p>
          <h3>4. Final Fantasy VII Rebirth</h3>
          <p>Phần tiếp theo của bộ game Final Fantasy VII Remake đạo diễn lạc dung rất được mong chờ.</p>
          <h3>5. Unicorn Overlord</h3>
          <p>Game chiến thuật với thế giới mở rộng lớn và lối chơi độc đáo.</p>
          <p><em>Video full review có sẵn trên YouTube channel của chúng tôi!</em></p>`,
        author: adminUser._id,
        category: 'Video',
        tags: ['Open World Games', 'Top 5', 'Gaming 2024', 'Reviews', 'Video'],
        featured: true,
        status: 'published',
        featuredImage: {
          url: '/images/tintuc6.png',
          alt: 'Top Open World Games 2024',
        },
        seoTitle: 'Top 5 game thế giới mở 2024 tốt nhất | VOLTRIX',
        seoDescription: 'Video tổng hợp 5 tựa game thế giới mở chất lượng cao nhất năm 2024.',
        seoKeywords: ['Open World Games', 'Top 5', 'Gaming 2024', 'Reviews'],
        readTime: 6,
        blocks: [
          {
            id: 'top5_h1',
            type: 'heading',
            level: 2,
            text: 'Top 5 Game Thế Giới Mở Tốt Nhất 2024',
          },
          {
            id: 'top5_p1',
            type: 'paragraph',
            text: 'Năm 2024 không thiếu những tựa game thế giới mở chất lượng cao. Dưới đây là 5 tựa game tuyệt vời mà bạn không nên bỏ lỡ.',
          },
          {
            id: 'top5_list1',
            type: 'list',
            items: [
              '#1: Game nhận danh của năm với thế giới mở tuyệt vời',
              '#2: Sequel đợi game nhân khiếc với nội dung thêm',
              '#3: Indie masterpiece với đồ họa ấn tượng',
              '#4: Open world với gameplay độc đáo',
              '#5: Game chiến thuật với thế giới mở rộng lớn',
            ],
          },
          {
            id: 'top5_p2',
            type: 'paragraph',
            text: 'Video full review có sẵn trên YouTube channel của chúng tôi!',
          },
        ],
      },
    ])

    console.log(`✓ News seeded: ${newsArticles.length} articles created`)
    return {
      created: newsArticles.length,
      message: `News seeded: ${newsArticles.length} articles created`,
      ids: newsArticles,
    }
  } catch (error: any) {
    console.error('✗ Error seeding news:', error.message)
    throw error
  }
}

// Execute seed when run directly
const runSeedNews = async () => {
  try {
    console.log('═══════════════════════════════════════')
    console.log('  Starting News Seed...')
    console.log('═══════════════════════════════════════\n')
    
    // Connect to MongoDB
    await connectDB()
    console.log('✓ Connected to MongoDB\n')
    
    // Run seeding
    const result = await seedNews()
    console.log('\n═══════════════════════════════════════')
    console.log('  🎉 News Seed Completed!')
    console.log('═══════════════════════════════════════')
    
    // Close database connection
    await mongoose.connection.close()
    process.exit(0)
  } catch (error: any) {
    console.error('\n✗ SEED ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run directly
runSeedNews()
