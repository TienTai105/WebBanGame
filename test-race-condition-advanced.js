const axios = require('axios');

// ============================================
// ADVANCED RACE CONDITION TEST
// Multiple Users - 100 Concurrent Orders
// ============================================

const config = {
  BASE_URL: 'http://localhost:5000/api',
  PRODUCT_ID: '', // ← Thay bằng product ID có đúng 1 cái
  NUM_REQUESTS: 100,
  // Danh sách users (test từ nhiều user khác nhau)
  USERS: [
    {
      USER_ID: '', // ← User 1 ID
      ACCESS_TOKEN: '', // ← User 1 Token
      NAME: 'User 1',
    },
    {
      USER_ID: '', // ← User 2 ID
      ACCESS_TOKEN: '', // ← User 2 Token
      NAME: 'User 2',
    },
    // Thêm more users nếu cần
  ],
};

// Stats tracking
let stats = {
  success: 0,
  failed: 0,
  byUser: {},
  responses: [],
  errors: [],
};

/**
 * Tạo một request đặt hàng từ một user cụ thể
 */
async function createOrderForUser(requestNumber, user) {
  try {
    const payload = {
      orderItems: [
        {
          product: config.PRODUCT_ID,
          variantSku: null,
          quantity: 1,
          name: 'Test Product',
          image: 'test.jpg',
          priceAtPurchase: 100000,
          price: 100000,
        }
      ],
      totalPrice: 100000,
      discountAmount: 0,
      shippingFee: 30000,
      finalPrice: 130000,
      paymentMethod: 'COD',
      shippingAddress: {
        name: `${user.NAME} Address`,
        address: '123 Test St',
        city: 'Test City',
        phone: '0123456789',
        ward: 'Test Ward',
        district: 'Test District',
        email: `test.${user.USER_ID}@example.com`,
      }
    };

    const response = await axios.post(`${config.BASE_URL}/orders`, payload, {
      headers: {
        'Authorization': `Bearer ${user.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const userKey = user.NAME;
    if (!stats.byUser[userKey]) {
      stats.byUser[userKey] = { success: 0, failed: 0 };
    }
    stats.byUser[userKey].success++;

    return {
      requestNumber,
      user: user.NAME,
      status: 'SUCCESS',
      orderId: response.data.data?._id,
      orderCode: response.data.data?.orderCode,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const userKey = user.NAME;
    if (!stats.byUser[userKey]) {
      stats.byUser[userKey] = { success: 0, failed: 0 };
    }
    stats.byUser[userKey].failed++;

    return {
      requestNumber,
      user: user.NAME,
      status: 'FAILED',
      message: error.response?.data?.message || error.message,
      statusCode: error.response?.status,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gửi N requests từ multiple users đồng thời
 */
async function runAdvancedTest() {
  console.log('🚀 STARTING ADVANCED RACE CONDITION TEST');
  console.log(`📊 Sending ${config.NUM_REQUESTS} concurrent requests`);
  console.log(`👥 From ${config.USERS.length} different user(s)`);
  console.log(`📦 Product ID: ${config.PRODUCT_ID}`);
  console.log('-----------------------------------\n');

  const startTime = Date.now();

  // Distribute requests among users
  const requestsPerUser = Math.floor(config.NUM_REQUESTS / config.USERS.length);
  const remainder = config.NUM_REQUESTS % config.USERS.length;

  let requestNumber = 1;
  const requests = [];

  config.USERS.forEach((user, userIndex) => {
    const count = requestsPerUser + (userIndex < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      requests.push(createOrderForUser(requestNumber++, user));
    }
  });

  // Shuffle requests để thực sự random (mixing users)
  requests.sort(() => Math.random() - 0.5);

  const results = await Promise.all(requests);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Xử lý kết quả
  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      stats.success++;
      stats.responses.push(result);
      console.log(`✅ [${result.user}] Request ${result.requestNumber}: SUCCESS - ${result.orderCode}`);
    } else {
      stats.failed++;
      stats.errors.push(result);
      console.log(`❌ [${result.user}] Request ${result.requestNumber}: FAILED - ${result.message}`);
    }
  });

  // === REPORT ===
  console.log('\n' + '='.repeat(50));
  console.log('📈 ADVANCED RACE CONDITION TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log(`✅ Success: ${stats.success}/${config.NUM_REQUESTS}`);
  console.log(`❌ Failed: ${stats.failed}/${config.NUM_REQUESTS}`);
  console.log(`📊 Success Rate: ${((stats.success / config.NUM_REQUESTS) * 100).toFixed(2)}%`);

  // Per-user stats
  console.log('\n📊 By User:');
  Object.entries(stats.byUser).forEach(([user, data]) => {
    console.log(`  ${user}: ✅ ${data.success} | ❌ ${data.failed}`);
  });

  // === ANALYSIS ===
  console.log('\n' + '='.repeat(50));
  console.log('🔍 RACE CONDITION ANALYSIS:');
  console.log('='.repeat(50));

  if (stats.success === 1) {
    console.log('✅ EXCELLENT! Only 1 order succeeded globally.');
    console.log('   → System is RACE-CONDITION FREE! 🎉');
  } else if (stats.success === 0) {
    console.log('⚠️  All requests failed - Check stock/connectivity');
  } else if (stats.success > 1) {
    console.log(`⚠️  WARNING! ${stats.success} orders succeeded (should be 1)`);
    console.log(`   → POTENTIAL RACE CONDITION DETECTED! 🚨`);
    console.log(`   → Expected: 1 order | Got: ${stats.success} orders`);
    console.log(`   → Duplicate orders: ${stats.success - 1}`);
  }

  // Successful orders
  if (stats.responses.length > 0) {
    console.log('\n✅ Successful Orders:');
    stats.responses.forEach(resp => {
      console.log(`  [${resp.user}] ${resp.orderCode} (ID: ${resp.orderId.substring(0, 8)}...)`);
    });
  }

  // Failed orders (first 5)
  if (stats.errors.length > 0) {
    console.log('\n❌ Sample Failed Requests:');
    stats.errors.slice(0, 5).forEach(err => {
      console.log(`  [${err.user}] Request ${err.requestNumber}: [${err.statusCode}] ${err.message}`);
    });
    if (stats.errors.length > 5) {
      console.log(`  ... and ${stats.errors.length - 5} more failed requests`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✓ Test completed!\n');

  return {
    success: stats.success,
    failed: stats.failed,
    totalRequests: config.NUM_REQUESTS,
    duration,
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  // Validate
  if (!config.PRODUCT_ID || config.USERS.length === 0) {
    console.error('❌ ERROR: Missing configuration!');
    console.error('Please set:');
    console.error('  - PRODUCT_ID: ID of product with exactly 1 stock');
    console.error('  - USERS: Array of user objects with ACCESS_TOKEN and USER_ID');
    process.exit(1);
  }

  // Validate users
  config.USERS.forEach((user, idx) => {
    if (!user.ACCESS_TOKEN || !user.USER_ID) {
      console.error(`❌ User ${idx} missing ACCESS_TOKEN or USER_ID`);
      process.exit(1);
    }
  });

  try {
    await runAdvancedTest();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
