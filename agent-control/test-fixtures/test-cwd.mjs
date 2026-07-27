import { execSync } from 'node:child_process';
console.log(execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim());
