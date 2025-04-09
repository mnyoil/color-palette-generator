document.addEventListener('DOMContentLoaded', () => {
    // ------ التحقق من دعم المتصفح ------
    if (!window.FileReader || !window.Blob || !window.URL || !navigator.clipboard) {
        alert("متصفحك لا يدعم بعض الميزات الضرورية (مثل File API أو Clipboard API). يُرجى التحديث للحصول على أفضل تجربة.");
        // يمكنك تعطيل الميزات التي تعتمد على الـ API المفقود هنا
        // return; // قد لا ترغب في إيقاف كل شيء إذا كانت بعض الميزات لا تزال تعمل
    }

    // ------ العناصر الرئيسية ------
    const colorCountSelect = document.getElementById('colorCount');
    const imageUpload = document.getElementById('imageUpload');
    const paletteContainer = document.getElementById('paletteContainer');
    const loading = document.getElementById('loading');
    // لا حاجة لـ lastGeneratedColors إذا كنا نعرض دائماً من كلا المكتبتين

    // ------ إعدادات الروابط التابعة (مثال) ------
    const affiliateLinks = [
        { url: 'https://coolors.co/?ref=yourApp', text: 'أنشئ باليتات متقدمة على Coolors →' },
        { url: 'https://adobe.com/color?ref=yourApp', text: 'استكشف تناسقات الألوان مع Adobe →' }
    ];

    // ------ دالة تحويل RGB إلى HEX (تم التصحيح والتأكيد) ------
    function rgbToHex(r, g, b) {
        // التأكد من أن القيم ضمن النطاق 0-255 (احتياطي)
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        // التحويل إلى HEX مع padStart وتكبير الأحرف
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    // ------ دالة عرض Toast ------
    function showToast(message) {
        // إزالة أي رسالة توست قديمة أولاً
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        // استخدام requestAnimationFrame لتطبيق الانتقال بعد إضافة العنصر
        requestAnimationFrame(() => {
           toast.style.opacity = 1; // يمكن التحكم بالشفافية عبر CSS أو JS
        });

        setTimeout(() => {
             toast.style.opacity = 0; // بدء التلاشي
             // إزالة العنصر بعد انتهاء الانتقال
             toast.addEventListener('transitionend', () => toast.remove());
             // احتياطي في حال لم يتم تشغيل transitionend
             setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
        }, 2500); // مدة بقاء الرسالة قبل بدء التلاشي
    }


    // ------ معالجة تحميل الصورة (مدمج مع Vibrant.js و ColorThief) ------
    imageUpload.addEventListener('change', async function(e) { // جعل الدالة async
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) { // التحقق من نوع الملف
             if (file) showToast("يرجى اختيار ملف صورة صالح.");
             return;
         }

        loading.style.display = 'block';
        paletteContainer.innerHTML = ''; // مسح النتائج السابقة

        const img = new Image();
        img.crossOrigin = 'Anonymous'; // ضروري لـ ColorThief إذا كانت الصور من مصادر خارجية
        const reader = new FileReader();

        reader.onload = function(event) {
            img.src = event.target.result; // استخدام Data URL

            img.onload = async () => { // جعل دالة onload الداخلية async
                // إخفاء التحميل عند بدء المعالجة الفعلية بعد تحميل الصورة
                loading.style.display = 'none';
                let hasExtractedColors = false;

                try {
                    // ------ استخراج الألوان باستخدام ColorThief ------
                    console.log("Attempting ColorThief extraction...");
                    const colorThief = new ColorThief();
                    const colorCount = parseInt(colorCountSelect.value);
                    const palette = colorThief.getPalette(img, colorCount);
                    console.log("ColorThief Raw Palette:", palette);
                    if (palette && palette.length > 0) {
                        const colors = palette.map(color => rgbToHex(...color));
                        console.log("ColorThief HEX Colors:", colors);
                        renderPalette(colors, 'ColorThief');
                        hasExtractedColors = true;
                    } else {
                         console.warn("ColorThief did not return a palette.");
                     }

                } catch (err) {
                    console.error("ColorThief Error:", err);
                    showToast("حدث خطأ أثناء استخراج الألوان باستخدام ColorThief.");
                }

                try {
                    // ------ استخراج الألوان باستخدام Vibrant.js ------
                     console.log("Attempting Vibrant.js extraction...");
                     // تأكد من أن الصورة مرئية أو لها أبعاد قبل استخدام Vibrant.js
                     // (عادة ما يكون img.onload كافيًا، لكن يمكن إضافة تحقق إضافي)
                     if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                         const vibrant = new Vibrant(img);
                         // زيادة عدد الألوان المستهدفة إذا لزم الأمر (اختياري)
                         // const vibrant = new Vibrant(img, { quality: 1, colorCount: 256 });
                         const vibrantPalette = await vibrant.swatches(); // استخدام await هنا
                         console.log("Vibrant Raw Palette:", vibrantPalette);
                         if (vibrantPalette && Object.keys(vibrantPalette).length > 0) {
                             const vibrantColors = Object.values(vibrantPalette)
                                 .filter(swatch => swatch) // التأكد من أن swatch ليس null
                                 .map(swatch => swatch.hex.toUpperCase()); // الحصول على HEX مباشرة وتكبيره
                             console.log("Vibrant HEX Colors:", vibrantColors);
                             renderPalette(vibrantColors, 'Vibrant.js');
                             hasExtractedColors = true;
                         } else {
                             console.warn("Vibrant.js did not return any swatches.");
                         }
                     } else {
                         console.warn("Image has no dimensions, skipping Vibrant.js.");
                     }

                } catch (err) {
                    console.error("Vibrant.js Error:", err);
                    // تجنب عرض رسالة خطأ مكررة إذا فشل ColorThief أيضًا
                    if (!hasExtractedColors) {
                       showToast("حدث خطأ أثناء استخراج الألوان باستخدام Vibrant.js.");
                    } else {
                       showToast("لم يتمكن Vibrant.js من استخراج ألوان إضافية.");
                    }
                }

                 // عرض رسالة إذا لم يتم استخراج أي ألوان
                 if (!hasExtractedColors) {
                     showToast("تعذر استخراج الألوان من هذه الصورة. قد تكون الصورة بسيطة جدًا أو حدث خطأ.");
                     paletteContainer.innerHTML = '<p style="color: #666;">لم يتم العثور على ألوان بارزة.</p>'; // رسالة بديلة
                 }

                 // تحرير الـ Object URL إذا تم استخدامه سابقاً (الآن نستخدم Data URL فلا حاجة لذلك)
                 // if (img.src.startsWith('blob:')) { URL.revokeObjectURL(img.src); }

            };

            img.onerror = () => {
                loading.style.display = 'none';
                showToast("خطأ في تحميل الصورة! تأكد من أن الملف غير تالف.");
                 // تحرير الـ Object URL إذا تم استخدامه سابقاً
                 // if (img.src.startsWith('blob:')) { URL.revokeObjectURL(img.src); }
            };
        }

         reader.onerror = () => {
             loading.style.display = 'none';
             showToast("خطأ في قراءة ملف الصورة.");
         };

         // قراءة الملف كـ Data URL
         reader.readAsDataURL(file);
    });


    // ------ دالة عرض الباليت (مُحدَّثة لعرض المصدر) ------
    function renderPalette(colors, source) {
        if (!colors || colors.length === 0) return; // لا تفعل شيئًا إذا لم تكن هناك ألوان

        colors.forEach((color, index) => {
            // التحقق من أن اللون هو صيغة HEX صالحة (بسيط)
            if (!/^#[0-9A-F]{6}$/i.test(color)) {
                console.warn(`Invalid color format from ${source}: ${color}`);
                return; // تخطي الألوان غير الصالحة
            }

            const colorCard = document.createElement('div');
            colorCard.className = 'color-card';
            try {
               colorCard.style.backgroundColor = color;
            } catch (e) {
                 console.error(`Failed to set background color ${color}:`, e);
                 return; // تخطي إذا فشل تطبيق اللون
            }

            // تحديد لون النص (أبيض أو أسود) للتباين
            const contrastColor = getContrastYIQ(color);
            colorCard.style.color = contrastColor; // تطبيق لون النص للتباين
            // قد تحتاج لتعديل ظل النص بناءً على لون التباين أيضًا
            colorCard.style.textShadow = contrastColor === '#000000'
                 ? '1px 1px 2px rgba(255,255,255,0.5)' // ظل فاتح للنص الأسود
                 : '1px 1px 3px rgba(0,0,0,0.6)'; // ظل غامق للنص الأبيض

            colorCard.innerHTML = `
                <div style="font-weight: bold;">${color}</div>
                <small>${source}</small>
            `; // عرض المصدر أسفل اللون

            // ------ إضافة الروابط التابعة بشكل أقل تكرارًا (مثال) ------
             if (paletteContainer.children.length === 0 && index === 0 && Math.random() < 0.3) { // فقط لأول بطاقة وفي بعض الأحيان
                 const affiliate = affiliateLinks[Math.floor(Math.random() * affiliateLinks.length)];
                 const link = document.createElement('a');
                 link.href = affiliate.url;
                 link.textContent = affiliate.text;
                 link.target = '_blank';
                 link.rel = 'noopener noreferrer sponsored'; // مهم للروابط التابعة والإعلانية
                 link.style.color = contrastColor; // جعل الرابط بنفس لون التباين
                 link.style.background = contrastColor === '#000000' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
                 colorCard.appendChild(link);
             }

            // ------ نسخ اللون عند النقــر ------
            colorCard.addEventListener('click', () => {
                 if (navigator.clipboard) {
                     navigator.clipboard.writeText(color)
                         .then(() => {
                             showToast(`✅ تم نسخ اللون: ${color}`);
                         })
                         .catch(err => {
                             console.error('Clipboard write failed: ', err);
                             showToast(`❌ فشل نسخ اللون`);
                         });
                 } else {
                     // حل بديل للمتصفحات القديمة جداً (أقل شيوعاً الآن)
                     try {
                         const textArea = document.createElement("textarea");
                         textArea.value = color;
                         textArea.style.position = "fixed"; // لمنع التمرير
                         document.body.appendChild(textArea);
                         textArea.focus();
                         textArea.select();
                         document.execCommand('copy');
                         document.body.removeChild(textArea);
                         showToast(`✅ تم نسخ اللون: ${color} (بديل)`);
                     } catch (err) {
                         showToast(`❌ فشل النسخ التلقائي`);
                     }
                 }
            });

            paletteContainer.appendChild(colorCard);
        });
    }

     // ------ دالة لتحديد لون النص بناءً على خلفية اللون (YIQ) ------
     function getContrastYIQ(hexcolor){
         hexcolor = hexcolor.replace("#", "");
         const r = parseInt(hexcolor.substr(0,2),16);
         const g = parseInt(hexcolor.substr(2,2),16);
         const b = parseInt(hexcolor.substr(4,2),16);
         const yiq = ((r*299)+(g*587)+(b*114))/1000;
         // العتبة يمكن تعديلها (عادة 128 أو 150 أو 186)
         return (yiq >= 150) ? '#000000' : '#FFFFFF';
     }

    // ------ تحسين التجاوب الأولي مع تغيير الحجم (يمكن إزالته إذا كان CSS كافيًا) ------
    // window.addEventListener('resize', () => {
    //     // قد تحتاج إلى منطق أكثر تعقيدًا هنا إذا لزم الأمر
    //     // CSS media queries هي الطريقة المفضلة عادةً
    //     // document.body.style.fontSize = window.innerWidth < 480 ? "14px" : "16px"; // مثال بسيط
    // });

    // // استدعاء أولي للتحجيم (إذا كنت تستخدم JS للتحجيم)
    // if (window.dispatchEvent) { // التأكد من وجود الدالة
    //     window.dispatchEvent(new Event('resize'));
    // }

    console.log("Color Palette Generator Initialized!"); // رسالة تأكيد في الكونسول
});