# ⚡ HIZLI BAŞLANGIÇ REHBERİ

> **Hedef:** 2 hafta içinde production-ready hale getir

---

## 🚨 GÜNCEL DURUM

- **Genel Tamamlanma:** %45
- **Çalışan:** Reçete, Malzeme, Ürün, Kullanıcı, AI Danışman
- **Eksik:** Üretim (%0), Stok (%25), Raporlama (%15)
- **Kritik Hatalar:** 3 adet (P0)

---

## ⚠️ KRİTİK HATALAR (P0) - ÖNCE BUNLAR!

### 1. Database Types Yanlış (1 gün)

**Problem:** `database.types.ts` yanlış projeden kopyalanmış, `@ts-nocheck` ile gizlenmiş.

**Çözüm:**
```bash
cd frontend
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

**Dosya:** `frontend/src/types/database.types.ts`

---

### 2. DB Şema-Kod Uyumsuzlukları (3 gün)

**Problem:** Kodda INSERT edilen alanlar, veritabanında yok veya NOT NULL olanlar eksik.

**Düzeltilecek Dosyalar:**

```typescript
// ❌ HATA: recipes.ts
const { data, error } = await supabase
  .from('recipes')
  .insert({
    product_id: recipeData.product_id,
    // EKSIK: usage_type_id (NOT NULL!)
    // EKSIK: created_by
  })

// ✅ DÜZELTME:
const { data, error } = await supabase
  .from('recipes')
  .insert({
    product_id: recipeData.product_id,
    usage_type_id: recipeData.usage_type_id,
    created_by: user.id,
    status: 'draft'
  })
```

**Düzeltilecek Actionlar:**
- ✅ `recipes.ts` - usage_type_id ekle
- ✅ `products.ts` - type, unit, target_ph alanlarını kaldır (DB'de yok)
- ✅ `materials.ts` - min_stock, max_stock yerine critical_level kullan
- ✅ `users.ts` - Supabase Auth'a da kaydet

**Dosyalar:**
- `frontend/src/app/actions/recipes.ts`
- `frontend/src/app/actions/products.ts`
- `frontend/src/app/actions/materials.ts`
- `frontend/src/app/actions/users.ts`

---

### 3. RLS Politikaları Eksik (2 gün)

**Problem:** Sadece SELECT politikaları var, INSERT/UPDATE/DELETE yok.

**Çözüm:** Yeni migration oluştur:

```sql
-- supabase/migrations/20260207000001_complete_rls.sql

-- RECIPES: Lab INSERT
CREATE POLICY recipes_lab_insert ON recipes
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'lab'))
  );

-- RECIPES: Lab UPDATE (kendi oluşturdukları veya admin)
CREATE POLICY recipes_lab_update ON recipes
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- STOCK: Warehouse INSERT/UPDATE
CREATE POLICY stock_warehouse_write ON stock
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'warehouse'))
  );

-- PRODUCTION: Production INSERT
CREATE POLICY production_logs_insert ON production_logs
  FOR INSERT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'production'))
  );

