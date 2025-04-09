document.addEventListener('DOMContentLoaded', function () {
  // التحقق من دعم المتصفح
  if (!window.FileReader || !window.Blob || !window.URL) {
    alert("متصفحك لا يدعم بعض الميزات الضرورية. يُرجى التحديث للحصول على أفضل تجربة.");
    return;
  }

  // العناصر الرئيسية
  const colorCountSelect = document.getElementById('colorCount');
  const imageUpload = document.getElementById('imageUpload');
  const paletteContainer = document.getElementById('paletteContainer');
  const loading = document.getElementById('loading');

  // متغير لتخزين الألوان
  let lastGeneratedColors = [];

  // حدث تحميل الصورة
  imageUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    loading.style.display = 'block';
    paletteContainer.innerHTML = '';

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = URL.createObjectURL(file);

    img.onload = function () {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, parseInt(colorCountSelect.value));
        
        lastGeneratedColors = palette.map(color => `rgb(${color.join(',')})`);
        renderPalette(lastGeneratedColors);
        loading.style.display = 'none';
      } catch (err) {
        alert("تعذر استخراج الألوان. يرجى تجربة صورة أخرى.");
        loading.style.display = 'none';
      }
    };

    img.onerror = () => {
      alert("خطأ في تحميل الصورة!");
      loading.style.display = 'none';
    };
  });

  // دالة عرض الباليت
  function renderPalette(colors) {
    colors.forEach(color => {
      const colorBox = document.createElement('div');
      colorBox.className = 'color-box';
      colorBox.style.backgroundColor = color;
      
      // نسخ الكود عند النقر
      colorBox.onclick = () => {
        navigator.clipboard.writeText(color);
        alert("تم نسخ اللون: " + color);
      };
      
      paletteContainer.appendChild(colorBox);
    });
  }

  // دالة التجاوب
  window.addEventListener('resize', () => {
    document.body.style.fontSize = window.innerWidth < 480 ? "14px" : "16px";
  });
});