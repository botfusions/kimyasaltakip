# 📋 TODO LİSTESİ

> **Son Güncelleme:** 18 Şubat 2026 - 19:45
> **Durum:** %85 Tamamlandı ✨ (Hedef: %100)

---

## 🚨 P0 - KRİTİK HATA DÜZELTMELERİ (Bu Hafta!) ✅ TAMAMLANDI

### [x] 1. Database Types Düzelt (1 gün) ✅

**Dosya:** `frontend/src/types/database.types.ts`

**Komut:**

```bash
cd frontend
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts
```

**Kontrol:**

- [x] `@ts-nocheck` satırı kaldırıldı ✅
- [x] workspace, video_project gibi yanlış tablolar yok ✅
- [x] users, recipes, materials gibi gerçek tablolar var ✅
- [x] Migration oluşturuldu: 20260207000001_add_missing_recipe_columns.sql ✅

---

### [x] 2. recipes.ts Düzelt (1 gün) ✅

**Dosya:** `frontend/src/app/actions/recipes.ts`

**Problem:** 13 eksik alan eklendi ✅

- order_code, color_name, process_info, total_weight
- machine_code, work_order_date, bath_volume
- customer_name, sip_no, customer_ref_no
- customer_order_no, customer_sip_mt, yarn_type

**Düzeltme:**

```typescript
// createRecipe fonksiyonu
const { data, error } = await supabase.from("recipes").insert({
  product_id: recipeData.product_id,
  usage_type_id: recipeData.usage_type_id, // ✅ EKLE
  created_by: user.id,
  status: "draft",
  // ... diğer alanlar
});
```

**Frontend:**

```typescript
// RecipeEditor.tsx - Form'a ekle
<select name="usage_type_id" required>
  <option value="">Kullanım Tipi Seçin</option>
  {usageTypes.map(type => (
    <option key={type.id} value={type.id}>{type.name}</option>
  ))}
</select>
```

---

### [x] 3. products.ts Düzelt (1 gün) ✅

**Dosya:** `frontend/src/app/actions/products.ts`

**Problem:** Olmayan alanlar kaldırıldı ✅

- type, unit, target_ph, target_density, shelf_life_days kaldırıldı

**Düzeltme:**

```typescript
// KALDIR - DB'de yok
// type: formData.get('type'),
// unit: formData.get('unit'),
// target_ph: formData.get('target_ph'),

// Sadece bunlar
const { data, error } = await supabase.from("products").insert({
  code: formData.get("code"),
  name: formData.get("name"),
  description: formData.get("description"),
  base_color: formData.get("base_color"),
  is_active: true,
});
```

---

### [x] 4. materials.ts Düzelt (1 gün) ✅

**Dosya:** `frontend/src/app/actions/materials.ts`

**Problem:** critical_level kullanımı düzeltildi ✅

- min_stock → critical_level olarak değiştirildi
- max_stock, storage_conditions kaldırıldı

**Düzeltme:**

```typescript
// DEĞIŞTIR
const { data, error } = await supabase.from("materials").insert({
  code: formData.get("code"),
  name: formData.get("name"),
  unit: formData.get("unit"),
  category: formData.get("category"),
  critical_level: formData.get("critical_level"), // ✅ min_stock yerine
  // min_stock: ... ❌ KALDIR
  // max_stock: ... ❌ KALDIR
});
```

---

### [x] 5. users.ts - Supabase Auth Entegrasyonu (1 gün) ✅

**Dosya:** `frontend/src/app/actions/users.ts`

**Problem:** Kullanıcı oluşturulduğunda Supabase Auth'a kayıt yapılmıyor ✅

**Tamamlanan İşlemler:**

- [x] Validation schema'ya password alanı eklendi (`user.ts`)
- [x] `createUser()` fonksiyonuna `auth.signUp()` entegrasyonu eklendi
- [x] Auth'dan gelen `user.id` kullanılıyor
- [x] Email redirect URL ayarlandı
- [x] Detaylı error handling eklendi
- [x] UserModal'a password ve confirmPassword alanları eklendi
- [x] Form validation eklendi (min 8 karakter, şifre eşleşmesi)
- [x] Password sadece yeni kullanıcı oluştururken gösteriliyor
- [x] Audit log'da password "[REDACTED]" olarak kaydediliyor

---

### [ ] 6. RLS Politikalarını Tamamla (2 gün)

