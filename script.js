document.addEventListener('DOMContentLoaded', () => {
    // ------ التحقق من دعم المتصفح ------
    if (!window.FileReader || !window.Blob || !window.URL || !navigator.clipboard) {
        alert("متصفحك لا يدعم بعض الميزات الضرورية (مثل File API أو Clipboard API). يُرجى التحديث للحصول على أفضل تجربة.");
        return;
    }

    // ------ العناصر الرئيسية ------
    const colorCountSelect = document.getElementById('colorCount');
    const imageUpload = document.getElementById('imageUpload');
    const paletteContainer = document.getElementById('paletteContainer');
    const loading = document.getElementById('loading');

    // ------ إعدادات الروابط التابعة ------
    const affiliateLinks = [
        { url: 'https://coolors.co/?ref=yourApp', text: 'أنشئ باليتات متقدمة على Coolors →' },
        { url: 'https://adobe.com/color?ref=yourApp', text: 'استكشف تناسقات الألوان مع Adobe →' }
    ];

    // ------ دالة تحويل RGB إلى HEX ------
    function rgbToHex(r, g, b) {
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    // ------ دالة عرض Toast (محسنة) ------
    function showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 2000);
    }

    // ------ معالجة تحميل الصورة (مدمجة) ------
    imageUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            if (file) showToast("يرجى اختيار ملف صورة صالح.");
            return;
        }

        loading.style.display = 'block';
        paletteContainer.innerHTML = '';

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const reader = new FileReader();

        reader.onload = async (event) => {
            img.src = event.target.result;

            img.onload = async () => {
                let hasExtractedColors = false;

                // ------ استخراج الألوان باستخدام ColorThief ------
                try {
                    const colorThief = new ColorThief();
                    const palette = colorThief.getPalette(img, parseInt(colorCountSelect.value));
                    if (palette?.length > 0) {
                        const colors = palette.map(color => rgbToHex(...color));
                        renderPalette(colors, 'ColorThief');
                        hasExtractedColors = true;
                    }
                } catch (err) {
                    console.error("ColorThief Error:", err);
                }

                // ------ استخراج الألوان باستخدام Vibrant.js ------
                try {
                    const vibrant = new Vibrant(img);
                    const vibrantPalette = await vibrant.swatches();
                    const vibrantColors = Object.values(vibrantPalette)
                        .filter(c => c)
                        .map(c => c.hex.toUpperCase());
                    
                    if (vibrantColors.length > 0) {
                        renderPalette(vibrantColors, 'Vibrant.js');
                        hasExtractedColors = true;
                    }
                } catch (err) {
                    console.error("Vibrant.js Error:", err);
                }

                loading.style.display = 'none';
                if (!hasExtractedColors) {
                    showToast("تعذر استخراج الألوان من هذه الصورة.");
                    paletteContainer.innerHTML = '<p style="color: #666; text-align: center;">لم يتم العثور على ألوان بارزة.</p>';
                }
            };

            img.onerror = () => {
                loading.style.display = 'none';
                showToast("خطأ في تحميل الصورة! تأكد من أن الملف غير تالف.");
            };
        };

        reader.onerror = () => {
            loading.style.display = 'none';
            showToast("خطأ في قراءة ملف الصورة.");
        };

        reader.readAsDataURL(file);
    });

    // ------ دالة عرض الباليت (مُحسَّنة) ------
    function renderPalette(colors, source) {
        colors.forEach((color, index) => {
            const colorCard = document.createElement('div');
            colorCard.className = 'color-card';
            colorCard.style.backgroundColor = color;
            
            // تحديد لون النص تلقائيًا
            const textColor = getContrastYIQ(color);
            colorCard.style.color = textColor;
            
            // محتوى البطاقة
            colorCard.innerHTML = `
                <div class="color-code">${color}</div>
                <small class="source">${source}</small>
            `;

            // إضافة روابط تابعة عشوائية
            if (index === 0 && Math.random() < 0.3) {
                const affiliate = affiliateLinks[Math.floor(Math.random() * affiliateLinks.length)];
                const link = document.createElement('a');
                link.href = affiliate.url;
                link.textContent = affiliate.text;
                link.target = '_blank';
                link.style.color = textColor;
                colorCard.appendChild(link);
            }

            // نسخ اللون عند النقر
            colorCard.addEventListener('click', () => {
                navigator.clipboard.writeText(color);
                showToast(`تم نسخ اللون: ${color}`);
            });

            paletteContainer.appendChild(colorCard);
        });
    }

    // ------ دالة تحديد لون النص بناءً على الخلفية ------
    function getContrastYIQ(hexcolor) {
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 150 ? '#000' : '#fff';
    }

    console.log("تم تهيئة مولد الألوان بنجاح!");
});