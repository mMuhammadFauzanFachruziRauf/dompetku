-- ============================================================
-- DompetKu — Supabase Database Schema
-- Jalankan ini di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Tabel transaksi
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nominal     INTEGER NOT NULL CHECK (nominal > 0),
  kategori    TEXT NOT NULL,
  catatan     TEXT DEFAULT '',
  tanggal     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index untuk query cepat per user & per bulan
CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal   ON transactions(tanggal DESC);

-- 3. Row Level Security — setiap user hanya bisa lihat data sendiri
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT — hanya data milik user sendiri
CREATE POLICY "User can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: INSERT — hanya bisa insert untuk diri sendiri
CREATE POLICY "User can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: DELETE — hanya bisa hapus data sendiri
CREATE POLICY "User can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Tabel profil user (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  monthly_income  INTEGER DEFAULT 2592000,
  monthly_salaries JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "User can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "User can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Trigger: otomatis buat profil saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ✅ Selesai! Cek tabel di: Table Editor → transactions & profiles
