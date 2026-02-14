# 🚀 Kimyasal Takip Sistemi - Deployment Rehberi

> **Müşteri Kurulum Kılavuzu** - GitHub + Netlify + Supabase ile deployment

---

## 📋 Ön Gereksinimler

### Gerekli Hesaplar
- ✅ **GitHub** hesabı (Ücretsiz)
- ✅ **Supabase** hesabı (Ücretsiz tier yeterli)
- ✅ **Netlify** hesabı (Ücretsiz tier yeterli - 100GB bandwidth/ay)
- ✅ **Resend** hesabı (Email sistemi için - 100 email/gün ücretsiz)
- ⚙️ **Gmail** hesabı (Opsiyonel - Otomatik fatura import için)

### Gerekli Araçlar
```bash
# Node.js ve npm (v20+)
node --version

# Git
git --version

# Supabase CLI
npm install -g supabase

# Netlify CLI (Opsiyonel - otomatik deploy için)
npm install -g netlify-cli
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

## 🐙 Adım 3: GitHub Repository Kurulumu

### 3.1 GitHub'da Repository Oluştur

1. [https://github.com/new](https://github.com/new) adresine git
2. Repository adını gir: `kimyasal-takip`
3. **Private** olarak ayarla (hassas proje verileri için)
4. README, .gitignore ekleme (proje zaten hazır)
5. "Create repository" tıkla

### 3.2 Mevcut Projeyi GitHub'a Push Et

```bash
# Proje klasörüne git
cd "KİMYASAL TAKİP"

# GitHub remote ekle
git remote add origin https://github.com/YOUR_USERNAME/kimyasal-takip.git

# Main branch'e push et
git branch -M main
git push -u origin main
```

### 3.3 GitHub Repository Ayarları

1. **Settings > Branches**: main branch koruması ekle
   - ✅ Require pull request reviews (opsiyonel)
   - ✅ Require status checks (CI pipeline)
2. **Settings > Secrets & Variables > Actions**: (CI için gerekli değil, ama opsiyonel)
   - Sensitive key'ler Netlify dashboard'da tutulur

---

## 🌐 Adım 4: Netlify Deployment

### 4.1 Netlify'a GitHub Bağlantısı

1. [https://app.netlify.com](https://app.netlify.com) adresine git
2. "Add new site" > "Import an existing project" tıkla
3. "GitHub" seç ve repository'yi bul: `kimyasal-takip`
4. Build ayarları:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
5. "Deploy site" tıkla

> **Not**: `netlify.toml` dosyası bu ayarları otomatik yapılandırır.

### 4.2 Environment Variables Ayarla

Netlify Dashboard > Site Settings > Environment Variables:

```
# Zorunlu
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Genel
NEXT_PUBLIC_APP_NAME=Kimyasal Takip Sistemi
NEXT_PUBLIC_COMPANY_NAME=DENİZLİ RATEKS TEKSTİL

# Opsiyonel
GMAIL_ENABLED=false
GMAIL_IMAP_USER=your-email@gmail.com
GMAIL_IMAP_PASSWORD=your-app-password
GEMINI_API_KEY=your-gemini-api-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### 4.3 Redeploy (Environment Variables Sonrası)

Environment variables ekledikten sonra:
1. Netlify Dashboard > Deploys
2. "Trigger deploy" > "Deploy site" tıkla
3. Deploy loglarını kontrol et (3-5 dakika)

### 4.4 Custom Domain (Opsiyonel)

1. Netlify Dashboard > Domain management
2. "Add custom domain" tıkla
3. Domain adını gir: `kimyasaltakip.com`
4. DNS ayarlarını yapılandır:
   - **CNAME**: `www` → `your-site.netlify.app`
   - **A Record**: `@` → Netlify IP (75.2.60.5)
