# 📋 Product Requirements Document (PRD)
## Dijital Reçete Tabanlı Boya & Kimyasal Tüketim İzleme Sistemi

**Versiyon:** 1.0  
**Tarih:** Ocak 2026  
**Durum:** Taslak

---

## 1. Yönetici Özeti

### 1.1 Proje Tanımı
Tekstil/boya fabrikası için **reçete yönetimi**, **kimyasal tüketim takibi** ve **stok kontrolü** sağlayan entegre bir dijital sistem. ISO 9001 izlenebilirlik gereksinimlerini karşılayacak şekilde tasarlanmıştır.

### 1.2 Problem Tanımı
Mevcut durumda:
- Reçeteler kağıt üzerinde tutulmakta
- Üretim manuel olarak yönetilmekte
- Stok geriye dönük toparlanmakta
- Parti bazlı izlenebilirlik bulunmamakta

Bu yapı ISO açısından üç kritik problem yaratmaktadır:
1. **Reçete revizyonu izlenemiyor** - Hangi versiyonun ne zaman kullanıldığı bilinmiyor
2. **Gerçek sarf ≠ Planlanan sarf** - Fiili tüketim ile planlanan arasında fark var
3. **Parti bazlı izlenebilirlik yok** - Kalite şikayetlerinde kök neden analizi yapılamıyor

### 1.3 Çözüm Özeti
- Dijital reçete yönetimi (versiyonlama ile)
- Otomatik stok düşümü
- Constraint engine ile kalite güvence
- Rol bazlı dashboard sistemi
- ISO 9001 uyumlu izlenebilirlik

### 1.4 Hedef Kullanıcılar
| Rol | Açıklama | Kullanım Sıklığı |
|-----|----------|------------------|
| Admin | Sistem yöneticisi | Günlük |
| Lab (Kimyager) | Reçete oluşturma ve onaylama | Günlük |
| Boyahane (Boya Ustası) | Üretim başlatma | Sürekli |
| Depo | Stok takibi | Günlük |

---

## 2. Hedefler ve Başarı Kriterleri

### 2.1 İş Hedefleri
| Hedef | Metrik | Başarı Kriteri |
|-------|--------|----------------|
| İzlenebilirlik | Parti takip oranı | %100 |
| Stok doğruluğu | Sistem vs fiziki stok farkı | <%2 |
| Reçete uyumu | Constraint ihlali | 0 |
| Operasyonel verimlilik | Manuel veri girişi azalması | %80 |

### 2.2 Teknik Hedefler
- Supabase üzerinde güvenli veri depolama
- n8n ile otomatik workflow yönetimi
- React/Next.js ile responsive dashboard
- 99.5% uptime garantisi

### 2.3 Kullanıcı Deneyimi Hedefleri
- Boya ustası için maksimum 3 tıklama ile üretim başlatma
- Kimyager için sezgisel reçete oluşturma arayüzü
- Mobil uyumlu depo ekranı

---

## 3. Kullanıcı Hikayeleri (User Stories)

### 3.1 Admin Kullanıcı Hikayeleri

#### US-A01: Kullanıcı Yönetimi
**Olarak:** Admin  
**İstiyorum ki:** Sisteme yeni kullanıcı ekleyebileyim ve rol atayabileyim  
**Böylece:** Her kullanıcı sadece yetkili olduğu alanlara erişebilsin

**Kabul Kriterleri:**
- [ ] Kullanıcı ekleme formu mevcut
- [ ] Rol seçimi yapılabiliyor (Admin, Lab, Boyahane, Depo)
- [ ] Kullanıcı listesi görüntülenebiliyor
- [ ] Kullanıcı düzenleme ve silme yapılabiliyor
- [ ] Şifre sıfırlama mümkün

#### US-A02: Sistem Ayarları
**Olarak:** Admin  
**İstiyorum ki:** API anahtarlarını ve mail ayarlarını yönetebilmek  
**Böylece:** Sistem entegrasyonları düzgün çalışsın

