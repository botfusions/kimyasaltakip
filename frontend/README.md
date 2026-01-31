# Kimyasal Takip Sistemi

Dijital Reçete Tabanlı Boya & Kimyasal Tüketim İzleme Sistemi

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi ve Güvenlik
- Role-based access control (Admin, Lab, Operator, Customer)
- Signature ID sistemi (Lab kullanıcıları için 4-6 haneli PIN)
- Secure authentication via Supabase
- Audit logging tüm kritik işlemler için

### 📦 Malzeme Yönetimi (Materials Management)
- Tam CRUD işlemleri (Create, Read, Update, Delete)
- Malzeme tipleri: Hammadde, Boya, Diğer
- Stok limitleri (min/max)
- Güvenlik bilgileri ve saklama koşulları
- Aktif/Pasif durum yönetimi
- Gelişmiş arama ve filtreleme

### 🧪 Ürün Yönetimi (Products Management)
- Tam CRUD işlemleri
- Ürün tipleri: Boya, Vernik, Diğer
- Hedef pH ve yoğunluk değerleri
- Raf ömrü takibi (gün bazında)
- Birim yönetimi (kg, L, m³, ton)
- Aktif/Pasif durum kontrolü

### 📋 Reçete Yönetimi (Recipe Management)
- **Reçete Oluşturma ve Düzenleme:**
  - Dinamik malzeme seçici
  - Otomatik yüzde hesaplama
  - Miktar ve oran kontrolü
  - Versiyon kodu yönetimi
  
- **Signature ID İle Onay Sistemi:**
  - Lab kullanıcıları PIN ile onaylar
  - Müşteri kabul sonrası dijital imza
  - Onaylanmış reçeteler immutable (değiştirilemez)
  
- **Durum Yönetimi:**
  - Taslak (Draft)
  - Müşteri Bekliyor (Pending)
  - Onaylandı (Approved)
  - Revize Gerekli (Rejected)

### 📊 Audit ve Takip
- Tüm veri değişiklikleri loglanır
- Kim, ne zaman, ne yaptı takibi
- Sistem güvenliği ve denetlenebilirlik

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla

`.env.local` dosyasını kopyalayın ve değerleri doldurun:

```bash
cp .env.local.example .env.local
```

Gerekli ortam değişkenleri:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase proje URL'si
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon anahtarı
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role anahtarı
- `N8N_WEBHOOK_URL` - n8n webhook URL'si (opsiyonel)
- `N8N_API_KEY` - n8n API anahtarı (opsiyonel)
- `SMTP_HOST` - SMTP sunucu adresi
- `SMTP_PORT` - SMTP portu
- `SMTP_USER` - SMTP kullanıcı adı
- `SMTP_PASS` - SMTP şifresi

### 3. Veritabanı Migration'larını Uygula

Supabase SQL Editor'da sırasıyla çalıştırın:

```bash
supabase/migrations/20260130000001_tables.sql
supabase/migrations/20260130000002_triggers.sql
supabase/migrations/20260130000003_seed.sql
supabase/migrations/20260130000004_add_signature_id.sql
```

### 4. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📁 Proje Yapısı

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── actions/      # Server Actions (CRUD işlemleri)
│   │   ├── api/          # API Routes
│   │   ├── auth/         # Authentication sayfaları
│   │   └── dashboard/    # Dashboard modülleri
│   │       ├── users/
│   │       ├── materials/
│   │       ├── products/
│   │       └── recipes/
│   ├── components/       # React bileşenleri
│   │   ├── ui/           # Temel UI bileşenleri
│   │   ├── users/
│   │   ├── materials/
│   │   ├── products/
│   │   └── recipes/
│   ├── lib/              # Yardımcı fonksiyonlar
│   │   └── supabase/     # Supabase client'ları
│   ├── types/            # TypeScript tip tanımları
│   └── hooks/            # Custom React hooks
├── public/               # Statik dosyalar
└── docs/                 # Dokümantasyon
```

## 🛠️ Geliştirme

### Kullanılabilir Komutlar

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Production build oluştur
npm run build

# Production sunucusunu başlat
npm start

# Lint çalıştır
npm run lint

# Type check
npx tsc --noEmit
```

## 🔒 Signature ID Sistemi

Lab kullanıcıları için özel PIN sistemi:

- **Oluşturma:** User oluşturulurken otomatik 4-6 haneli benzersiz ID
- **Kullanım:** Reçete onaylarken dijital imza olarak
- **Güvenlik:** Doğru PIN girişi zorunlu
- **Değiştirilemez:** Role değiştikçe otomatik yönetilir

## 📚 Dokümantasyon

- [PRD](../docs/PRD.md) - Ürün Gereksinimleri Dokümanı
- [PLAN](../docs/PLAN.md) - Proje Planı ve Geliştirme Aşamaları
- [ARCHITECTURE](../docs/ARCHITECTURE.md) - Sistem Mimarisi

## 🗺️ Roadmap

### ✅ Tamamlanan (Phase 1-3)
- [x] Authentication & Authorization
- [x] User Management (with Signature ID)
- [x] Materials Management
- [x] Products Management
- [x] Recipe Management (with Signature Approval)

### 🚧 Geliştiriliyor (Phase 3 Devam)
- [ ] Recipe PDF Generation
- [ ] Recipe Archiving (Supabase Storage)
- [ ] Recipe Versioning Logic

### 📋 Planlanan (Phase 4-5)
- [ ] Stock Management
- [ ] Production Tracking
- [ ] Reporting Features
- [ ] Mobile Responsive Enhancements

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel lisans altındadır.

---

**Son Güncelleme:** 30 Ocak 2026  
**Versiyon:** Phase 3 - Recipe Management Release