5. HTTPS otomatik olarak aktif olur (Let's Encrypt)

---

## ⚙️ Adım 5: Sistem Ayarları

### 5.1 İlk Kullanıcı Oluştur

1. Netlify deployment URL'ine git (örn: `https://kimyasal-takip.netlify.app`)
2. `/login` sayfasından "Sign Up" tıkla
3. İlk kullanıcıyı oluştur (otomatik olarak `admin` rolü alır)

### 5.2 Admin Panelinden Email Ayarları

1. Dashboard > Settings sayfasına git
2. Email ayarlarını güncelle:
   - **Resend API Key**: API key'inizi girin
   - **From Email**: `noreply@yourdomain.com`
   - **Report Recipients**: `muhasebe@yourdomain.com, yonetim@yourdomain.com`
3. "Save Settings" tıkla
4. "Test Email" butonu ile test edin

---

## 🔧 Adım 6: Opsiyonel Özellikler

### 6.1 Gmail IMAP (Otomatik Fatura Import)

**Not**: Başlangıçta devre dışı. İhtiyaç halinde aktif edin.

1. Gmail hesabınızda "App Password" oluştur:
   - Google Account > Security > 2-Step Verification
   - App Passwords > Select App: "Mail"
   - 16 haneli şifreyi kopyala

2. Netlify environment variables güncelle:
```bash
GMAIL_ENABLED=true
GMAIL_IMAP_USER=your-email@gmail.com
GMAIL_IMAP_PASSWORD=your-16-digit-app-password
```

3. Netlify'da redeploy et

### 6.2 OCR (PDF/JPEG Fatura Import)

**Tesseract OCR** kurulumu:

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-tur python3-pip

# Python dependencies
pip3 install pytesseract pdf2image Pillow

# read-pdf-ocr.py scriptini sunucuya kopyala
```

### 6.3 AI Uzman Danışman (Gemini API)

1. [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) adresine git
2. "Create API Key" tıkla
3. Netlify environment variables ekle:
```bash
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🔄 CI/CD Pipeline

### Otomatik Süreçler

GitHub'a push yaptığınızda otomatik olarak:

1. **GitHub Actions CI** (`.github/workflows/ci.yml`):
   - ✅ ESLint kontrolü
   - ✅ TypeScript tip kontrolü
   - ✅ Next.js build testi
   - ✅ Güvenlik taraması (npm audit)
   - ✅ Gizli anahtar taraması

2. **Netlify Auto Deploy**:
   - ✅ `main` branch'e push → Production deploy
   - ✅ Pull Request → Preview deploy (ayrı URL)
   - ✅ Build failure → Deploy engellenir

### Branch Stratejisi (Önerilen)

```
main (production)     ← Netlify production deploy
  └── develop         ← Netlify preview deploy
       └── feature/*  ← PR ile develop'a merge
```

---

## ✅ Adım 7: Doğrulama ve Test

### 7.1 Database Kontrolü

Supabase Dashboard > Table Editor:
- ✅ `users` tablosunda ilk kullanıcı var mı?
- ✅ `materials` tablosunda seed data var mı?
- ✅ `settings` tablosunda email ayarları var mı?

### 7.2 Fonksiyon Testleri

1. **Authentication**: Login/Logout çalışıyor mu?
2. **Malzeme Yönetimi**: Yeni malzeme ekleyebiliyor musun?
3. **Reçete Oluşturma**: Reçete oluşturup PDF indirebiliyor musun?
4. **Stok Yönetimi**: Manuel stok hareketi ekleyebiliyor musun?
5. **Email Sistemi**: Test email gönderebiliyor musun?
6. **Fatura Import**: XML fatura yükleyip içe aktarabiliyor musun?

### 7.3 Netlify Deployment Doğrulama

- [ ] Site URL çalışıyor
- [ ] Login sayfası yükleniyor
- [ ] API route'lar çalışıyor (Server Actions)
- [ ] Environment variables doğru yüklenmiş
- [ ] HTTPS aktif

---

## 📊 Adım 8: Production Checklist

Müşteriye teslim öncesi kontrol listesi:

### Güvenlik
- [ ] Supabase RLS policies aktif
- [ ] Service role key Netlify env var'da saklanmış
- [ ] Resend API key environment variable'da
- [ ] Database şifresi güvenli
- [ ] GitHub repo Private olarak ayarlanmış
- [ ] .env dosyaları .gitignore'da

### Performans
- [ ] Netlify deployment başarılı
- [ ] Database indexes oluşturulmuş
- [ ] Image optimization aktif
- [ ] Security headers aktif (netlify.toml)

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

### Netlify Deployment Hataları
**Hata**: "Build failed - Module not found"
**Çözüm**: `package.json` dependencies kontrol et, `npm install` çalıştır

**Hata**: "Build failed - Type error"
**Çözüm**: `npx tsc --noEmit` ile hataları local'de düzelt

**Hata**: "Environment variable missing / Supabase connection failed"
**Çözüm**: Netlify > Site Settings > Environment Variables'dan kontrol et, redeploy yap

**Hata**: "Netlify plugin error"
**Çözüm**: `@netlify/plugin-nextjs` paketinin güncel olduğundan emin ol

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

**Son Güncelleme**: 14 Şubat 2026
**Versiyon**: 2.0.0 (GitHub + Netlify)
**Deployment Süresi**: ~30-45 dakika
