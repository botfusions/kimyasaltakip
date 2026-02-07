# 📋 TODO LİSTESİ

> **Son Güncelleme:** 7 Şubat 2026
> **Durum:** %45 Tamamlandı

---

## 🚨 P0 - KRİTİK HATA DÜZELTMELERİ (Bu Hafta!)

### [ ] 1. Database Types Düzelt (1 gün)
**Dosya:** `frontend/src/types/database.types.ts`

**Komut:**
```bash
cd frontend
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts
```

**Kontrol:**
- [ ] `@ts-nocheck` satırı kaldırıldı
- [ ] workspace, video_project gibi yanlış tablolar yok
- [ ] users, recipes, materials gibi gerçek tablolar var
- [ ] npm run build çalışıyor

---

### [ ] 2. recipes.ts Düzelt (1 gün)
**Dosya:** `frontend/src/app/actions/recipes.ts`

**Problem:** `usage_type_id` NOT NULL ama gönderilmiyor

**Düzeltme:**
```typescript
// createRecipe fonksiyonu
const { data, error } = await supabase
  .from('recipes')
  .insert({
    product_id: recipeData.product_id,
    usage_type_id: recipeData.usage_type_id, // ✅ EKLE
    created_by: user.id,
    status: 'draft',
    // ... diğer alanlar
  })
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

### [ ] 3. products.ts Düzelt (1 gün)
**Dosya:** `frontend/src/app/actions/products.ts`

**Problem:** DB'de olmayan alanlar gönderiliyor (type, unit, target_ph)

**Düzeltme:**
```typescript
// KALDIR - DB'de yok
// type: formData.get('type'),
// unit: formData.get('unit'),
// target_ph: formData.get('target_ph'),

// Sadece bunlar
const { data, error } = await supabase
  .from('products')
  .insert({
    code: formData.get('code'),
    name: formData.get('name'),
    description: formData.get('description'),
    base_color: formData.get('base_color'),
    is_active: true,
  })
```

---

### [ ] 4. materials.ts Düzelt (1 gün)
**Dosya:** `frontend/src/app/actions/materials.ts`

**Problem:** min_stock, max_stock gönderiliyor ama DB'de critical_level var

**Düzeltme:**
```typescript
// DEĞIŞTIR
const { data, error } = await supabase
  .from('materials')
  .insert({
    code: formData.get('code'),
    name: formData.get('name'),
    unit: formData.get('unit'),
    category: formData.get('category'),
    critical_level: formData.get('critical_level'), // ✅ min_stock yerine
    // min_stock: ... ❌ KALDIR
    // max_stock: ... ❌ KALDIR
  })
```

---

### [ ] 5. users.ts - Supabase Auth Entegrasyonu (1 gün)
**Dosya:** `frontend/src/app/actions/users.ts`

**Problem:** Kullanıcı oluşturulduğunda Supabase Auth'a kayıt yapılmıyor

**Düzeltme:**
```typescript
export async function createUser(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string // Form'da ekle
  const name = formData.get('name') as string
  const role = formData.get('role') as string

  // 1. Supabase Auth'a kaydet
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw new Error(authError.message)

  // 2. users tablosuna kaydet
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id, // ✅ Auth'dan gelen ID
      email,
      name,
      role,
      is_active: true,
    })

  return data
}
```

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
'use server'

export async function startProduction(data: {
  recipe_id: string
  quantity: number
  operator_id: string
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

### [ ] 8. Stok Yönetimi (5 gün)

#### [ ] 8.1 Ana Sayfa (2 gün)
**Dosya:** `frontend/src/app/dashboard/stock/page.tsx`

- [ ] Stok listesi (tablo)
- [ ] Mevcut/rezerve miktar
- [ ] Kritik stok göstergesi (renk kodlu)
- [ ] Arama ve filtreleme
- [ ] "Stok Girişi" butonu

#### [ ] 8.2 Stok Giriş Modal (2 gün)
**Dosya:** `frontend/src/components/stock/StockEntryModal.tsx`

- [ ] Malzeme seçimi
- [ ] Miktar girişi
- [ ] Parti/lot numarası
- [ ] Tedarikçi bilgisi
- [ ] Birim maliyet (opsiyonel)

#### [ ] 8.3 Stok Hareketleri (1 gün)
**Dosya:** `frontend/src/app/dashboard/stock/movements/page.tsx`

- [ ] Hareket geçmişi
- [ ] Tarih filtreleme
- [ ] Malzeme filtreleme
- [ ] Tip filtreleme (giriş/çıkış/düzeltme)

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

### [ ] 14. E-Fatura XML (5 gün)
- [ ] invoice-parser.ts (fast-xml-parser)
- [ ] stock_drafts tablosu
- [ ] InvoiceDraftList component
- [ ] Malzeme eşleştirme UI

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

### [ ] 17. L*a*b* ve Delta E (4 gün)
- [ ] color_measurements tablosu
- [ ] Manuel L*a*b* giriş formu
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

### Hafta 1 (7-13 Şubat)
- [ ] Database.types.ts ✅
- [ ] Action düzeltmeleri (recipes, products, materials, users) ✅
- [ ] RLS politikaları ✅
- [ ] Test ve doğrulama

**Hedef:** %45 → %55 (Kritik hatalar giderildi)

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

### Kısa Vade (2 Hafta)
- ✅ Hiçbir TypeScript hatası
- ✅ Tüm action'lar DB ile uyumlu
- ✅ RLS politikaları çalışıyor
- ✅ Production deploy başarılı

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

**NOT:** Her görev tamamlandığında bu dosyayı güncelle ve commit et!

```bash
git add TODO.md
git commit -m "feat: completed task #X - [task name]"
```