**Kabul Kriterleri:**
- [ ] API anahtarı ekleme/düzenleme
- [ ] SMTP ayarları konfigürasyonu
- [ ] Telegram bot token ayarı (opsiyonel)
- [ ] Ayarlar şifreli saklanıyor

#### US-A03: Sistem Konfigürasyonu
**Olarak:** Admin  
**İstiyorum ki:** Kritik stok seviyelerini ve uyarı eşiklerini ayarlayabileyim  
**Böylece:** Sistem iş kurallarına göre çalışsın

**Kabul Kriterleri:**
- [ ] Varsayılan kritik stok seviyesi ayarı
- [ ] Uyarı email listesi yönetimi
- [ ] Rapor periyodu ayarları

---

### 3.2 Lab (Kimyager) Kullanıcı Hikayeleri

#### US-L01: Yeni Reçete Oluşturma
**Olarak:** Kimyager  
**İstiyorum ki:** Yeni bir renk tonu için reçete oluşturabileyim  
**Böylece:** Üretim için standart bir formül tanımlanmış olsun

**Kabul Kriterleri:**
- [ ] Ürün kodu girişi (örn: GREEN-001)
- [ ] Kullanım tipi seçimi (iç mekan, dış mekan, vb.)
- [ ] Kimyasal bileşen ekleme (gram/kg bazlı)
- [ ] Toplam oran kontrolü
- [ ] Reçete kaydetme

#### US-L02: Reçete Versiyonlama
**Olarak:** Kimyager  
**İstiyorum ki:** Mevcut bir reçeteyi güncelleyerek yeni versiyon oluşturabileyim  
**Böylece:** Eski versiyonlar korunurken iyileştirmeler yapılabilsin

**Kabul Kriterleri:**
- [ ] Mevcut reçete seçimi
- [ ] Yeni versiyon oluşturma butonu
- [ ] Değişiklikleri kaydetme
- [ ] Versiyon geçmişi görüntüleme
- [ ] Eski versiyonlar silinmiyor

#### US-L03: Constraint Kontrolü
**Olarak:** Kimyager  
**İstiyorum ki:** Reçete kaydederken otomatik kural kontrolü yapılsın  
**Böylece:** Hatalı reçeteler üretime gönderilmesin

**Kabul Kriterleri:**
- [ ] Zorunlu kimyasal kontrolü
- [ ] Yasak kimyasal kontrolü
- [ ] Minimum oran kontrolü
- [ ] Hata mesajları açık ve anlaşılır
- [ ] Kural ihlalinde reçete kilitlenir

#### US-L04: Reçete Onaylama
**Olarak:** Kimyager  
**İstiyorum ki:** Oluşturduğum reçeteyi aynı ekranda onaylayabileyim  
**Böylece:** Onay süreci hızlı ve pratik olsun

**Kabul Kriterleri:**
- [ ] Onay butonu reçete formunda mevcut
- [ ] Onay öncesi özet görüntüleme
- [ ] Onay sonrası reçete aktif duruma geçiyor
- [ ] Onay tarihi ve onaylayan kaydediliyor

---

### 3.3 Boyahane (Boya Ustası) Kullanıcı Hikayeleri

#### US-B01: Üretim Başlatma
**Olarak:** Boya Ustası  
**İstiyorum ki:** Basit bir arayüzle üretim başlatabileyim  
**Böylece:** Hızlıca işime odaklanabileyim

**Kabul Kriterleri:**
- [ ] Ürün kodu seçimi (arama ile)
- [ ] Miktar girişi (kg)
- [ ] Başlat butonu
- [ ] Maksimum 3 tıklama ile işlem tamamlanıyor
- [ ] Büyük ve okunaklı arayüz

