import { globalProtocol } from '../src/core/protocol/controller';

async function main() {
  const args = process.argv.slice(2);
  const skipPush = args.includes('--skip-push') || args.includes('--dry-run');

  await globalProtocol.run({ skipPush });
}

main().catch(err => {
  console.error('Protocol engine failed:', err);
  process.exit(1);
});