**Dosya:** `supabase/migrations/20260207000001_complete_rls.sql`

**Oluştur ve uygula:**

```sql
-- RECIPES
CREATE POLICY recipes_lab_insert ON recipes
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'lab'))
  );

CREATE POLICY recipes_lab_update ON recipes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- MATERIALS
CREATE POLICY materials_admin_write ON materials
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- STOCK
CREATE POLICY stock_warehouse_write ON stock
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'warehouse'))
  );

-- PRODUCTION_LOGS
CREATE POLICY production_logs_insert ON production_logs
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'production'))
  );

-- Her tablo için benzer politikalar...
```

---

## 🔥 P1 - TEMEL MODÜLLER (Hafta 3-6)

### [ ] 7. Üretim Modülü (7 gün)

#### [ ] 7.1 Server Action (2 gün)

**Dosya:** `frontend/src/app/actions/production.ts`

```typescript
"use server";

export async function startProduction(data: {
  recipe_id: string;
  quantity: number;
  operator_id: string;
}) {
  // 1. Stok kontrolü
  // 2. production_logs kayıt
  // 3. Otomatik stok düşümü (n8n webhook)
  // 4. production_materials kayıt
}

export async function completeProduction(id: string) {
  // 1. Status güncelle
  // 2. completed_at set et
  // 3. Kalite kontrolü flag
}
```

#### [ ] 7.2 Liste Sayfası (2 gün)

**Dosya:** `frontend/src/app/dashboard/production/page.tsx`

- [ ] Üretim listesi (tablo)
- [ ] Durum filtreleme (pending/in_progress/completed)
- [ ] Tarih filtreleme
- [ ] "Yeni Üretim" butonu

#### [ ] 7.3 Yeni Üretim Sayfası (2 gün)

**Dosya:** `frontend/src/app/dashboard/production/new/page.tsx`

- [ ] Reçete seçimi (dropdown + arama)
- [ ] Barkod okuma (opsiyonel)
- [ ] Miktar girişi
- [ ] Stok yeterlilik uyarısı
- [ ] Operator seçimi

#### [ ] 7.4 Detay Sayfası (1 gün)

**Dosya:** `frontend/src/app/dashboard/production/[id]/page.tsx`

- [ ] Üretim detayları
- [ ] Kullanılan malzemeler listesi
- [ ] Durum güncelleme
- [ ] Kalite kontrolü butonu

---

### [x] 8. Stok Yönetimi (5 gün) ✅ TAMAMLANDI (%0 → %100)

#### [x] 8.1 Ana Sayfa (2 gün) ✅

**Dosya:** `frontend/src/app/dashboard/stock/page.tsx`

- [x] Stok listesi (tablo) ✅
- [x] Mevcut/rezerve miktar ✅
- [x] Kritik stok göstergesi (renk kodlu) ✅
- [x] Arama ve filtreleme ✅
- [x] "Yeni Hareket" butonu ✅
- [x] Stats kartları (Toplam, Kritik, Miktar) ✅
- [x] Kritik stok uyarı banner'ı ✅

#### [x] 8.2 Manuel Stok Giriş Formu (2 gün) ✅

**Dosya:** `frontend/src/app/dashboard/stock/movement/new/page.tsx`

- [x] Malzeme seçimi (dropdown) ✅
- [x] 3 Hareket tipi: Giriş (📥), Çıkış (📤), Düzeltme (⚖️) ✅
- [x] Görsel kart bazlı seçim ✅
- [x] Miktar girişi ✅
- [x] Parti/lot numarası ✅
- [x] Tedarikçi bilgisi (giriş için) ✅
- [x] Birim maliyet (opsiyonel) ✅
- [x] Referans bilgileri (Fatura/Sipariş/Üretim) ✅
- [x] Notlar ve açıklamalar ✅
- [x] SSS (Sık Sorulan Sorular) bölümü ✅

#### [x] 8.3 Stok Hareketi Yönetimi (1 gün) ✅

**Server Actions:** `frontend/src/app/actions/stock.ts`

- [x] getAllStock() - Tüm stokları listele ✅
- [x] addStockMovement() - Giriş/çıkış/düzeltme ✅
- [x] getStockMovements() - Hareket geçmişi ✅
- [x] Detaylı hareket görünümü ✅
- [x] Tarih bazlı sıralama ✅

---

### [ ] 9. Raporlama Dashboard (4 gün)

#### [ ] 9.1 Ana Rapor Sayfası (2 gün)

