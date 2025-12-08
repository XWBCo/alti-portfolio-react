/**
 * Clarity AI API Integration Test Script
 * Tests the 20 approved metrics against real securities
 *
 * Run with: npx ts-node scripts/test-clarity-api.ts
 */

// Real API credentials from api_retrieval.py
const KEY = "631ea12c-fed4-4a1c-9368-0413724ceb5f";
const SECRET = "27bc53fb-bfd6-483b-9608-da28152920943c0e0f85-9570-4033-88c5-62dd55732993fa18f232-6501-4506-9a9f-5876c00cff4a";
const BASE_URL = "https://api.clarity.ai/clarity/v1";
const TOKEN_URL = `${BASE_URL}/oauth/token`;

// The 20 approved metrics from api_retrieval.py
const APPROVED_METRICS = {
  climate_temperature: {
    endpoint: `${BASE_URL}/public/securities/climate/temperature-alignment/rawdata/metric-by-id/async`,
    payloadKey: "metricIds",
    metrics: [
      "TEMPERATURE_RATING_SCOPE_1_2",
      "TEMPERATURE_RATING_SCOPE_3"
    ]
  },
  climate_carbon: {
    endpoint: `${BASE_URL}/public/securities/climate/carbon-footprint/metric-by-id/async`,
    payloadKey: "metricIds",
    metrics: [
      "FINANCED_EMISSIONS_INTENSITY_SCOPE_1_2",
      "FINANCED_EMISSIONS_INTENSITY_SCOPE_3",
      "WEIGHTED_AVERAGE_CARBON_INTENSITY_SCOPE_1_2",
      "WEIGHTED_AVERAGE_CARBON_INTENSITY_SCOPE_3"
    ]
  },
  esg_risk: {
    endpoint: `${BASE_URL}/public/securities/esg-risk/scores-by-id/async`,
    payloadKey: "scoreIds",
    metrics: [
      "ENVIRONMENTAL",
      "SOCIAL",
      "GOVERNANCE",
      "ANALYTICNONEXECBOARD",
      "ANALYTICBOARDFEMALE",
      "ANALYTICINDEPBOARD",
      "GENDER_PAY_GAP_PERCENTAGE",
      "NET_ZERO_EMISSIONS_TARGET",
      "LAND_USE_AND_BIODIVERSITY",
      "WATER_RECYCLED_RATIO",
      "BIODIVERSITY_IMPACT_REDUCTION",
      "ANALYTICWASTERECYCLINGRATIO",
      "BRIBERY_AND_CORRUPTION",
      "TARGETS_DIVERSITY_OPPORTUNITY"
    ]
  }
};

// Test securities (ISINs)
const TEST_SECURITIES = [
  { isin: "US0378331005", name: "Apple Inc." },
  { isin: "US5949181045", name: "Microsoft Corp." },
  { isin: "US0231351067", name: "Amazon.com Inc." },
  { isin: "US02079K3059", name: "Alphabet Inc." },
  { isin: "US88160R1014", name: "Tesla Inc." },
];

interface TestResult {
  category: string;
  security: string;
  isin: string;
  success: boolean;
  message: string;
  data?: any;
  duration?: number;
}

async function getToken(): Promise<string> {
  console.log("🔑 Authenticating with Clarity AI...");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ key: KEY, secret: SECRET })
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("No token received");
  }

  console.log("✅ Authentication successful\n");
  return data.token;
}

async function submitAsyncJob(
  token: string,
  endpoint: string,
  securityIds: string[],
  payloadKey: string,
  metrics: string[]
): Promise<string> {
  const payload = {
    securityIds,
    [payloadKey]: metrics
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Job submission failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.uuid) {
    throw new Error("No job UUID received");
  }

  return data.uuid;
}

