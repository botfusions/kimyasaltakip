# Supabase Auth & Resend SMTP Entegrasyon Rehberi

Supabase'in varsayılan e-posta servisi günlük 3 mail ile sınırlıdır ve mailler genellikle "Spam" klasörüne düşer. **Resend**'i SMTP Relay olarak kullanarak bu sorunu profesyonelce çözebiliriz.

## 1. Resend SMTP Bilgilerini Alın

1. [Resend Dashboard](https://resend.com/)'a gidin.
2. Sol menüden **"Settings"** > **"SMTP"** sekmesine tıklayın.
3. Yeni bir API Key oluşturun (varsa mevcut olanı kullanın).
4. Aşağıdaki bilgileri bir kenara not edin:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `465` veya `587` (Genelde 587 tercih edilir)
   - **SMTP User:** `resend`
   - **SMTP Password:** (Oluşturduğunuz API Key)

## 2. Supabase SMTP Ayarlarını Yapın

1. [Supabase Dashboard](https://supabase.com/)'a gidin.
2. Projenizi seçin.
3. Sol menüden **Settings** > **Auth** yolunu izleyin.
4. **"SMTP Settings"** bölümünü bulun ve şu bilgileri girin:
   - **Enable SMTP:** Açık (On)
   - **Sender email:** `onboarding@resend.dev` (veya Resend'de doğruladığınız kendi domainiz)
   - **Sender name:** `Kimyasal Takip Sistemi`
   - **Host:** `smtp.resend.com`
   - **Port:** `587`
   - **User:** `resend`
   - **Pass:** (Resend API Key)

## 3. Türkçe E-posta Şablonları (Supabase Dashboard)

Aynı sayfadaki **"Email Templates"** sekmesinden aşağıdaki şablonları kopyalayıp yapıştırarak sisteminizi tamamen Türkçeleştirebilirsiniz.

### 📧 Kayıt Onayı (Confirm Signup)

**Konu:** `Kimyasal Takip Sistemi - E-posta Doğrulaması`
**Mesaj:**

```html
<h2>KTS'ye Hoşgeldiniz!</h2>
<p>
  Kimyasal Takip Sistemi'ne erişim sağlamak için lütfen aşağıdaki bağlantıya
  tıklayarak e-posta adresinizi doğrulayın:
</p>
<p><a href="{{ .ConfirmationURL }}">E-posta Adresimi Doğrula</a></p>
<p>
  Eğer bu hesabı siz oluşturmadıysanız, lütfen bu e-postayı dikkate almayın.
</p>
```

### 🔐 Şifre Sıfırlama (Reset Password)

**Konu:** `Şifre Sıfırlama Talebi`
**Mesaj:**

```html
<h2>Şifrenizi mi Unuttunuz?</h2>
<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıyı kullanabilirsiniz:</p>
<p><a href="{{ .ConfirmationURL }}">Şifremi Sıfırla</a></p>
<p>Bu talep sizin tarafınızdan yapılmadıysa, şifreniz güvende kalacaktır.</p>
```

### 🪄 Sihirli Bağlantı (Magic Link)

**Konu:** `Giriş Bağlantınız`
**Mesaj:**

```html
<p>Aşağıdaki bağlantıya tıklayarak doğrudan giriş yapabilirsiniz:</p>
<p><a href="{{ .ConfirmationURL }}">Sisteme Giriş Yap</a></p>
```

## 4. Test Etme

Ayarları kaydettikten sonra, kullanıcı paneline gidip yeni bir kullanıcı ekleyerek mailin profesyonel bir şekilde (ve Türkçe olarak) gidip gitmediğini test edebilirsiniz.
