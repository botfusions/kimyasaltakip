const { execSync } = require('child_process');
const path = require('path');

console.log('=== KTS SİSTEM DOĞRULAMA MERKEZİ ===');
console.log('Tarih:', new Date().toLocaleString('tr-TR'));
console.log('-----------------------------------');

const scripts = [
    { name: 'Şema Durumu', file: 'verify_schema_status.js' },
    { name: 'KTS Tablo Yapısı', file: 'verify_kts_schema.js' },
    { name: 'RLS Politikaları', file: 'verify_rls.js' }
];

let successCount = 0;

scripts.forEach(script => {
    console.log(`\n▶ Çalıştırılıyor: ${script.name} (${script.file})...`);
    try {
        const output = execSync(`node "${path.join(__dirname, script.file)}"`, { encoding: 'utf8' });
        console.log(output);
        successCount++;
    } catch (error) {
        console.error(`❌ HATA: ${script.name} çalıştırılamadı.`);
        if (error.stdout) console.log(error.stdout);
        if (error.stderr) console.error(error.stderr);
    }
});

console.log('\n-----------------------------------');
console.log(`Özet: ${successCount}/${scripts.length} test başarıyla tamamlandı.`);
if (successCount === scripts.length) {
    console.log('✅ SİSTEM DURUMU: SAĞLIKLI');
} else {
    console.log('⚠️ SİSTEM DURUMU: DİKKAT GEREKLİ');
}
