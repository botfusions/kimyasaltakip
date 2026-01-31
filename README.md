# Kimyasal Takip Sistemi 🧪

Dijital Reçete Tabanlı Boya & Kimyasal Tüketim İzleme Sistemi

> **Akıllı Üretim Takibi** | **Gerçek Zamanlı Stok Yönetimi** | **Otomatik Bildirimler**

---

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi ve Güvenlik
- **Role-based access control** (Admin, Lab, Production, Warehouse)
- **Signature ID sistemi** - Lab kullanıcıları için 4-6 haneli PIN
- **Secure authentication** via Supabase Auth
- **Audit logging** - Tüm kritik işlemler için otomatik kayıt

### 📦 Malzeme Yönetimi
- Tam CRUD işlemleri (Create, Read, Update, Delete)
- Malzeme tipleri: Hammadde, Boya, Diğer
- **Gerçek zamanlı stok takibi** ve otomatik düşüm
- Stok limitleri (min/max) ve kritik stok uyarıları
- Güvenlik bilgileri (SDS) ve saklama koşulları
- Gelişmiş arama ve filtreleme

### 🧪 Ürün Yönetimi
- Tam CRUD işlemleri
- Ürün tipleri: Boya, Vernik, Diğer
- Hedef pH ve yoğunluk değerleri
- Raf ömrü takibi (gün bazında)
- Birim yönetimi (kg, L, m³, ton)

### 📋 Reçete Yönetimi

#### Reçete Oluşturma ve Düzenleme
- **Esnek Ürün Seçimi** - Ürünlü veya ürünsüz reçete oluşturma
- **Boyahane Üretim Takip Formu** - İş emri, müşteri, renk ve proses detayları
- **Dinamik malzeme seçici** - Sürükle-bırak ile kolay düzenleme
- **Otomatik yüzde hesaplama** - Toplam %100 kontrolü
- **Miktar ve oran doğrulama**
- **Versiyon kodu yönetimi** - Her reçete değişikliği izlenebilir

#### Signature ID İle Onay Sistemi
- Lab kullanıcıları **PIN** ile onaylar
- Müşteri kabul sonrası **dijital imza**
- Onaylanmış reçeteler **immutable** (değiştirilemez)

#### Durum Yönetimi
- ✍️ **Taslak** (Draft)
- ⏳ **Müşteri Bekliyor** (Pending)
- ✅ **Onaylandı** (Approved)
- ❌ **Revize Gerekli** (Rejected)

### 📊 Gerçek Zamanlı Dashboard
- **Anlık stok seviyeleri** görüntüleme
- **Kritik stok uyarıları** - Minimum seviyenin altındaki malzemeler
- **Toplam malzeme** ve stok miktarı istatistikleri
- **Supabase Realtime** ile canlı güncelleme (sayfa yenilemeden)

### 📧 Email ve Bildirim Sistemi
- **Resend API** entegrasyonu
- Reçete onaylandığında **otomatik bildirim**
- **Aylık kullanım raporları** (CSV formatında)
- Admin panelinden **email alıcıları yönetimi**
- Muhasebe, yönetim gibi farklı departmanlara toplu gönderim

### ⚙️ Admin Paneli
- **Sistem ayarları yönetimi** (`/dashboard/settings`)
- Email alıcıları düzenleme (virgülle ayrılmış liste)
- **Resend API key** yönetimi
- Gönderici email adresi yapılandırması

### 🔄 Üretim Takibi
- Otomatik **stok düşümü** üretim tamamlandığında
- **Parti numarası** bazlı izlenebilirlik
- **Malzeme kullanım** detayları ve raporları
- **SQL Triggers** ile veri tutarlılığı

