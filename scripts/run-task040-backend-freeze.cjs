const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let exitCode = 0;

function run(cmd, label) {
  try {
    console.log(`\n--- ${label} ---`);
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', timeout: 300000, shell: true });
    console.log(`${label}: PASS`);
    return true;
  } catch (e) {
    console.error(`${label}: FAIL`);
    exitCode = 1;
    return false;
  }
}

console.log('=== Task 040 Backend Freeze Runner ===');
console.log(`Started at: ${new Date().toISOString()}\n`);

run('npx tsc -p backend/tsconfig.json --noEmit --incremental false', 'TypeScript check');
run('npm --prefix backend run build', 'Backend build');

run('npx prisma validate --schema=backend/prisma/schema.prisma 2>&1', 'Prisma validate');
run('npx prisma generate --schema=backend/prisma/schema.prisma 2>&1', 'Prisma generate');

console.log('\n--- Generating reports ---');
try {
  require('./gen-task040-report.cjs');
  console.log('Report generation: PASS');
} catch (e) {
  console.error(`Report generation: FAIL - ${e.message}`);
  exitCode = 1;
}

console.log('\n--- Validating JSON report ---');
try {
  require('./task040-json-validate.cjs');
} catch (e) {
  console.error(`JSON validation script error: ${e.message}`);
  exitCode = 1;
}

console.log('\n--- Privacy scan ---');
try {
  require('./task040-privacy-scan.cjs');
} catch (e) {
  console.error(`Privacy scan script error: ${e.message}`);
  exitCode = 1;
}

if (exitCode === 0) {
  console.log('\n=== Task 040 Backend Freeze: ALL GATES PASSED ===');
} else {
  console.error('\n=== Task 040 Backend Freeze: SOME GATES FAILED ===');
}

process.exit(exitCode);
