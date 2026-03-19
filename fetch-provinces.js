// Script để fetch dữ liệu tỉnh/quận/phường từ API và lưu vào file

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchProvinces() {
  try {
    console.log('Đang fetch danh sách tỉnh...');
    // Fetch danh sách tỉnh (không có districts)
    const response = await fetch('https://provinces.open-api.vn/api/v1/p/');
    const provinces = await response.json();
    
    console.log(`✅ Lấy được ${provinces.length} tỉnh`);
    console.log('🔄 Đang fetch districts cho từng tỉnh...');
    
    // Fetch districts và wards cho từng province
    const provinceData = [];
    for (let i = 0; i < provinces.length; i++) {
      const province = provinces[i];
      try {
        // Fetch province với depth=3 để có districts và wards
        const detailResponse = await fetch(`https://provinces.open-api.vn/api/v1/p/${province.code}?depth=3`);
        const detailData = await detailResponse.json();
        provinceData.push(detailData);
        
        if ((i + 1) % 10 === 0) {
          console.log(`  ✓ Đã fetch ${i + 1}/${provinces.length} tỉnh`);
        }
      } catch (error) {
        console.error(`  ✗ Lỗi fetch tỉnh ${province.name}:`, error.message);
      }
    }
    
    // Lưu vào file
    const filePath = path.join(__dirname, 'client/public/data/provinces.json');
    fs.writeFileSync(filePath, JSON.stringify(provinceData, null, 2), 'utf-8');
    
    console.log(`\n✅ Đã fetch thành công! Lưu ${provinceData.length} tỉnh vào ${filePath}`);
    
    // In thống kê
    let totalDistricts = 0;
    let totalWards = 0;
    for (const prov of provinceData) {
      totalDistricts += prov.districts?.length || 0;
      for (const dist of prov.districts || []) {
        totalWards += dist.wards?.length || 0;
      }
    }
    
    console.log('\n📊 Thống kê:');
    console.log(`  - Tỉnh/Thành phố: ${provinceData.length}`);
    console.log(`  - Quận/Huyện: ${totalDistricts}`);
    console.log(`  - Phường/Xã: ${totalWards}`);
    
    console.log('\n📍 Dữ liệu mẫu (Hà Nội):');
    const hanoi = provinceData.find(p => p.code === 1);
    if (hanoi) {
      console.log(`  Tỉnh: ${hanoi.name}`);
      console.log(`  Quận: ${hanoi.districts[0]?.name}`);
      console.log(`  Phường: ${hanoi.districts[0]?.wards[0]?.name}`);
    }
  } catch (error) {
    console.error('❌ Lỗi fetch dữ liệu:', error.message);
    process.exit(1);
  }
}

fetchProvinces();