---

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd frontend
npm install
```

### 2. Ortam Değişkenlerini Ayarla

`.env.local` dosyasını oluşturun:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Veritabanı Migration'larını Uygula

Supabase SQL Editor'da sırasıyla çalıştırın:

```bash
1. supabase/migrations/20260130000001_tables.sql
2. supabase/migrations/20260130000002_triggers.sql
3. supabase/migrations/20260130000003_seed.sql
4. supabase/migrations/20260130000004_add_signature_id.sql
5. supabase/migrations/20260130000005_seed_settings.sql
6. supabase/migrations/20260130000006_email_settings.sql  # Email sistemi
7. supabase/migrations/20260130000007_stock_management.sql # Stok otomasyonu
```

### 4. Email Sistemini Yapılandır

1. **Resend hesabı** oluşturun: [resend.com](https://resend.com)
2. **API Key** alın (ücretsiz plan: 100 email/gün)
3. Admin panelinden (`/dashboard/settings`) ayarları girin:
   - `RESEND_API_KEY`: API key'iniz
   - `EMAIL_FROM_ADDRESS`: `onboarding@resend.dev` (veya doğrulanmış domain)
   - `REPORT_RECEIVER_EMAILS`: `muhasebe@firma.com, yonetim@firma.com`

### 5. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

---

## 📖 Kullanım Örnekleri

### Örnek 1: Reçete Oluşturma (Mavi Boya)

```
Ürün: Mavi Boya (MB-2024-001)
Toplam Miktar: 100 kg

Malzemeler:
┌──────────────────────┬──────────┬─────────┬────────┐
│ Malzeme Adı          │ Kod      │ Miktar  │ Oran % │
├──────────────────────┼──────────┼─────────┼────────┤
│ Polyester Reçine     │ HAM-001  │ 45 kg   │ 45%    │
│ Mavi Pigment         │ BOYA-012 │ 30 kg   │ 30%    │
│ Kalsit               │ HAM-023  │ 20 kg   │ 20%    │
│ Hardener             │ HAM-045  │ 5 kg    │ 5%     │
└──────────────────────┴──────────┴─────────┴────────┘
Toplam: 100 kg = %100 ✅
```

**Adımlar:**
1. `/dashboard/recipes` → "Yeni Reçete Oluştur"
2. Ürün seçin: **Mavi Boya**
3. Malzemeleri ekleyin (yukarıdaki tablo)
4. **Kaydet** → Durum: "Taslak"
5. **Müşteriye Gönder** → Durum: "Müşteri Bekliyor"
6. Müşteri kabul edince → **PIN ile onayla** → Durum: "Onaylandı" ✅

### Örnek 2: Üretim ve Stok Düşümü

```
Reçete: MB-2024-001 (Onaylanmış)
Üretim Miktarı: 100 kg
Parti No: BATCH-20260130-001

Üretim Tamamlandığında:
✅ Otomatik stok düşümü
✅ stock_movements tablosuna kayıt
✅ Dashboard'da güncel stok görünümü (realtime)
```

### Örnek 3: Aylık Rapor Gönderimi

```bash
# Admin panelinden manuel tetikleme:
/dashboard/settings → "Test Email Gönder"

# Rapor içeriği (CSV):
Tarih, Parti No, Ürün Kodu, Malzeme, Miktar
2026-01-15, BATCH-001, MB-001, HAM-001, 45kg
2026-01-15, BATCH-001, MB-001, BOYA-012, 30kg
...

# Alıcılar (settings tablosundan):
muhasebe@firma.com, yonetim@firma.com
```

---

## 📁 Proje Yapısı

```
KİMYASAL TAKİP/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── actions/          # Server Actions
│   │   │   │   ├── auth.ts
│   │   │   │   ├── materials.ts
│   │   │   │   ├── recipes.ts
│   │   │   │   ├── reports.ts    # 📧 Rapor gönderimi
│   │   │   │   ├── settings.ts   # ⚙️ Admin ayarları
│   │   │   │   └── stock.ts      # 📦 Stok sorguları
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx      # 📊 Ana dashboard (realtime)
│   │   │   │   ├── materials/
│   │   │   │   ├── recipes/
│   │   │   │   └── settings/     # ⚙️ Admin panel
│   │   │   │       ├── page.tsx
│   │   │   │       └── test-email/
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── email.ts          # 📧 Resend entegrasyonu
│   │   │   ├── reports.ts        # 📄 CSV oluşturma
│   │   │   └── supabase/
│   │   └── types/
│   └── public/
├── supabase/
│   └── migrations/
│       ├── 20260130000006_email_settings.sql
│       └── 20260130000007_stock_management.sql
└── docs/
    ├── PRD.md
    └── PLAN.md
