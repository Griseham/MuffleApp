import { runParameterThreadSmokeTest } from './tests/parameterThreads.test.js';

try {
  const result = runParameterThreadSmokeTest();
  if (result) {
    console.log('✅ Parameter thread smoke test PASSED: All snippets have proper structure');
  }
} catch (error) {
  console.error('❌ Parameter thread smoke test FAILED:', error.message);
  process.exit(1);
}