# Gelecek Versiyon: Kimyasal Uyumluluk (Denetleyici) Sistemi Spesifikasyonu

Bu belge, **Kimyasal Takip Sistemi v2.0** için planlanan "Uyumluluk Denetleyicisi" modülünün teknik tasarımını ve uygulama detaylarını içerir.

## 1. Sistemin Amacı
Kumaş boyama reçetelerinin, uluslararası kısıtlı madde listelerine (RSL) ve marka özel kriterlerine uygunluğunu **otomatik olarak** denetlemek ve uygunsuzluk durumunda Yapay Zeka (RAG) desteği ile alternatif reçeteler önermek.

---

## 2. Veri Kaynakları ve Entegrasyon Stratejisi

### A. AFIRM RSL (Uluslararası Kısıtlı Maddeler Listesi)
- **Kaynak:** AFIRM Group web sitesi (PDF/Web).
- **Yöntem:** PDF'ten veri çekme ("scraping") veya yayınlanan Excel tablolarını içe aktarma.
- **Veri Yapısı:** CAS Numarası, Kimyasal Adı, Limit Değeri (mg/kg), Test Yöntemi.

### B. Uluslararası Boya Kriterleri (PowerBI)
- **Kaynak:** PowerBI Dashboard Linki.
- **Erişim Analizi:**
    - **Zorluk:** PowerBI raporları HTML tablo yapısı yerine genellikle **Canvas (Tuval) / SVG** ve karmaşık JavaScript API'leri kullanır. Klasik "HTML Kazıma" (BeautifulSoup vb.) burada **çalışmaz**.
    - **Olası Çözümler:**
        1.  **API Yakalama (Orta/Zor):** Tarayıcı ağ trafiğini (Network Traffic) dinleyerek PowerBI'ın arka planda çağırdığı JSON verilerini yakalamak. Ancak bu API'ler sık sık değişebilir ve karmaşık token yapıları içerebilir.
        2.  **Görsel Kazıma / OCR (Zor):** Sayfanın ekran görüntüsünü alıp görüntü işleme ile veriyi çıkarma. Hata oranı yüksektir.
        3.  **Manuel / Excel Export (Önerilen):** PowerBI raporunun sahibi veriyi "Excel'e Aktar" seçeneği ile dışarı alıp sisteme yükler. En güvenilir yöntemdir.
    - **Karar:** İlk etapta verinin Excel/CSV formatında temin edilmesi istenir. Eğer bu mümkün değilse, PowerBI üzerindeki veriler için özel bir veri giriş ekranı oluşturulacaktır.

---

## 3. Veritabanı Şeması (Supabase / PostgreSQL)

Aşağıdaki SQL şeması, sistem aktif edildiğinde uygulanmalıdır.

```sql
-- 1. CAS Numarası (Kimliklendirme)
-- Mevcut 'materials' tablosuna eklenir.
ALTER TABLE materials ADD COLUMN IF NOT EXISTS cas_number VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_materials_cas_number ON materials(cas_number);

-- 2. Uyumluluk Standartları (Örn: "AFIRM 2024", "Adidas A-01")
CREATE TABLE IF NOT EXISTS compliance_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Kısıtlı Maddeler (Kurallar)
CREATE TABLE IF NOT EXISTS restricted_substances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id UUID NOT NULL REFERENCES compliance_standards(id),
    cas_number VARCHAR(50) NOT NULL, -- Kimyasal eşleşmesi buradan yapılır
    chemical_name VARCHAR(255) NOT NULL,
    limit_value DECIMAL(10,3), -- Örn: 50.0
    limit_unit VARCHAR(50), -- Örn: 'ppm', 'mg/kg'
    measurement_method VARCHAR(255),
    UNIQUE(standard_id, cas_number)
);

-- 4. Uyumluluk Belgeleri (RAG / AI için)
-- pgvector eklentisi gerektirir.
CREATE TABLE IF NOT EXISTS compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id UUID REFERENCES compliance_standards(id),
    title VARCHAR(255),
    content TEXT, -- Kuralın metin hali
    embedding vector(1536) -- OpenAI embedding
);
```

---

## 4. Doğrulama Mantığı (Algoritma)

Sistem bir reçeteyi şu adımlarla kontrol eder:

1.  **Reçete Ayrıştırma:** Reçetedeki her malzeme (`recipe_items`) alınır.
2.  **CAS Eşleşmesi:** Malzemenin `cas_number` bilgisi ile `restricted_substances` tablosu sorgulanır.
3.  **Limit Kontrolü:**
    *   Eğer madde yasaklı listesindeyse:
    *   `Kullanılan Miktar` > `Limit Değeri` ise -> **RED (FAIL)**
4.  **Raporlama:** Hangi maddenin hangi standarttaki limiti aştığı kullanıcıya gösterilir.

---

## 5. Yapay Zeka ve RAG Desteği

Eğer bir reçete "Uygunsuz" çıkarsa:
1.  Sistem, uyumsuz maddenin neden yasaklandığını açıklayan metni `compliance_documents` tablosundan vektör arama ile bulur.
2.  LLM'e şu komut gönderilir: *"Bu reçete [Madde X] yüzünden [Standart Y] limitlerini aşıyor. Veritabanındaki diğer malzemeleri kullanarak, aynı rengi verebilecek ama limiti aşmayan bir reçete öner."*
3.  Önerilen reçete kullanıcıya "Alternatif" olarak sunulur.

---

## 6. Arayüz Gereksinimleri

*   **Reçete Ekranı:** "Uyumluluk Kontrolü" butonu.
*   **Sonuç Paneli:** Yeşil (Geçti) / Kırmızı (Kaldı) ve detaylı ihlal raporu.
*   **Yönetim Paneli:** Yeni RSL listesi yükleme (Excel/CSV) ekranı.