#### US-B02: Uyarı Görüntüleme
**Olarak:** Boya Ustası  
**İstiyorum ki:** Üretim sırasında kritik uyarıları görebileyim  
**Böylece:** Hata yapmadan üretim yapabileyim

**Kabul Kriterleri:**
- [ ] Stok yetersizliği uyarısı
- [ ] Özel talimat uyarıları
- [ ] Uyarılar büyük ve renkli
- [ ] Sesli uyarı (opsiyonel)
- [ ] Kimyager olmayan kişiler için anlaşılır dil

#### US-B03: Üretim Geçmişi
**Olarak:** Boya Ustası  
**İstiyorum ki:** Bugünkü üretimlerimi görebileyim  
**Böylece:** Ne yaptığımı takip edebileyim

**Kabul Kriterleri:**
- [ ] Günlük üretim listesi
- [ ] Ürün kodu, miktar, saat bilgisi
- [ ] Basit liste görünümü

---

### 3.4 Depo Kullanıcı Hikayeleri

#### US-D01: Stok Görüntüleme
**Olarak:** Depo Sorumlusu  
**İstiyorum ki:** Anlık stok durumunu görebileyim  
**Böylece:** Hangi kimyasalın ne kadar olduğunu bileyim

**Kabul Kriterleri:**
- [ ] Tüm kimyasalların listesi
- [ ] Mevcut miktar
- [ ] Kritik seviye göstergesi
- [ ] Renk kodlu uyarılar (yeşil/sarı/kırmızı)
- [ ] Arama ve filtreleme

#### US-D02: Stok Girişi
**Olarak:** Depo Sorumlusu  
**İstiyorum ki:** Yeni gelen kimyasalları sisteme girebilmek  
**Böylece:** Stok güncel kalsın

**Kabul Kriterleri:**
- [ ] Kimyasal seçimi
- [ ] Miktar girişi
- [ ] Parti/lot numarası girişi
- [ ] Tedarikçi bilgisi
- [ ] Giriş tarihi otomatik

#### US-D03: Sipariş Önerileri
**Olarak:** Depo Sorumlusu  
**İstiyorum ki:** Sistem bana sipariş önerisi versin  
**Böylece:** Stok bitmeden tedarik yapabileyim

**Kabul Kriterleri:**
- [ ] Kritik seviyeye yaklaşan kimyasallar listesi
- [ ] Tahmini bitiş tarihi
- [ ] Önerilen sipariş miktarı
- [ ] Excel export

#### US-D04: Tüketim Raporu
**Olarak:** Depo Sorumlusu  
**İstiyorum ki:** Aylık tüketim raporunu görebileyim  
**Böylece:** Tedarik planlaması yapabileyim

**Kabul Kriterleri:**
- [ ] Tarih aralığı seçimi
- [ ] Kimyasal bazlı tüketim
- [ ] Grafik görünümü
- [ ] Excel export

---

## 4. Fonksiyonel Gereksinimler

### 4.1 Reçete Yönetimi Modülü

#### FR-R01: Reçete CRUD İşlemleri
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-R01.1 | Sistem, yeni reçete oluşturmaya izin vermeli | Yüksek |
| FR-R01.2 | Her reçete benzersiz bir SKU koduna sahip olmalı | Yüksek |
| FR-R01.3 | Reçeteler silinememeli, sadece pasif yapılabilmeli | Yüksek |
| FR-R01.4 | Reçete düzenlemesi yeni versiyon oluşturmalı | Yüksek |
| FR-R01.5 | Versiyon geçmişi görüntülenebilmeli | Orta |

#### FR-R02: Reçete Bileşenleri
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-R02.1 | Her reçeteye birden fazla kimyasal eklenebilmeli | Yüksek |
| FR-R02.2 | Kimyasal miktarı gram/kg bazlı girilmeli | Yüksek |
| FR-R02.3 | Toplam oran %100 kontrolü yapılmalı (opsiyonel) | Düşük |
| FR-R02.4 | Bileşen sıralaması ayarlanabilmeli | Düşük |

