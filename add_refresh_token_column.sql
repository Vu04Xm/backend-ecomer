-- ============================================================
-- MIGRATION: Thêm cột refresh_token vào bảng users
-- Chạy file này 1 lần duy nhất trong phpMyAdmin hoặc MySQL CLI
-- ============================================================

ALTER TABLE `users`
  ADD COLUMN `refresh_token` VARCHAR(512) DEFAULT NULL AFTER `status`;
