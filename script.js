document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const paletteContainer = document.getElementById('paletteContainer');
    const loading = document.getElementById('loading');
    let copiedColors = JSON.parse(localStorage.getItem('popularColors')) || [];

    // ------ إعدادات الروابط التابعة ------
    const affiliateLinks = [
        { url: 'https://coolors.co/?ref=yourID', text: 'أنشئ باليتات متقدمة على Coolors →' },
        { url: 'https://adobe.com/color?ref=yourID', text: 'تصميم متقدم مع أدوبي كولور →' }
    ];

    // ------ دالة تحويل RGB إلى HEX -------
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            return x.toString(16).padStart(2, '0');
        }).join('').toUpperCase();
    }

    // ------ دالة حساب التباين ------
    function getContrast(r, g, b) {
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance > 0.5 ? 'داكن' : 'فاتح';
    }

    // ------ دالة عرض Toast ------
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ------ دالة مشاركة تويتر ------
    function shareOnTwitter(hex) {
        const tweetText = `اكتشفت هذا اللون الرائع ${hex} على موقع ${window.location.href}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(url, '_blank');
    }

    // ------ معالجة تحميل الصورة ------
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        loading.style.display = 'block';
        paletteContainer.innerHTML = '';

        img.onerror = () => {
            loading.style.display = 'none';
            showToast('حدث خطأ في تحميل الصورة!');
        };

        img.onload = async () => {
            try {
                // ------ استخراج الألوان باستخدام Vibrant.js ------
                const vibrant = new Vibrant(img);
                const palette = await vibrant.swatches();
                const colors = Object.values(palette).filter(c => c).map(c => c.rgb);

                colors.forEach((color) => {
                    const [r, g, b] = color;
                    const hexColor = rgbToHex(r, g, b);
                    
                    // ------ إنشاء بطاقة اللون ------
                    const colorCard = document.createElement('div');
                    colorCard.className = 'color-card';
                    colorCard.style.backgroundColor = `rgb(${r},${g},${b})`;
                    
                    // ------ تحذيرات التباين ------
                    if (r + g + b < 100) {
                        colorCard.style.border = '2px solid #ff0000';
                        colorCard.title = 'تحذير: هذا اللون قد لا يكون مناسبًا للقراءة!';
                    }

                    // ------ محتوى البطاقة ------
                    colorCard.innerHTML = `
                        <div>${hexColor}</div>
                        <div>RGB: ${r}, ${g}, ${b}</div>
                        <div>التباين: ${getContrast(r, g, b)}</div>
                    `;

                    // ------ إضافة الروابط التابعة ------
                    if (Math.random() < 0.3) {
                        const affiliate = affiliateLinks[Math.floor(Math.random() * affiliateLinks.length)];
                        const affiliateLink = document.createElement('a');
                        affiliateLink.href = affiliate.url;
                        affiliateLink.textContent = affiliate.text;
                        affiliateLink.target = '_blank';
                        colorCard.appendChild(affiliateLink);
                    }

                    // ------ أحداث النقر ------
                    colorCard.addEventListener('click', () => {
                        navigator.clipboard.writeText(hexColor);
                        copiedColors.push(hexColor);
                        localStorage.setItem('popularColors', JSON.stringify(copiedColors));
                        showToast(`تم نسخ اللون: ${hexColor}`);
                        shareOnTwitter(hexColor);
                    });

                    paletteContainer.appendChild(colorCard);
                });

                // ------ تحليل الصورة بالذكاء الاصطناعي ------
                const aiAnalysis = await analyzeImageWithAI(img.src);
                console.log('AI Analysis:', aiAnalysis);

            } catch (error) {
                showToast('حدث خطأ في المعالجة!');
            } finally {
                loading.style.display = 'none';
            }
        };
    });

    // ------ دالة تحليل الصورة بالذكاء الاصطناعي ------
    async function analyzeImageWithAI(imageUrl) {
        try {
            const response = await fetch('https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32', {
                headers: { 
                    'Authorization': 'Bearer YOUR_API_KEY',
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({ inputs: imageUrl }),
            });
            return await response.json();
        } catch (error) {
            console.error('AI Error:', error);
            return null;
        }
    }

    // ------ زر التصدير كصورة ------
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.textContent = '💾 حفظ الباليتة كصورة';
    exportBtn.addEventListener('click', () => {
        html2canvas(paletteContainer).then(canvas => {
            const link = document.createElement('a');
            link.download = 'color-palette.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    });
    document.body.appendChild(exportBtn);
});