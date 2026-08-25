-- Production-history compatibility marker.
--
-- An early production database recorded this migration name before its schema
-- changes were consolidated into the maintained migration chain. The live
-- schema already contains those changes, and fresh databases receive the same
-- schema from the surrounding tracked migrations. Keep this no-op migration so
-- Prisma can validate both histories without replaying destructive DDL.

