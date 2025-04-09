document.addEventListener('DOMContentLoaded', () => {
    // ------ التحقق من دعم المتصفح ------
    if (!window.FileReader || !window.Blob || !window.URL || !navigator.clipboard) {
        alert("متصفحك لا يدعم بعض الميزات الضرورية (مثل File API أو Clipboard API). يُرجى التحديث للحصول على أفضل تجربة.");
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

    // ------ دالة عرض Toast ------
    function showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = 1;
        });

        setTimeout(() => {
            toast.style.opacity = 0;
            toast.addEventListener('transitionend', () => toast.remove());
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
        }, 2500);
    }

    // ------ معالجة تحميل الصورة ------
    imageUpload.addEventListener('change', async function (e) {
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

        reader.onload = function (event) {
            img.src = event.target.result;

            img.onload = async () => {
                loading.style.display = 'none';
                let hasExtractedColors = false;

                try {
                    // ------ استخراج الألوان باستخدام ColorThief ------
                    console.log("Attempting ColorThief extraction...");
                    const colorThief = new ColorThief();
                    const colorCount = parseInt(colorCountSelect.value);
                    const palette = colorThief.getPalette(img, colorCount);
                    if (palette && palette.length > 0) {
                        const colors = palette.map(color => rgbToHex(...color));
                        renderPalette(colors, 'ColorThief');
                        hasExtractedColors = true;
                    }
                } catch (err) {
                    console.error("ColorThief Error:", err);
                    showToast("حدث خطأ أثناء استخراج الألوان باستخدام ColorThief.");
                }

                try {
                    // ------ استخراج الألوان باستخدام Vibrant.js ------
                    console.log("Attempting Vibrant.js extraction...");
                    const vibrant = new Vibrant(img);
                    const vibrantPalette = await vibrant.swatches();
                    if (vibrantPalette && Object.keys(vibrantPalette).length > 0) {
                        const vibrantColors = Object.values(vibrantPalette)
                            .filter(swatch => swatch)
                            .map(swatch => swatch.hex.toUpperCase());
                        renderPalette(vibrantColors, 'Vibrant.js');
                        hasExtractedColors = true;
                    }
                } catch (err) {
                    console.error("Vibrant.js Error:", err);
                    if (!hasExtractedColors) {
                        showToast("حدث خطأ أثناء استخراج الألوان باستخدام Vibrant.js.");
                    }
                }

                if (!hasExtractedColors) {
                    showToast("تعذر استخراج الألوان من هذه الصورة.");
                    paletteContainer.innerHTML = '<p style="color: #666;">لم يتم العثور على ألوان بارزة.</p>';
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

    // ------ دالة عرض الباليت ------
    function renderPalette(colors, source) {
        if (!colors || colors.length === 0) return;

        colors.forEach((color) => {
            const colorCard = document.createElement('div');
            colorCard.className = 'color-card';
            colorCard.style.backgroundColor = color;
            const contrastColor = getContrastYIQ(color);
            colorCard.style.color = contrastColor;
            colorCard.innerHTML = `<div style="font-weight: bold;">${color}</div><small>${source}</small>`;
            paletteContainer.appendChild(colorCard);
        });
    }

    // ------ دالة لتحديد لون النص بناءً على خلفية اللون ------
    function getContrastYIQ(hexcolor) {
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 150) ? '#000000' : '#FFFFFF';
    }

    console.log("Color Palette Generator Initialized!");
});