#### FR-R03: Reçete Onaylama
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-R03.1 | Reçete oluşturma ve onaylama aynı ekranda olmalı | Yüksek |
| FR-R03.2 | Onay öncesi constraint kontrolü yapılmalı | Yüksek |
| FR-R03.3 | Onaylayan kullanıcı ve tarih kaydedilmeli | Yüksek |
| FR-R03.4 | Onaysız reçete üretime gönderilememeli | Yüksek |

---

### 4.2 Constraint Engine (Kısıt Motoru)

#### FR-C01: Kural Tanımlama
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-C01.1 | Kullanım tipine göre zorunlu kimyasal tanımlanabilmeli | Yüksek |
| FR-C01.2 | Kullanım tipine göre yasak kimyasal tanımlanabilmeli | Yüksek |
| FR-C01.3 | Minimum oran kuralı tanımlanabilmeli | Orta |
| FR-C01.4 | Kurallar admin tarafından yönetilebilmeli | Orta |

#### FR-C02: Kural Kontrolü
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-C02.1 | Reçete kaydında otomatik kural kontrolü yapılmalı | Yüksek |
| FR-C02.2 | Zorunlu kimyasal eksikse hata vermeli | Yüksek |
| FR-C02.3 | Yasak kimyasal varsa hata vermeli | Yüksek |
| FR-C02.4 | Minimum oran sağlanmıyorsa uyarı vermeli | Orta |
| FR-C02.5 | Kural ihlalinde reçete kilitlenmeli | Yüksek |

---

### 4.3 Üretim Modülü

#### FR-P01: Üretim Başlatma
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-P01.1 | Onaylı reçete seçilebilmeli | Yüksek |
| FR-P01.2 | Üretim miktarı (kg) girilebilmeli | Yüksek |
| FR-P01.3 | Stok yeterliliği kontrol edilmeli | Yüksek |
| FR-P01.4 | Yetersiz stokta uyarı verilmeli | Yüksek |
| FR-P01.5 | Üretim başlatma onayı alınmalı | Orta |

#### FR-P02: Otomatik Stok Düşümü
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-P02.1 | Üretim başlatıldığında stok otomatik düşmeli | Yüksek |
| FR-P02.2 | Düşüm miktarı reçete x üretim miktarı olmalı | Yüksek |
| FR-P02.3 | Her düşüm için log kaydı oluşturulmalı | Yüksek |
| FR-P02.4 | Düşüm işlemi atomik olmalı (ya hep ya hiç) | Yüksek |

#### FR-P03: Üretim Logu
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-P03.1 | Her üretim için detaylı log tutulmalı | Yüksek |
| FR-P03.2 | Log: ürün kodu, reçete versiyonu, miktar içermeli | Yüksek |
| FR-P03.3 | Log: kullanılan kimyasallar ve miktarları içermeli | Yüksek |
| FR-P03.4 | Log: operatör, tarih/saat, parti no içermeli | Yüksek |
| FR-P03.5 | Loglar düzenlenememeli veya silinememeli | Yüksek |

---

### 4.4 Stok Yönetimi Modülü

#### FR-S01: Stok Takibi
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-S01.1 | Tüm kimyasalların anlık stoku görüntülenmeli | Yüksek |
| FR-S01.2 | Kritik seviye tanımlanabilmeli | Yüksek |
| FR-S01.3 | Kritik seviye altında uyarı verilmeli | Yüksek |
| FR-S01.4 | Stok hareketleri (giriş/çıkış) izlenebilmeli | Orta |

#### FR-S02: Stok Girişi
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-S02.1 | Manuel stok girişi yapılabilmeli | Yüksek |
| FR-S02.2 | Parti/lot numarası kaydedilmeli | Orta |
| FR-S02.3 | Tedarikçi bilgisi kaydedilmeli | Düşük |
| FR-S02.4 | Giriş tarihi otomatik kaydedilmeli | Yüksek |

