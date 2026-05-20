import axios from "axios";

// ============================================
// TEST RACE CONDITION - 100 REQUEST ĐỒNG THỜI
// ============================================
//
// Flow:
// 1. Gửi 100 request đặt hàng cùng lúc
// 2. Tất cả cùng mua 1 sản phẩm (stock = 1)
// 3. Kỳ vọng: 1 thành công, 99 thất bại

const config = {
    BASE_URL: 'http://localhost:5000/api',
    PRODUCT_ID: '69aaf946e2d270e6aa017d89',
    VARIANT_SKU: '21672',
    ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWIzYmViOWVjZWY3YWY0OGM3Y2U1MWQiLCJlbWFpbCI6InRhaXRyYW5ibXQxMTFAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzc4ODY1NzY3LCJleHAiOjE3Nzg4NjkzNjd9.rvvVwL5NJW4X1rtc-BWsVzmDH_1rWsD259AO4E1fYh4',
    NUM_REQUESTS: 200,
};

let stats = {
    success: 0,
    failed: 0,
    responses: [],
    errors: [],
};

/**
 * Tạo 1 request đặt hàng
 */
async function createOrder(requestNumber) {
    try {
        const payload = {
            orderItems: [
                {
                    product: config.PRODUCT_ID,
                    variantSku: config.VARIANT_SKU,
                    quantity: 1,
                    priceAtPurchase: 15675000,
                    price: 15675000,
                    name: "PlayStation 5",
                    image: "ps5.jpg",
                }
            ],
            totalPrice: 15675000,
            discountAmount: 0,
            shippingFee: 30000,
            finalPrice: 15705000,
            paymentMethod: "COD",
            shippingAddress: {
                name: "Test User",
                address: "123 Test St",
                city: "HCMC",
                phone: "0901234561",
                district: "D1",
                ward: "W1",
                email: "test@example.com"
            }
        };

        const response = await axios.post(`${config.BASE_URL}/orders`, payload, {
            headers: {
                Authorization: `Bearer ${config.ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            timeout: 20000,
        });

        return {
            requestNumber,
            status: "SUCCESS",
            orderCode: response.data.data?.orderCode,
        };
    } catch (error) {
        return {
            requestNumber,
            status: "FAILED",
            message: error.response?.data?.message || error.message,
        };
    }
}

/**
 * Chạy test
 */
async function runConcurrentTest() {
    // Reset stats mỗi lần chạy
    stats = { success: 0, failed: 0, responses: [], errors: [] };

    console.log("🚀 BẮT ĐẦU TEST RACE CONDITION\n");

    console.log("📊 Cấu hình test:");
    console.log(`   - Số request: ${config.NUM_REQUESTS}`);
    console.log(`   - Product ID: ${config.PRODUCT_ID}`);
    console.log(`   - Variant SKU: ${config.VARIANT_SKU}`);
    console.log("   - Kỳ vọng: 1 thành công, còn lại thất bại\n");

    console.log("-----------------------------------\n");

    const startTime = Date.now();

    console.log("📤 Đang gửi request đồng thời...\n");

    const requests = Array.from(
        { length: config.NUM_REQUESTS },
        (_, i) => createOrder(i + 1)
    );

    const results = await Promise.all(requests);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Xử lý kết quả
    results.forEach(result => {
        if (result.status === "SUCCESS") {
            stats.success++;
            stats.responses.push(result);
            console.log(`✅ Request ${result.requestNumber}: Thành công - ${result.orderCode}`);
        } else {
            stats.failed++;
            stats.errors.push(result);
        }
    });

    console.log(`\n❌ Request thất bại (hiển thị 5/${stats.failed}):`);
    stats.errors.slice(0, 5).forEach(err => {
        console.log(`   Request ${err.requestNumber}: ${err.message}`);
    });

    console.log("\n-----------------------------------");
    console.log("📈 KẾT QUẢ TEST");
    console.log("-----------------------------------");
    console.log(`⏱️  Thời gian: ${duration}s`);
    console.log(`✅ Thành công: ${stats.success}/${config.NUM_REQUESTS}`);
    console.log(`❌ Thất bại: ${stats.failed}/${config.NUM_REQUESTS}`);
    console.log(`📊 Tỷ lệ thành công: ${((stats.success / config.NUM_REQUESTS) * 100).toFixed(2)}%`);

    console.log("\n🔍 PHÂN TÍCH:");

    if (stats.success === 1) {
        console.log("🎉 HOÀN HẢO!");
        console.log("→ Chỉ có 1 request thành công");
        console.log("→ Hệ thống KHÔNG bị race condition");
        console.log("→ Xử lý tồn kho an toàn 👍");
    } else if (stats.success === 0) {
        console.log("⚠️ TẤT CẢ request đều thất bại");
        console.log("→ Kiểm tra lại:");
        console.log("   + Sản phẩm còn hàng không?");
        console.log("   + Server có chạy không?");
        console.log("   + Token còn hạn không?");
    } else {
        console.log(`🚨 NGUY HIỂM! Có ${stats.success} request thành công`);
        console.log("→ Bị race condition!");
        console.log("→ Nhiều request cùng trừ stock");
        console.log("→ Cần fix logic backend");
    }

    if (stats.responses.length > 0) {
        console.log("\n✅ Đơn hàng thành công:");
        stats.responses.forEach(resp => {
            console.log(`   - ${resp.orderCode} (Request #${resp.requestNumber})`);
        });
    }

    console.log("\n-----------------------------------\n");
}

/**
 * Kiểm tra config
 */
function validateConfig() {
    if (!config.ACCESS_TOKEN || config.ACCESS_TOKEN === "YOUR_TOKEN_HERE") {
        console.error("❌ Thiếu ACCESS_TOKEN!");
        process.exit(1);
    }

    if (!config.PRODUCT_ID) {
        console.error("❌ Thiếu PRODUCT_ID!");
        process.exit(1);
    }
}

/**
 * Main
 */
async function main() {
    validateConfig();

    try {
        await runConcurrentTest();
    } catch (error) {
        console.error("❌ Lỗi khi chạy test:", error.message);

        if (error.message.includes("401")) {
            console.error("⚠️ Token hết hạn, cần login lại!");
        }

        process.exit(1);
    }
}

main();
