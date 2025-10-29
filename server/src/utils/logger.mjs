// utils/logger.mjs
import chalk from 'chalk';

export function logError(context, err) {
  const time = new Date().toISOString();
  console.error(chalk.red.bold(`\n[${time}] ❌ ERROR in ${context}`));

  if (err.name === 'ZodError') {
    console.error(chalk.yellow('Validation failed (ZOD):'));

    // Dùng cả 3 dạng có thể của ZodError
    const issues = err.errors || err.issues || [];
    if (issues.length > 0) {
      issues.forEach((e) => {
        const path = Array.isArray(e.path) ? e.path.join('.') : e.path || '(unknown)';
        console.error(`  • ${path}: ${e.message}`);
      });
    } else if (typeof err.flatten === 'function') {
      const flat = err.flatten();
      if (flat.fieldErrors) {
        for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
          console.error(`  • ${field}: ${msgs.join(', ')}`);
        }
      } else {
        console.error('  • No field errors available in flatten()');
      }
    } else {
      console.error('  • No detailed issues found in ZodError object');
    }
    return;
  }
}
