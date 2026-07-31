const deploymentUrl = process.argv[2] ?? process.env.DEPLOYMENT_URL;

if (!deploymentUrl) {
  console.error(
    "Usage: node scripts/smoke-production.mjs <https://deployment-url>"
  );
  process.exit(1);
}

const origin = new URL(deploymentUrl).origin;
const routes = ["/", "/proposals", "/about"];
const failures = [];

for (const route of routes) {
  const url = new URL(route, origin);

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "PollChain-CD-Validation/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();

    if (!response.ok) {
      failures.push(`${route}: HTTP ${response.status}`);
      continue;
    }
    if (!body.includes("<title>PollChain")) {
      failures.push(`${route}: PollChain HTML shell was not returned`);
      continue;
    }

    console.log(`${route}: HTTP ${response.status} (${body.length} bytes)`);
  } catch (error) {
    failures.push(
      `${route}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

if (failures.length > 0) {
  console.error("Production validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Production deployment validated at ${origin}.`);