**Dosya:** `frontend/src/app/dashboard/reports/page.tsx`

- [ ] Tarih aralığı seçici
- [ ] 3 tab: Tüketim / Üretim / Stok Trendi

#### [ ] 9.2 Grafikler (2 gün)

**Dosyalar:**

- `ConsumptionChart.tsx` - Malzeme tüketim grafiği (bar chart)
- `ProductionChart.tsx` - Üretim istatistikleri (line chart)
- `StockTrendChart.tsx` - Stok değişimi (area chart)

**Teknoloji:** Recharts (zaten kurulu)

---

### [ ] 10. Maliyet Hesaplama (3 gün)

#### [ ] 10.1 DB Değişikliği (0.5 gün)

```sql
ALTER TABLE materials ADD COLUMN unit_price DECIMAL(12,2);
ALTER TABLE stock_movements ADD COLUMN unit_cost DECIMAL(12,2);
ALTER TABLE stock_movements ADD COLUMN total_cost DECIMAL(12,2);
```

#### [ ] 10.2 Malzeme Fiyat Yönetimi (1 gün)

- [ ] MaterialModal'a unit_price alanı ekle
- [ ] Fiyat geçmişi kaydet (opsiyonel)

#### [ ] 10.3 Reçete Maliyet Hesaplama (1.5 gün)

- [ ] RecipeDetailsView'a maliyet göster
- [ ] Parti bazlı maliyet analizi
- [ ] Maliyet karşılaştırma raporu

---

## 🎯 P2 - FARKLILAŞMA (Hafta 7-12)

### [ ] 11. Proses Parametreleri (5 gün)

- [ ] process_steps tablosu migration
- [ ] RecipeEditor'a adım ekleme UI
- [ ] Sıcaklık/pH/süre alanları
- [ ] Proses kartı PDF

### [ ] 12. Kalite Kontrol (6 gün)

- [ ] quality_tests tablosu
- [ ] Test kaydı formu
- [ ] ISO 105 test tipleri
- [ ] Gri skala dropdown (1.0-5.0)
- [ ] Test sertifikası PDF

### [ ] 13. Barkod/QR Takip (4 gün)

- [ ] Bidon barkod etiket PDF
- [ ] Kamera okuma (react-webcam)
- [ ] Lot bazlı stok hareketi
- [ ] Son kullanma tarihi uyarısı

### [x] 14. E-Fatura Entegrasyonu (5 gün) ✅ TAMAMLANDI

#### [x] XML Parser (UBL-TR e-Fatura) ✅

**Dosya:** `frontend/src/lib/invoice-parser.ts`

- [x] parseInvoiceXML() - fast-xml-parser ✅
- [x] Fatura bilgileri çıkarma ✅
- [x] Otomatik malzeme eşleştirme ✅

#### [x] OCR Entegrasyonu ✅

**Dosya:** `frontend/src/app/api/ocr/route.ts`

- [x] /api/ocr endpoint ✅
- [x] Python Tesseract OCR entegrasyonu ✅
- [x] PDF ve JPEG/PNG desteği ✅
- [x] parseOCRText() - Regex bazlı parsing ✅

#### [x] Fatura Import Actions ✅

**Dosya:** `frontend/src/app/actions/invoices.ts`

- [x] importInvoice() - XML için ✅
- [x] importInvoiceFromOCR() - PDF/JPEG için ✅
- [x] Fuzzy matching algoritması ✅
- [x] Otomatik stok hareketi oluşturma ✅
- [x] deleteInvoiceImport() - Fatura silme ve rollback ✅
- [x] getInvoiceHistory() - Fatura geçmişi ✅

#### [x] Frontend ✅

- [x] /dashboard/invoices/import sayfası ✅
- [x] /dashboard/invoices sayfası (liste) ✅
- [x] InvoiceImportClient.tsx ✅
- [x] InvoiceListClient.tsx ✅
- [x] Drag & drop dosya yükleme ✅
- [x] Çoklu format desteği (XML, PDF, JPEG, PNG) ✅
- [x] Eşleşme sonuçları gösterimi ✅
- [x] Fatura silme ve onay modalı ✅

### [ ] 15. AI RAG Optimizasyon (6 gün)

- [ ] pgvector extension
- [ ] recipe_embeddings tablosu
- [ ] Vektörize etme script
- [ ] AI optimizasyon önerisi UI

---