#### FR-S03: Stok Uyarıları
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-S03.1 | Kritik seviye altında email gönderilmeli | Yüksek |
| FR-S03.2 | Dashboard'da görsel uyarı gösterilmeli | Yüksek |
| FR-S03.3 | Tahmini bitiş tarihi hesaplanmalı | Orta |
| FR-S03.4 | Sipariş önerisi oluşturulmalı | Orta |

---

### 4.5 Raporlama Modülü

#### FR-RP01: Tüketim Raporları
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-RP01.1 | Aylık tüketim raporu oluşturulabilmeli | Yüksek |
| FR-RP01.2 | Yıllık tüketim raporu oluşturulabilmeli | Orta |
| FR-RP01.3 | Kimyasal bazlı filtreleme yapılabilmeli | Orta |
| FR-RP01.4 | Tarih aralığı seçilebilmeli | Yüksek |

#### FR-RP02: Üretim Raporları
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-RP02.1 | Günlük üretim raporu görüntülenebilmeli | Yüksek |
| FR-RP02.2 | Ürün bazlı üretim istatistikleri | Orta |
| FR-RP02.3 | Operatör bazlı üretim istatistikleri | Düşük |

#### FR-RP03: Export
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-RP03.1 | Tüm raporlar Excel formatında export edilebilmeli | Yüksek |
| FR-RP03.2 | PDF export (opsiyonel) | Düşük |

---

### 4.6 Bildirim Sistemi

#### FR-N01: Email Bildirimleri
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-N01.1 | Kritik stok uyarısı email ile gönderilmeli | Yüksek |
| FR-N01.2 | Günlük özet raporu email ile gönderilebilmeli | Orta |
| FR-N01.3 | Email alıcı listesi yönetilebilmeli | Yüksek |

#### FR-N02: Telegram Bildirimleri (Opsiyonel)
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-N02.1 | Telegram bot entegrasyonu | Düşük |
| FR-N02.2 | Kritik uyarılar Telegram'a gönderilebilmeli | Düşük |

---

### 4.7 Boya Ustası Uyarı Sistemi

#### FR-W01: Görsel Uyarılar
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-W01.1 | Uyarılar büyük ve okunaklı olmalı | Yüksek |
| FR-W01.2 | Renk kodlaması kullanılmalı (kırmızı=kritik) | Yüksek |
| FR-W01.3 | İkon kullanımı ile görselleştirme | Orta |
| FR-W01.4 | Basit ve anlaşılır Türkçe | Yüksek |

#### FR-W02: Uyarı Tipleri
| ID | Gereksinim | Öncelik |
|----|------------|---------|
| FR-W02.1 | Stok yetersizliği uyarısı | Yüksek |
| FR-W02.2 | Özel talimat uyarısı | Orta |
| FR-W02.3 | Dikkat edilmesi gereken kimyasal uyarısı | Orta |
| FR-W02.4 | Başarılı işlem onayı | Yüksek |

---

## 5. Non-Fonksiyonel Gereksinimler

### 5.1 Performans Gereksinimleri

| ID | Gereksinim | Hedef |
|----|------------|-------|
| NFR-P01 | Sayfa yüklenme süresi | < 2 saniye |
| NFR-P02 | API yanıt süresi | < 500ms |
| NFR-P03 | Eşzamanlı kullanıcı desteği | 50 kullanıcı |
| NFR-P04 | Veritabanı sorgu süresi | < 100ms |

### 5.2 Güvenlik Gereksinimleri

| ID | Gereksinim | Açıklama |
|----|------------|----------|
| NFR-S01 | Kimlik doğrulama | JWT tabanlı authentication |
| NFR-S02 | Yetkilendirme | Rol bazlı erişim kontrolü (RBAC) |
| NFR-S03 | Veri şifreleme | HTTPS zorunlu, hassas veriler şifreli |
| NFR-S04 | Row Level Security | Supabase RLS politikaları |
| NFR-S05 | Audit log | Tüm kritik işlemler loglanmalı |