```

---

## 🛠️ Teknoloji Stack

| Kategori | Teknoloji |
|----------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **UI/UX** | Tailwind CSS, Headless UI, Heroicons |
| **Backend** | Next.js Server Actions, Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Row Level Security) |
| **Realtime** | Supabase Realtime |
| **Email** | Resend API |
| **State** | Zustand, React Query |
| **Validation** | Zod |

---

## 🔒 Signature ID Sistemi

Lab kullanıcıları için özel PIN tabanlı dijital imza:

```
Kullanıcı Oluşturma:
└─> role === 'lab' 
    └─> Otomatik 4-6 haneli benzersiz ID
        └─> Örnek: 4721, 582934

Reçete Onaylama:
└─> "Onayla" butonu
    └─> PIN Modal açılır
        └─> Kullanıcı PIN girer (örn: 4721)
            └─> Doğru PIN ✅ → Reçete "Approved"
            └─> Yanlış PIN ❌ → Hata mesajı
```

**Güvenlik:**
- PIN'ler **hash'lenmez** (görünür olmalı - dijital imza için)
- Sadece **lab role**'ü olanlar alır
- Role değişirse **otomatik yönetilir**

---

## 📊 Dashboard Özellikleri

### Ana Sayfa (`/dashboard`)

```
┌─────────────────────────────────────────────────┐
│  📊 Gösterge Paneli                             │
├───────────────┬───────────────┬─────────────────┤
│ Toplam Malzeme│  Kritik Stok  │  Toplam Stok    │
│     42        │       3       │    1,245 kg     │
└───────────────┴───────────────┴─────────────────┘

⚠️ Kritik Stok Uyarıları:
┌─────────────────────────────────────────┐
│ Polyester Reçine (HAM-001)              │
│ Mevcut: 15 kg | Min: 50 kg              │
├─────────────────────────────────────────┤
│ Mavi Pigment (BOYA-012)                 │
│ Mevcut: 8 kg | Min: 10 kg               │
└─────────────────────────────────────────┘
```

### Ayarlar Sayfası (`/dashboard/settings`)

```
⚙️ Sistem Ayarları

📧 Email Ayarları
┌─────────────────────────────────────────┐
│ 🔑 Resend API Key                       │
│ [re_*********************]              │
├─────────────────────────────────────────┤
│ 📨 Gönderici Email Adresi               │
│ [onboarding@resend.dev]                 │
├─────────────────────────────────────────┤
│ 👥 Rapor Alıcı Email Adresleri          │
│ [muhasebe@firma.com, yon@firma.com]     │
│ 💡 Birden fazla için virgül ile ayırın  │
└─────────────────────────────────────────┘

[💾 Ayarları Kaydet]
```

---

## 🧪 Test

### Email Sistemi Testi

```bash
# Test sayfasını aç
http://localhost:3000/dashboard/settings/test-email

# "Test Email Gönder" butonuna tıkla
# Email gelen kutunuzu kontrol edin
```

### Stok Dashboard Testi

```bash
# Dashboard'u aç
http://localhost:3000/dashboard

# Supabase'de manuel stok güncelle:
UPDATE stock SET quantity = 5 WHERE material_id = '<material_id>';

# Dashboard otomatik güncellendi mi kontrol et (Realtime)
```

---

## 🗺️ Roadmap

### ✅ Tamamlanan (Phase 1-4)
- [x] Authentication & Authorization
- [x] User Management (Signature ID)
- [x] Materials Management
- [x] Products Management
- [x] Recipe Management (Signature Approval)
- [x] Gerçek Zamanlı Stok Takibi
- [x] Email Sistemi (Resend)
- [x] Admin Settings Paneli
- [x] Otomatik Stok Düşümü
- [x] Dashboard Widget'ları
- [x] Recipe PDF Generation (Barkodlu)
- [x] Barcode Generation

### 🚧 Geliştiriliyor
- [ ] Scheduled Monthly Reports (Supabase Edge Functions)

### 📋 Planlanan (Phase 5)
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics
### 3. Barcode Scanning & Generation
- **Otomatik Barkod** - İş emri veya versiyon kodundan otomatik üretim
- **PDF Entegrasyonu** - Reçete çıktılarında taranabilir barkod
- **Detay Görünümü** - Reçete detaylarında barkod görseli

### 📋 Planlanan (Phase 5)
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics
- [ ] QR Code Generation

---

## 📄 Lisans

Bu proje özel lisans altındadır.

---

**Son Güncelleme:** 30 Ocak 2026  
**Versiyon:** Phase 4 - Stock Tracking & Email System Release  
**Geliştirici:** Kimyasal Takip Ekibi