## 🌟 P3 - STRATEJİK DEĞER (Hafta 13-20)

### [ ] 16. ZDHC/RSL Uyumluluk (8 gün)

- [ ] compliance_standards tablosu (zaten var)
- [ ] restricted_substances tablosu (zaten var)
- [ ] CAS numarası eşleştirme
- [ ] AFIRM RSL veritabanı import
- [ ] Limit kontrolü algoritması
- [ ] Uyumluluk raporu PDF

### [ ] 17. L*a*b\* ve Delta E (4 gün)

- [ ] color_measurements tablosu
- [ ] Manuel L*a*b\* giriş formu
- [ ] Delta E hesaplama fonksiyonu
- [ ] Kabul kriteri tanımlama
- [ ] Renk farkı görselleştirme

### [ ] 18. Tedarikçi Yönetimi (5 gün)

- [ ] suppliers tablosu
- [ ] Tedarikçi CRUD
- [ ] Malzeme-tedarikçi ilişkilendirme
- [ ] Sipariş önerisi algoritması
- [ ] Performans raporu

### [ ] 19. API Entegrasyon (4 gün)

- [ ] REST API endpoints (Next.js Route Handlers)
- [ ] API key yönetimi (settings tablosu)
- [ ] Webhook desteği
- [ ] Rate limiting (Vercel middleware)
- [ ] API dokümantasyonu (Swagger)

---

## 📊 İLERLEME TAKİBİ

### Hafta 1 (7-13 Şubat) ✅ TAMAMLANDI

- [x] Database migration oluşturuldu ✅
- [x] Action düzeltmeleri (recipes, products, materials, stock) ✅
- [x] Stok Yönetimi Sistemi (%0 → %100) ✅
- [x] E-Fatura Entegrasyonu (XML, OCR, PDF, JPEG) ✅
- [x] Manuel Stok Giriş Formu ✅
- [x] Fatura Silme Sistemi ✅
- [x] DEPLOYMENT.md ve .env.local.example hazırlandı ✅

**Hedef:** %45 → %72 ✅ (AŞILDI! 🎉)

---

### Hafta 2 (14-20 Şubat)

- [ ] Error handling
- [ ] Validation (Zod)
- [ ] Production deploy
- [ ] Beta test hazırlığı

**Hedef:** %55 → %60 (Production-ready)

---

### Hafta 3-4 (21 Şubat - 6 Mart)

- [ ] Üretim modülü
- [ ] Stok yönetimi

**Hedef:** %60 → %75 (Temel modüller tamamlandı)

---

### Hafta 5-6 (7-20 Mart)

- [ ] Raporlama dashboard
- [ ] Maliyet hesaplama

**Hedef:** %75 → %85 (MVP tamamlandı)

---

## 🎯 BAŞARI KRİTERLERİ

### Kısa Vade (2 Hafta) ✅ TAMAMLANDI

- [x] Hiçbir TypeScript hatası ✅
- [x] Tüm action'lar DB ile uyumlu ✅
- [x] Migration dosyaları hazır (8 adet) ✅
- [x] Stok Yönetimi %100 ✅
- [x] E-Fatura Entegrasyonu %80 ✅
- [x] Deployment rehberi hazır (DEPLOYMENT.md) ✅
- [x] Supabase Auth Entegrasyonu %100 ✅

### Orta Vade (6 Hafta)

- ✅ Üretim modülü çalışıyor
- ✅ Stok yönetimi tam
- ✅ Raporlama dashboard aktif
- ✅ Beta kullanıcı testi yapıldı

### Uzun Vade (12 Hafta)

- ✅ Tüm farklılaşma özellikleri
- ✅ Rakiplerden ayrışma sağlandı
- ✅ İlk 10 müşteri kazanıldı

---

---

## 🎉 SON TAMAMLANANLAR (7-8 Şubat 2026)

### Phase 5 - Kritik Düzeltmeler ve Stok Sistemi Tamamlandı

**Database Düzeltmeleri:**

- ✅ Migration oluşturuldu: `20260207000001_add_missing_recipe_columns.sql`
- ✅ recipes.ts: 13 eksik alan eklendi
- ✅ products.ts: Olmayan alanlar kaldırıldı
- ✅ materials.ts: critical_level kullanımı düzeltildi
- ✅ stock.ts: 3 yeni fonksiyon eklendi

**Stok Yönetimi Sistemi (%0 → %100):**

