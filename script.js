document.addEventListener('DOMContentLoaded', () => {
    // ------ التحقق من دعم المتصفح ------
    if (!window.FileReader || !window.Blob || !window.URL) {
        alert("متصفحك لا يدعم بعض الميزات الضرورية. يُرجى التحديث للحصول على أفضل تجربة.");
        return;
    }

    // ------ العناصر الرئيسية ------
    const colorCountSelect = document.getElementById('colorCount');
    const imageUpload = document.getElementById('imageUpload');
    const paletteContainer = document.getElementById('paletteContainer');
    const loading = document.getElementById('loading');
    let lastGeneratedColors = [];

    // ------ إعدادات الروابط التابعة ------
    const affiliateLinks = [
        { url: 'https://coolors.co/?ref=yourID', text: 'أنشئ باليتات متقدمة على Coolors →' },
        { url: 'https://adobe.com/color?ref=yourID', text: 'تصميم متقدم مع أدوبي كولور →' }
    ];

    // ------ دالة تحويل RGB إلى HEX ------
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // ------ دالة عرض Toast ------
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ------ معالجة تحميل الصورة (مدمج مع Vibrant.js و ColorThief) ------
    imageUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        loading.style.display = 'block';
        paletteContainer.innerHTML = '';
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = URL.createObjectURL(file);

        try {
            // ------ استخراج الألوان باستخدام ColorThief ------
            img.onload = () => {
                const colorThief = new ColorThief();
                const palette = colorThief.getPalette(img, parseInt(colorCountSelect.value));
                const colors = palette.map(color => rgbToHex(...color));
                renderPalette(colors, 'ColorThief');
            };

            // ------ استخراج الألوان باستخدام Vibrant.js ------
            const vibrant = new Vibrant(img);
            const vibrantPalette = await vibrant.swatches();
            const vibrantColors = Object.values(vibrantPalette)
                .filter(c => c)
                .map(c => c.hex);
            
            renderPalette(vibrantColors, 'Vibrant.js');
            
        } catch (err) {
            showToast("تعذر استخراج الألوان. يرجى تجربة صورة أخرى.");
        } finally {
            loading.style.display = 'none';
        }

        img.onerror = () => {
            showToast("خطأ في تحميل الصورة!");
            loading.style.display = 'none';
        };
    });

    // ------ دالة عرض الباليت (مُحدَّثة) ------
    function renderPalette(colors, source) {
        colors.forEach((color, index) => {
            const colorCard = document.createElement('div');
            colorCard.className = 'color-card';
            colorCard.style.backgroundColor = color;
            colorCard.innerHTML = `
                <div>${color}</div>
                <small>${source}</small>
            `;

            // ------ إضافة الروابط التابعة العشوائية ------
            if (index === 0 && Math.random() < 0.3) {
                const affiliate = affiliateLinks[Math.floor(Math.random() * affiliateLinks.length)];
                const link = document.createElement('a');
                link.href = affiliate.url;
                link.textContent = affiliate.text;
                link.target = '_blank';
                colorCard.appendChild(link);
            }

            // ------ نسخ اللون عند النقــر ------
            colorCard.addEventListener('click', () => {
                navigator.clipboard.writeText(color);
                showToast(`تم نسخ اللون: ${color}`);
            });

            paletteContainer.appendChild(colorCard);
        });
    }

    // ------ تحسين التجاوب مع تغيير الحجم ------
    window.addEventListener('resize', () => {
        document.body.style.fontSize = window.innerWidth < 480 ? "14px" : "16px";
    });
});