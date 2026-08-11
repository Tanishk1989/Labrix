import { requireDisposableTestDatabase } from "../../scripts/verification-safety";

requireDisposableTestDatabase({
  allowMutation: process.env.LABRIX_ALLOW_TEST_DATABASE_MUTATION,
  testDatabaseUrl: process.env.LABRIX_TEST_DATABASE_URL,
  activeDatabaseUrl: process.env.DATABASE_URL,
});
