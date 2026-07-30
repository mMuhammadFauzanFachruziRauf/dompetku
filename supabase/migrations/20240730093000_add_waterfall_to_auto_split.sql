-- Menghapus constraint check lama (nama constraint auto-generated biasanya adalah nama_tabel_nama_kolom_check)
ALTER TABLE auto_split_rules DROP CONSTRAINT IF EXISTS auto_split_rules_type_check;

-- Menambahkan constraint check baru yang menyertakan 'waterfall'
ALTER TABLE auto_split_rules ADD CONSTRAINT auto_split_rules_type_check 
CHECK (type IN ('fixed', 'percentage', 'waterfall'));
