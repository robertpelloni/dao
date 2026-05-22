import { chromium } from 'playwright';
import fs from 'fs';
import { execSync } from 'child_process';

async function run() {
  console.log('Starting verification server...');
  // Kill any existing processes on 3000 and 5173
  try { execSync('fuser -k 3000/tcp || true'); } catch(e) {}
  try { execSync('fuser -k 5173/tcp || true'); } catch(e) {}

  // Ensure database is populated
  execSync('npx ts-node populate_delegations.ts');

  // Start backend
  const backend = execSync('npx ts-node src/api/server.ts > backend.log 2>&1 &');

  // Start frontend
  const frontend = execSync('cd frontend && npm run dev > frontend.log 2>&1 &');

  console.log('Waiting for servers to be ready...');
  await new Promise(r => setTimeout(r, 15000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });

  console.log('Navigating to Identity tab...');
  await page.goto('http://localhost:5173');

  // Click on "My Identity" sidebar button
  await page.click('text=My Identity');

  // Wait for the graph to render and stabilize
  console.log('Waiting for graph to stabilize...');
  await page.waitForSelector('.force-graph-container');
  await new Promise(r => setTimeout(r, 10000));

  await page.screenshot({ path: 'verification/delegation_graph_v3.png', fullPage: true });
  console.log('Screenshot saved to verification/delegation_graph_v3.png');

  await browser.close();

  // Cleanup
  try { execSync('fuser -k 3000/tcp || true'); } catch(e) {}
  try { execSync('fuser -k 5173/tcp || true'); } catch(e) {}
}

run().catch(console.error);