### 5.3 Kullanılabilirlik Gereksinimleri

| ID | Gereksinim | Açıklama |
|----|------------|----------|
| NFR-U01 | Responsive tasarım | Tablet ve masaüstü desteği |
| NFR-U02 | Türkçe arayüz | Tüm metinler Türkçe |
| NFR-U03 | Erişilebilirlik | WCAG 2.1 AA uyumu |
| NFR-U04 | Boyahane arayüzü | Büyük butonlar, basit navigasyon |

### 5.4 Güvenilirlik Gereksinimleri

| ID | Gereksinim | Hedef |
|----|------------|-------|
| NFR-R01 | Sistem uptime | %99.5 |
| NFR-R02 | Veri yedekleme | Günlük otomatik yedek |
| NFR-R03 | Hata kurtarma | < 4 saat |
| NFR-R04 | Veri bütünlüğü | Transaction desteği |

### 5.5 Ölçeklenebilirlik Gereksinimleri

| ID | Gereksinim | Açıklama |
|----|------------|----------|
| NFR-SC01 | Yatay ölçekleme | Supabase otomatik ölçekleme |
| NFR-SC02 | Veri büyümesi | 5 yıllık veri desteği |
| NFR-SC03 | Modüler yapı | Yeni modüller eklenebilmeli |

### 5.6 Bakım Gereksinimleri

| ID | Gereksinim | Açıklama |
|----|------------|----------|
| NFR-M01 | Kod kalitesi | ESLint, Prettier standartları |
| NFR-M02 | Dokümantasyon | API ve kullanıcı dokümantasyonu |
| NFR-M03 | Versiyon kontrolü | Git ile versiyon yönetimi |
| NFR-M04 | Test coverage | Minimum %70 |

---

## 6. Kısıtlamalar ve Varsayımlar

### 6.1 Kısıtlamalar

| ID | Kısıtlama |
|----|-----------|
| C01 | Teknoloji stack: Supabase, n8n, React/Next.js |
| C02 | n8n arka planda çalışacak, kullanıcı görmeyecek |
| C03 | Tüm yönetim dashboard üzerinden yapılacak |
| C04 | Türkçe arayüz zorunlu |
| C05 | ISO 9001 izlenebilirlik gereksinimleri karşılanmalı |

### 6.2 Varsayımlar

| ID | Varsayım |
|----|----------|
| A01 | Kullanıcılar temel bilgisayar kullanımı bilgisine sahip |
| A02 | İnternet bağlantısı sürekli mevcut |
| A03 | Kimyasal listesi önceden tanımlanacak |
| A04 | Kullanım tipleri önceden belirlenecek |
| A05 | Mevcut reçeteler sisteme aktarılacak |

---

## 7. Bağımlılıklar

### 7.1 Dış Bağımlılıklar

| Bağımlılık | Açıklama | Risk |
|------------|----------|------|
| Supabase | Veritabanı ve authentication | Düşük |
| n8n | Workflow otomasyonu | Düşük |
| SMTP Sunucu | Email gönderimi | Orta |
| Telegram API | Bildirimler (opsiyonel) | Düşük |

### 7.2 İç Bağımlılıklar

| Bağımlılık | Açıklama |
|------------|----------|
| Kimyasal listesi | Reçete oluşturmadan önce tanımlanmalı |
| Kullanım kuralları | Constraint engine için gerekli |
| Kullanıcı rolleri | Yetkilendirme için gerekli |

---

## 8. Kabul Kriterleri

### 8.1 Genel Kabul Kriterleri

- [ ] Tüm kullanıcı hikayeleri tamamlanmış
- [ ] Tüm fonksiyonel gereksinimler karşılanmış
- [ ] Non-fonksiyonel gereksinimler test edilmiş
- [ ] Kullanıcı kabul testleri başarılı
- [ ] Dokümantasyon tamamlanmış