-- Her tablo için benzer politikalar ekle...
```

**Dosya:** Yeni migration oluştur

---

## 🎯 SONRAKI ADIMLAR (Öncelik Sırası)

### Hafta 1: Kritik Düzeltmeler

| Gün | Görev | Dosyalar |
|-----|-------|----------|
| 1 | Database.types.ts yenile | `types/database.types.ts` |
| 2-4 | Action dosyalarını düzelt | `app/actions/*.ts` |
| 5 | RLS politikalarını ekle | `supabase/migrations/` |

---

### Hafta 2: Test ve Deployment

| Gün | Görev |
|-----|-------|
| 1-2 | Tüm işlemleri test et (login, reçete, malzeme) |
| 3 | Error handling iyileştir |
| 4 | Validation ekle (Zod) |
| 5 | Production deploy (Vercel + Supabase) |

---

## 📁 DOSYA YOL HARİTASI

### Düzeltilecek Dosyalar (P0)

```
frontend/src/
├── types/
│   └── database.types.ts           ❌ Yeniden oluştur
├── app/actions/
│   ├── recipes.ts                  ❌ usage_type_id ekle
│   ├── products.ts                 ❌ type, unit kaldır
│   ├── materials.ts                ❌ critical_level düzelt
│   └── users.ts                    ❌ Supabase Auth entegrasyonu
└── components/recipes/
    └── RecipeEditor.tsx            ❌ usage_type_id formu ekle
```

### Oluşturulacak Dosyalar (P1)

```
frontend/src/
├── app/
│   ├── dashboard/
│   │   ├── production/
│   │   │   ├── page.tsx           🆕 Liste sayfası
│   │   │   └── new/page.tsx       🆕 Yeni üretim
│   │   ├── stock/
│   │   │   ├── page.tsx           🆕 Stok sayfası
│   │   │   └── movements/page.tsx 🆕 Hareketler
│   │   └── reports/
│   │       └── page.tsx           🆕 Raporlama
│   └── actions/
│       └── production.ts          🆕 Üretim actions
└── components/
    ├── production/
    │   ├── ProductionStartModal.tsx  🆕
    │   └── ProductionListClient.tsx  🆕
    └── stock/
        ├── StockEntryModal.tsx       🆕
        └── StockMovementList.tsx     🆕
```

---

## 🔧 HATA AYIKLAMA KOMUTLARI

### TypeScript Hatalarını Gör

```bash
cd frontend
npm run build
# Hataları listele
```

### Supabase Bağlantı Testi

```bash
cd frontend
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('users').select('count').then(console.log);
"
```

### Database Migration Uygula

```bash
cd supabase
npx supabase db push
```

---

## 📊 İLERLEME TAKİBİ

### P0 Görevler (Bu Hafta)

- [ ] database.types.ts yeniden oluştur
- [ ] recipes.ts düzelt
- [ ] products.ts düzelt
- [ ] materials.ts düzelt
- [ ] users.ts düzelt
- [ ] RLS politikaları ekle
- [ ] Tüm işlemleri test et

### P1 Görevler (Önümüzdeki 2 Hafta)

- [ ] Üretim modülü (production.ts + UI)
- [ ] Stok sayfası (stock/page.tsx)
- [ ] Raporlama sayfası (reports/page.tsx)
- [ ] Maliyet hesaplama

---

## 🎯 BAŞARI KRİTERLERİ

### Hafta 1 Sonu

- ✅ Hiçbir TypeScript hatası yok
- ✅ Tüm action'lar DB şemasıyla uyumlu
- ✅ RLS politikaları aktif ve çalışıyor
- ✅ Reçete oluşturma end-to-end çalışıyor

### Hafta 2 Sonu

- ✅ Production deploy tamamlandı
- ✅ Test kullanıcısı sistemi kullanabiliyor
- ✅ Hata logları temiz
- ✅ Performans kabul edilebilir (<2s sayfa yüklenme)

---

## 🆘 SIKÇA KARŞILAŞILAN HATALAR

### Hata 1: "column 'usage_type_id' violates not-null constraint"

**Sebep:** recipes.ts'de usage_type_id gönderilmiyor.

**Çözüm:**
```typescript
// RecipeEditor.tsx
<select name="usage_type_id" required>
  <option value="">Seçiniz...</option>
  {usageTypes.map(type => (
    <option key={type.id} value={type.id}>
      {type.name}
    </option>
  ))}
</select>

// recipes.ts
usage_type_id: formData.get('usage_type_id')
```

---

### Hata 2: "row-level security policy violation"

**Sebep:** INSERT/UPDATE politikası eksik.

**Çözüm:** RLS politikalarını yukarıdaki SQL ile ekle.

---

### Hata 3: "Type 'unknown' is not assignable to type..."

**Sebep:** database.types.ts yanlış.

**Çözüm:** `npx supabase gen types` ile yeniden oluştur.

---

## 📞 YARDIM KAYNAKLARI

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Proje PRD:** `docs/PRD.md`
- **Veritabanı Şeması:** `docs/DATABASE_SCHEMA.md`

---

**BAŞARILAR!** 🚀