- ✅ Stok Dashboard (/dashboard/stock)
- ✅ Manuel Stok Giriş Formu (/dashboard/stock/movement/new)
- ✅ 3 hareket tipi: Giriş (📥), Çıkış (📤), Düzeltme (⚖️)
- ✅ Stats kartları, kritik stok uyarıları
- ✅ Arama, filtreleme, sıralama
- ✅ SSS (Sık Sorulan Sorular) bölümü

**E-Fatura Entegrasyonu:**

- ✅ XML Parser (UBL-TR e-Fatura)
- ✅ OCR Entegrasyonu (Tesseract, Python)
- ✅ PDF ve JPEG/PNG desteği
- ✅ Fuzzy matching algoritması
- ✅ Otomatik stok hareketi oluşturma
- ✅ Fatura silme ve rollback sistemi
- ✅ Fatura listesi ve yönetim sayfası

**Deployment Hazırlık:**

- ✅ DEPLOYMENT.md - Tam kurulum rehberi
- ✅ .env.local.example - Environment variables şablonu
- ✅ Migration dosyaları organize

**Toplam Süre:** ~6 saat (Planlanandan %40 daha hızlı!)
**Yeni Dosyalar:** 11 dosya oluşturuldu, 7 dosya güncellendi

---

## 🎉 BUGÜN TAMAMLANANLAR (8 Şubat 2026 - Akşam)

### Phase 5.1 - Supabase Auth & Bug Fixes Tamamlandı

**1. Supabase Auth Entegrasyonu ✅**

- ✅ Password validation (Zod schema)
- ✅ auth.signUp() ile kullanıcı kaydı
- ✅ UserModal password alanları (yeni kullanıcı için)
- ✅ Password confirmation validation
- ✅ Audit log güvenliği ([REDACTED])
- ✅ Admin kullanıcı oluşturuldu (selam@botfusions.com)

**2. Database View & Bug Fixes ✅**

- ✅ view_critical_stock migration oluşturuldu ve uygulandı
- ✅ Dashboard kolon isimleri düzeltildi (stock_quantity → current_quantity)
- ✅ StockManagementClient import hatası düzeltildi
- ✅ Kritik stok uyarıları çalışıyor

**3. Dark Mode Tamamlandı 🌓**

- ✅ Tailwind config güncellendi (darkMode: 'class')
- ✅ next-themes paketi kuruldu
- ✅ ThemeProvider component oluşturuldu
- ✅ ThemeToggle component oluşturuldu (☀️/🌙)
- ✅ Header'a theme toggle butonu eklendi
- ✅ Root layout'a ThemeProvider entegre edildi
- ✅ Dashboard page dark mode class'ları eklendi
- ✅ System theme detection aktif
- ✅ Tüm component'ler dark mode destekli

**4. Dokümantasyon ✅**

- ✅ README.md güncellendi (yeni özellikler eklendi)
- ✅ TODO.md güncellendi (%72 → %75)
- ✅ Git commit yapıldı (16 dosya)

**Toplam Süre:** ~2 saat
**Yeni Dosyalar:** 3 dosya oluşturuldu, 8 dosya güncellendi

---

## 🎉 BUGÜN TAMAMLANANLAR (18 Şubat 2026)

### Phase 6 - Compliance & Stock Automation ✅

**1. Reçete Uyumluluk (Compliance) ✅**

- ✅ `checkRecipeCompliance` server action
- ✅ MRSL/RSL veritabanı sorgulama
- ✅ Reçete onay öncesi otomatik kontrol ve UI entegrasyonu

**2. Otomatik Stok Düşümü ✅**

- ✅ `approveRecipe` güncellemesi
- ✅ Onay anında otomatik stok hareketi (Giriş -> Çıkış)
- ✅ `addStockMovementInternal` ile internal yetki yönetimi
- ✅ `kts_production_logs` ve `kts_production_materials` kaydı

**3. Raporlama Altyapısı ✅**

- ✅ `generateMonthlyUsageCSV` fonksiyonu
- ✅ Admin client ile güvenli server-side veri erişimi
- ✅ Üretim loglarından otomatik sarfiyat raporu oluşturma

**Durum:** Kritik döngü tamamlandı (Onay -> Stok -> Rapor)

---

**NOT:** Her görev tamamlandığında bu dosyayı güncelle ve commit et!

```bash
git add TODO.md
git commit -m "feat: completed task #X - [task name]"
```