### 8.2 Modül Bazlı Kabul Kriterleri

#### Reçete Yönetimi
- [ ] Reçete oluşturma, düzenleme, versiyonlama çalışıyor
- [ ] Constraint kontrolü aktif
- [ ] Onay mekanizması çalışıyor

#### Üretim Modülü
- [ ] Üretim başlatma çalışıyor
- [ ] Otomatik stok düşümü çalışıyor
- [ ] Üretim logları oluşuyor

#### Stok Yönetimi
- [ ] Stok görüntüleme çalışıyor
- [ ] Stok girişi çalışıyor
- [ ] Uyarı sistemi aktif

#### Raporlama
- [ ] Tüketim raporları oluşuyor
- [ ] Excel export çalışıyor

#### Bildirimler
- [ ] Email bildirimleri gönderiliyor
- [ ] Dashboard uyarıları görünüyor

---

## 9. Riskler ve Azaltma Stratejileri

| Risk | Olasılık | Etki | Azaltma Stratejisi |
|------|----------|------|---------------------|
| Kullanıcı adaptasyonu düşük | Orta | Yüksek | Eğitim, basit arayüz |
| Veri göçü sorunları | Orta | Orta | Aşamalı göç, doğrulama |
| Performans sorunları | Düşük | Orta | Optimizasyon, caching |
| Entegrasyon hataları | Orta | Orta | Kapsamlı test |
| Güvenlik açıkları | Düşük | Yüksek | Güvenlik testleri, RLS |

---

## 10. Sözlük

| Terim | Açıklama |
|-------|----------|
| SKU | Stock Keeping Unit - Benzersiz ürün kodu |
| Reçete | Bir renk tonu için kimyasal formülü |
| Constraint | Kısıt, kural |
| RLS | Row Level Security - Satır bazlı güvenlik |
| Versiyon | Reçetenin belirli bir sürümü |
| Parti | Üretim partisi, lot |
| Kritik Seviye | Stok uyarı eşiği |

---

## 11. Ekler

### Ek A: Ekran Tasarım Gereksinimleri

#### Boyahane Ekranı
- Büyük, okunaklı fontlar (minimum 18px)
- Yüksek kontrast renkler
- Maksimum 3 ana buton
- Dokunmatik ekran uyumlu

#### Lab Ekranı
- Detaylı form alanları
- Tablo görünümü
- Filtreleme ve arama
- Versiyon karşılaştırma

#### Depo Ekranı
- Kart bazlı stok görünümü
- Renk kodlu seviye göstergeleri
- Hızlı giriş formu
- Grafik dashboard

### Ek B: Örnek Kullanım Senaryoları

#### Senaryo 1: Yeni Reçete Oluşturma
1. Kimyager sisteme giriş yapar
2. "Yeni Reçete" butonuna tıklar
3. Ürün kodu girer (GREEN-051)
4. Kullanım tipi seçer (Dış Mekan)
5. Kimyasalları ve oranları girer
6. Kaydet'e tıklar
7. Sistem constraint kontrolü yapar
8. Başarılı ise onay ekranı gelir
9. Kimyager onaylar
10. Reçete aktif olur

#### Senaryo 2: Üretim Başlatma
1. Boya ustası sisteme giriş yapar
2. Ürün kodu arar (GREEN-051)
3. Miktar girer (100 kg)
4. "Başlat" butonuna tıklar
5. Sistem stok kontrolü yapar
6. Yeterli ise onay ister
7. Usta onaylar
8. Stok otomatik düşer
9. Üretim logu oluşur
10. Başarı mesajı gösterilir

---

**Doküman Sonu**

*Bu PRD, proje geliştirme sürecinde güncellenebilir. Tüm değişiklikler versiyon kontrolü altında tutulacaktır.*