async function pollJobStatus(token: string, uuid: string, maxAttempts = 6): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second intervals

    try {
      const response = await fetch(`${BASE_URL}/public/job/${uuid}/status`, {
        headers: { "Authorization": `Bearer ${token}` },
        redirect: 'manual'  // Don't auto-follow redirects
      });

      // Read body regardless of status code (302 can have body with status)
      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      const status = data.statusMessage || data.status;
      console.log(`  Attempt ${attempt}/${maxAttempts}: ${status || `HTTP ${response.status}`}`);

      if (status === "SUCCESS" || status === "COMPLETED") {
        return "SUCCESS";
      } else if (status === "FAILED" || status === "ERROR") {
        throw new Error(`Job failed: ${status}`);
      }
    } catch (err: any) {
      if (err.message?.includes("Job failed")) throw err;
      console.log(`  Attempt ${attempt}/${maxAttempts}: Error - ${err.message}`);
    }
  }

  throw new Error("Job timeout");
}

async function downloadJobResult(token: string, uuid: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/public/job/${uuid}/download`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  // The response is CSV, parse it
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    results.push(row);
  }

  return results;
}

async function testCategory(
  token: string,
  categoryName: string,
  config: { endpoint: string; payloadKey: string; metrics: string[] },
  securities: { isin: string; name: string }[]
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const isins = securities.map(s => s.isin);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${categoryName}`);
  console.log(`Metrics: ${config.metrics.join(', ')}`);
  console.log(`Securities: ${securities.map(s => s.name).join(', ')}`);
  console.log(`${'='.repeat(60)}`);

  const startTime = Date.now();

  try {
    // Submit job
    console.log("\n📤 Submitting async job...");
    const uuid = await submitAsyncJob(token, config.endpoint, isins, config.payloadKey, config.metrics);
    console.log(`  Job UUID: ${uuid}`);

    // Poll for completion
    console.log("\n⏳ Polling for completion...");
    await pollJobStatus(token, uuid);

    // Download results
    console.log("\n📥 Downloading results...");
    const data = await downloadJobResult(token, uuid);

    const duration = Date.now() - startTime;
    console.log(`\n✅ ${categoryName} completed in ${(duration/1000).toFixed(1)}s`);
    console.log(`  Rows returned: ${data.length}`);

    // Show sample data
    if (data.length > 0) {
      console.log("\n📊 Sample data (first row):");
      const firstRow = data[0];
      Object.entries(firstRow).slice(0, 10).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    }

    for (const security of securities) {
      const securityData = data.find((row: any) =>
        row.isin === security.isin || row.ISIN === security.isin
      );

      results.push({
        category: categoryName,
        security: security.name,
        isin: security.isin,
        success: true,
        message: securityData ? "Data retrieved" : "No data for this security",
        data: securityData,
        duration
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ ${categoryName} failed: ${error}`);

    for (const security of securities) {
      results.push({
        category: categoryName,
        security: security.name,
        isin: security.isin,
        success: false,
        message: `${error}`,
        duration
      });
    }
  }

  return results;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     Clarity AI API Integration Test - 20 Approved Metrics    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  console.log("Test Securities:");
  TEST_SECURITIES.forEach(s => console.log(`  • ${s.name} (${s.isin})`));

  console.log("\nApproved Metrics (20 total):");
  console.log("  Climate Temperature: 2 metrics");
  console.log("  Climate Carbon: 4 metrics");
  console.log("  ESG Risk: 14 metrics");
  console.log("");

  let token: string;
  try {
    token = await getToken();
  } catch (error) {
    console.error("❌ Failed to authenticate:", error);
    process.exit(1);
  }

  const allResults: TestResult[] = [];

  // Test each category
  for (const [categoryKey, config] of Object.entries(APPROVED_METRICS)) {
    const categoryName = categoryKey.replace(/_/g, ' ').toUpperCase();
    const results = await testCategory(token, categoryName, config, TEST_SECURITIES);
    allResults.push(...results);
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("TEST SUMMARY");
  console.log("═".repeat(60));

  const successCount = allResults.filter(r => r.success).length;
  const failCount = allResults.filter(r => !r.success).length;

  console.log(`Total Tests: ${allResults.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((successCount / allResults.length) * 100).toFixed(1)}%`);

  // Details by category
  console.log("\nBy Category:");
  const categories = [...new Set(allResults.map(r => r.category))];
  for (const cat of categories) {
    const catResults = allResults.filter(r => r.category === cat);
    const catSuccess = catResults.filter(r => r.success).length;
    console.log(`  ${cat}: ${catSuccess}/${catResults.length} passed`);
  }

  console.log("\n" + "═".repeat(60));

  // Return exit code
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(console.error);
