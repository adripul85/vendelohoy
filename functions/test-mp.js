const { MercadoPagoConfig, Preference } = require("mercadopago");

// 🛡️ Sentinel: Security Enhancement - No hardcoded secrets
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});

async function testPayment() {
  console.log("🚀 Testing Mercado Pago Connection directly...");

  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "test-123456",
            title: "Test Product",
            quantity: 1,
            unit_price: 1500, // Fixed Integer Number
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: "https://www.google.com/success",
          failure: "https://www.google.com/failure",
          pending: "https://www.google.com/pending",
        },
        auto_return: "approved",
        external_reference: "test-transaction-id",
      },
    });

    console.log("✅ SUCCESS! Preference ID:", result.id);
    console.log(
      "🔗 Init Point:",
      result.init_point || result.sandbox_init_point,
    );
  } catch (error) {
    console.error("❌ FAILED!");
    if (error.cause) {
      console.error("Cause:", JSON.stringify(error.cause, null, 2));
    } else {
      console.error("Error:", error);
    }
  }
}

testPayment();
