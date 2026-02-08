# 🚀 Kimyasal Takip Sistemi - Deployment Rehberi

> **Müşteri Kurulum Kılavuzu** - Sistemi başka bir sunucuya/müşteriye kurma adımları

---

## 📋 Ön Gereksinimler

### Gerekli Hesaplar
- ✅ **Supabase** hesabı (Ücretsiz tier yeterli)
- ✅ **Vercel** hesabı (Frontend deployment için)
- ✅ **Resend** hesabı (Email sistemi için - 100 email/gün ücretsiz)
- ⚙️ **Gmail** hesabı (Opsiyonel - Otomatik fatura import için)

### Gerekli Araçlar
```bash
# Node.js ve npm (v18.17+)
node --version

# Git
git --version

# Supabase CLI
npm install -g supabase

# Vercel CLI (Opsiyonel)
npm install -g vercel
```

---

## 🗄️ Adım 1: Supabase Kurulumu

### 1.1 Yeni Supabase Projesi Oluştur

1. [https://supabase.com](https://supabase.com) adresine git
2. "New Project" butonuna tıkla
3. Proje bilgilerini gir:
   - **Name**: `kimyasal-takip-prod`
   - **Database Password**: Güçlü bir şifre oluştur (kaydet!)
   - **Region**: `Europe West (eu-west-1)` seç
4. "Create new project" tıkla (2-3 dakika sürer)

### 1.2 API Keys'leri Kopyala

Project Settings > API sayfasından şunları kopyala:
- ✅ `Project URL` (örn: https://abcdefgh.supabase.co)
- ✅ `anon/public key`
- ✅ `service_role key` (gizli tut!)

### 1.3 Database Migration Çalıştır

```bash
# Proje klasörüne git
cd "KİMYASAL TAKİP"

# Supabase projesine bağlan
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Tüm migration dosyalarını çalıştır (sırayla)
supabase db push

# Alternatif: Manuel SQL çalıştırma
# Supabase Dashboard > SQL Editor'dan her migration dosyasını sırayla çalıştır:
# 1. supabase/migrations/20260130000001_tables.sql
# 2. supabase/migrations/20260130000002_triggers.sql
# 3. supabase/migrations/20260130000003_seed.sql
# 4. supabase/migrations/20260130000004_add_signature_id.sql
# 5. supabase/migrations/20260130000005_seed_settings.sql
# 6. supabase/migrations/20260130000006_email_settings.sql
# 7. supabase/migrations/20260130000007_stock_management.sql
# 8. supabase/migrations/20260207000001_add_missing_recipe_columns.sql
```

### 1.4 Row Level Security (RLS) Kontrol

Supabase Dashboard > Authentication > Policies sayfasında:
- ✅ `users` tablosu için policies aktif mi?
- ✅ `recipes`, `materials`, `stock` tabloları için RLS aktif mi?

---

## 📧 Adım 2: Email Sistemi (Resend) Kurulumu

### 2.1 Resend Hesabı Oluştur

1. [https://resend.com](https://resend.com) adresine git
2. "Sign Up" ile ücretsiz hesap oluştur
3. Email adresini doğrula

### 2.2 API Key Al

1. Dashboard > API Keys sayfasına git
2. "Create API Key" tıkla
3. API key'i kopyala (tekrar gösterilmeyecek!)
4. Güvenli bir yerde sakla

### 2.3 Domain Doğrulama (Opsiyonel - Production için)

1. Dashboard > Domains > "Add Domain" tıkla
2. Domain adını gir (örn: `ratekstekstil.com`)
3. DNS kayıtlarını domain provider'ına ekle
4. Doğrulama tamamlanana kadar bekle

---

## 🌐 Adım 3: Frontend Deployment (Vercel)

### 3.1 GitHub Repository Oluştur

```bash
# Git repository oluştur (eğer yoksa)
git init
git add .
git commit -m "Initial commit - Kimyasal Takip Sistemi"

# GitHub'a push et
git remote add origin https://github.com/YOUR_USERNAME/kimyasal-takip.git
git branch -M main
git push -u origin main
```

### 3.2 Vercel'e Deploy

#### Otomatik Deployment:
1. [https://vercel.com](https://vercel.com) adresine git
2. "Import Project" > GitHub repository'yi seç
3. **Root Directory**: `frontend` olarak ayarla
4. **Framework Preset**: Next.js (otomatik algılar)
5. **Environment Variables** ekle (.env.local.example'dan kopyala):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxxxxxxxxxx
GMAIL_ENABLED=false
```

6. "Deploy" tıkla (3-5 dakika)

#### Manuel Deployment:
```bash
cd frontend

# Vercel CLI ile deploy
vercel

# Production deployment
vercel --prod
```

---

## ⚙️ Adım 4: Sistem Ayarları

### 4.1 İlk Kullanıcı Oluştur

1. Vercel deployment URL'ine git (örn: `https://kimyasal-takip.vercel.app`)
2. `/login` sayfasından "Sign Up" tıkla
3. İlk kullanıcıyı oluştur (otomatik olarak `admin` rolü alır)

### 4.2 Admin Panelinden Email Ayarları

1. Dashboard > Settings sayfasına git
2. Email ayarlarını güncelle:
   - **Resend API Key**: API key'inizi girin
   - **From Email**: `noreply@yourdomain.com`
   - **Report Recipients**: `muhasebe@yourdomain.com, yonetim@yourdomain.com`
3. "Save Settings" tıkla
4. "Test Email" butonu ile test edin

---

## 🔧 Adım 5: Opsiyonel Özellikler

### 5.1 Gmail IMAP (Otomatik Fatura Import)

**Not**: Başlangıçta devre dışı. İhtiyaç halinde aktif edin.

1. Gmail hesabınızda "App Password" oluştur:
   - Google Account > Security > 2-Step Verification
   - App Passwords > Select App: "Mail"
   - 16 haneli şifreyi kopyala

2. Vercel environment variables güncelle:
```bash
GMAIL_ENABLED=true
GMAIL_IMAP_USER=your-email@gmail.com
GMAIL_IMAP_PASSWORD=your-16-digit-app-password
```

3. Vercel'de redeploy et

### 5.2 OCR (PDF/JPEG Fatura Import)

**Tesseract OCR** kurulumu:

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-tur python3-pip

# Python dependencies
pip3 install pytesseract pdf2image Pillow

# read-pdf-ocr.py scriptini sunucuya kopyala
```

### 5.3 AI Uzman Danışman (Gemini API)

1. [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) adresine git
2. "Create API Key" tıkla
3. Vercel environment variables ekle:
```bash
GEMINI_API_KEY=your-gemini-api-key
```

---

## ✅ Adım 6: Doğrulama ve Test

### 6.1 Database Kontrolü

Supabase Dashboard > Table Editor:
- ✅ `users` tablosunda ilk kullanıcı var mı?
- ✅ `materials` tablosunda seed data var mı?
- ✅ `settings` tablosunda email ayarları var mı?

### 6.2 Fonksiyon Testleri

1. **Authentication**: Login/Logout çalışıyor mu?
2. **Malzeme Yönetimi**: Yeni malzeme ekleyebiliyor musun?
3. **Reçete Oluşturma**: Reçete oluşturup PDF indirebiliyor musun?
4. **Stok Yönetimi**: Manuel stok hareketi ekleyebiliyor musun?
5. **Email Sistemi**: Test email gönderebiliyor musun?
6. **Fatura Import**: XML fatura yükleyip içe aktarabiliyor musun?

---

## 📊 Adım 7: Production Checklist

Müşteriye teslim öncesi kontrol listesi:

### Güvenlik
- [ ] Supabase RLS policies aktif
- [ ] Service role key güvenli yerde saklanmış
- [ ] Resend API key environment variable'da
- [ ] Database şifresi güvenli

### Performans
- [ ] Vercel deployment başarılı
- [ ] Database indexes oluşturulmuş
- [ ] Image optimization aktif
- [ ] API rate limiting ayarlanmış

### Özellikler
- [ ] Tüm migration dosyaları çalıştırılmış
- [ ] Seed data yüklenmiş
- [ ] Email sistemi test edilmiş
- [ ] PDF generation çalışıyor
- [ ] Barcode generation çalışıyor

### Dokümantasyon
- [ ] README.md güncel
- [ ] API dokümantasyonu hazır
- [ ] Kullanıcı kılavuzu hazır
- [ ] Admin paneli ayarları belgelenmiş

---

## 🔄 Veri Taşıma (Mevcut Sistemden)

Eğer mevcut bir sistemden veri taşıyorsanız:

### 1. Veritabanı Dump
```bash
# Eski Supabase'den veri dışa aktar
pg_dump -h db.OLD_PROJECT.supabase.co \
        -U postgres \
        -d postgres \
        --data-only \
        --inserts \
        -t users -t materials -t recipes -t stock \
        > data_export.sql
```

### 2. Yeni Supabase'e Import
```bash
# Yeni Supabase'e veri aktar
psql -h db.NEW_PROJECT.supabase.co \
     -U postgres \
     -d postgres \
     < data_export.sql
```

### 3. ID Sequence Düzelt
```sql
-- Supabase SQL Editor'da çalıştır
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('materials_id_seq', (SELECT MAX(id) FROM materials));
-- Diğer tablolar için tekrarla
```

---

## 🆘 Sorun Giderme

### Migration Hataları
**Hata**: "relation already exists"
**Çözüm**: Migration zaten çalıştırılmış, bir sonraki migration'a geç

**Hata**: "permission denied"
**Çözüm**: Supabase Dashboard'dan manuel SQL çalıştır

### Vercel Deployment Hataları
**Hata**: "Module not found"
**Çözüm**: `package.json` dependencies kontrol et, `npm install` çalıştır

**Hata**: "Environment variable missing"
**Çözüm**: Vercel > Settings > Environment Variables ekle, redeploy et

### Email Gönderim Hataları
**Hata**: "API key invalid"
**Çözüm**: Resend API key doğru mu kontrol et

**Hata**: "Domain not verified"
**Çözüm**: Resend'de domain doğrulaması tamamlanmamış

---

## 📞 Destek

**Teknik Destek**: support@kimyasaltakip.com
**Dokümantasyon**: [docs.kimyasaltakip.com](https://docs.kimyasaltakip.com)
**GitHub Issues**: [github.com/kimyasal-takip/issues](https://github.com/kimyasal-takip/issues)

---

**Son Güncelleme**: 7 Şubat 2026
**Versiyon**: 1.0.0
**Deployment Süresi**: ~30-45 dakika
