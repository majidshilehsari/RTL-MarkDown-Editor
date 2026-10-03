// متن‌های نمونه برای هر زبان

const fa = `سلام! حتماً. یک جدول از رنگ‌ها به همراه کدهای عددی‌شون (RGB، Hex و نام رنگ) برات آماده کردم و کد HTML کاملش رو هم نوشتم.

## جدول رنگ‌ها و کدهای عددی

| نام رنگ | کد Hex | کد RGB | نمونه رنگ |
|---------|--------|--------|-----------|
| قرمز (Red) | #FF0000 | rgb(255, 0, 0) | 🔴 |
| سبز (Green) | #00FF00 | rgb(0, 255, 0) | 🟢 |
| آبی (Blue) | #0000FF | rgb(0, 0, 255) | 🔵 |
| زرد (Yellow) | #FFFF00 | rgb(255, 255, 0) | 🟡 |
| نارنجی (Orange) | #FFA500 | rgb(255, 165, 0) | 🟠 |
| بنفش (Purple) | #800080 | rgb(128, 0, 128) | 🟣 |
| صورتی (Pink) | #FFC0CB | rgb(255, 192, 203) | 🌸 |
| مشکی (Black) | #000000 | rgb(0, 0, 0) | ⚫ |
| سفید (White) | #FFFFFF | rgb(255, 255, 255) | ⚪ |
| خاکستری (Gray) | #808080 | rgb(128, 128, 128) | 🩶 |

## کد HTML کامل

\`\`\`html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>جدول رنگ‌ها و کدهای عددی</title>
    <style>
        body {
            font-family: 'Tahoma', sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            padding: 40px 20px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            max-width: 700px;
            background-color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            overflow: hidden;
        }

        caption {
            font-size: 1.4em;
            font-weight: bold;
            padding: 15px;
            background-color: #333;
            color: #fff;
        }

        th, td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }

        thead th {
            background-color: #444;
            color: #fff;
            font-size: 1em;
        }

        tbody tr:hover {
            background-color: #f1f1f1;
        }

        .swatch {
            display: inline-block;
            width: 40px;
            height: 25px;
            border-radius: 5px;
            border: 1px solid #999;
        }

        /* رنگ نمونه‌ها */
        .red    { background-color: #FF0000; }
        .green  { background-color: #00FF00; }
        .blue   { background-color: #0000FF; }
        .yellow { background-color: #FFFF00; }
        .orange { background-color: #FFA500; }
        .purple { background-color: #800080; }
        .pink   { background-color: #FFC0CB; }
        .black  { background-color: #000000; }
        .white  { background-color: #FFFFFF; }
        .gray   { background-color: #808080; }
    </style>
</head>
<body>

    <table>
        <caption>🎨 جدول رنگ‌ها و کدهای عددی</caption>
        <thead>
            <tr>
                <th>نام رنگ</th>
                <th>کد Hex</th>
                <th>کد RGB</th>
                <th>نمونه رنگ</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>قرمز (Red)</td>
                <td>#FF0000</td>
                <td>rgb(255, 0, 0)</td>
                <td><span class="swatch red"></span></td>
            </tr>
            <tr>
                <td>سبز (Green)</td>
                <td>#00FF00</td>
                <td>rgb(0, 255, 0)</td>
                <td><span class="swatch green"></span></td>
            </tr>
            <tr>
                <td>آبی (Blue)</td>
                <td>#0000FF</td>
                <td>rgb(0, 0, 255)</td>
                <td><span class="swatch blue"></span></td>
            </tr>
            <tr>
                <td>زرد (Yellow)</td>
                <td>#FFFF00</td>
                <td>rgb(255, 255, 0)</td>
                <td><span class="swatch yellow"></span></td>
            </tr>
            <tr>
                <td>نارنجی (Orange)</td>
                <td>#FFA500</td>
                <td>rgb(255, 165, 0)</td>
                <td><span class="swatch orange"></span></td>
            </tr>
            <tr>
                <td>بنفش (Purple)</td>
                <td>#800080</td>
                <td>rgb(128, 0, 128)</td>
                <td><span class="swatch purple"></span></td>
            </tr>
            <tr>
                <td>صورتی (Pink)</td>
                <td>#FFC0CB</td>
                <td>rgb(255, 192, 203)</td>
                <td><span class="swatch pink"></span></td>
            </tr>
            <tr>
                <td>مشکی (Black)</td>
                <td>#000000</td>
                <td>rgb(0, 0, 0)</td>
                <td><span class="swatch black"></span></td>
            </tr>
            <tr>
                <td>سفید (White)</td>
                <td>#FFFFFF</td>
                <td>rgb(255, 255, 255)</td>
                <td><span class="swatch white"></span></td>
            </tr>
            <tr>
                <td>خاکستری (Gray)</td>
                <td>#808080</td>
                <td>rgb(128, 128, 128)</td>
                <td><span class="swatch gray"></span></td>
            </tr>
        </tbody>
    </table>

</body>
</html>
\`\`\`

### ویژگی‌های این کد:
- ✅ **راست‌چین (RTL)** برای زبان فارسی
- ✅ **نمونه رنگ واقعی** در کنار هر ردیف
- ✅ **افکت hover** روی ردیف‌ها
- ✅ **طراحی ریسپانسیو** و مدرن
- ✅ **کد Hex و RGB** هر رنگ

اگه بخوای می‌تونم رنگ‌های بیشتری اضافه کنم، یا ستون‌های دیگه‌ای (مثل کد HSL یا CMYK) هم بهش اضافه کنم. 😊
`;

const en = `Sure! Here is a table of colours with their numeric codes (name, Hex and RGB), plus the full HTML code for it.

## Colour table with numeric codes

| Colour name | Hex code | RGB code | Swatch |
|-------------|----------|----------|--------|
| Red | #FF0000 | rgb(255, 0, 0) | 🔴 |
| Green | #00FF00 | rgb(0, 255, 0) | 🟢 |
| Blue | #0000FF | rgb(0, 0, 255) | 🔵 |
| Yellow | #FFFF00 | rgb(255, 255, 0) | 🟡 |
| Orange | #FFA500 | rgb(255, 165, 0) | 🟠 |
| Purple | #800080 | rgb(128, 0, 128) | 🟣 |
| Pink | #FFC0CB | rgb(255, 192, 203) | 🌸 |
| Black | #000000 | rgb(0, 0, 0) | ⚫ |
| White | #FFFFFF | rgb(255, 255, 255) | ⚪ |
| Gray | #808080 | rgb(128, 128, 128) | 🩶 |

## Full HTML code

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Colour table</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            padding: 40px 20px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            max-width: 700px;
            background-color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            overflow: hidden;
        }

        th, td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }

        thead th { background-color: #444; color: #fff; }
        tbody tr:hover { background-color: #f1f1f1; }

        .swatch {
            display: inline-block;
            width: 40px;
            height: 25px;
            border-radius: 5px;
            border: 1px solid #999;
        }

        .red { background-color: #FF0000; }
        .green { background-color: #00FF00; }
        .blue { background-color: #0000FF; }
    </style>
</head>
<body>
    <table>
        <caption>🎨 Colour table</caption>
        <thead>
            <tr><th>Name</th><th>Hex</th><th>RGB</th><th>Swatch</th></tr>
        </thead>
        <tbody>
            <tr><td>Red</td><td>#FF0000</td><td>rgb(255, 0, 0)</td><td><span class="swatch red"></span></td></tr>
            <tr><td>Green</td><td>#00FF00</td><td>rgb(0, 255, 0)</td><td><span class="swatch green"></span></td></tr>
            <tr><td>Blue</td><td>#0000FF</td><td>rgb(0, 0, 255)</td><td><span class="swatch blue"></span></td></tr>
        </tbody>
    </table>
</body>
</html>
\`\`\`

### Features of this snippet:
- ✅ **Responsive** modern layout
- ✅ **Real colour swatches** next to every row
- ✅ **Hover effect** on rows
- ✅ **Hex and RGB** codes for each colour

Tell me if you want more colours, or extra columns such as HSL or CMYK. 😊
`;

const ar = `مرحباً! بالتأكيد. إليك جدولاً بالألوان مع أكوادها الرقمية (الاسم وHex وRGB)، مع كود HTML كامل له.

## جدول الألوان والأكواد الرقمية

| اسم اللون | كود Hex | كود RGB | عينة اللون |
|-----------|---------|---------|------------|
| أحمر (Red) | #FF0000 | rgb(255, 0, 0) | 🔴 |
| أخضر (Green) | #00FF00 | rgb(0, 255, 0) | 🟢 |
| أزرق (Blue) | #0000FF | rgb(0, 0, 255) | 🔵 |
| أصفر (Yellow) | #FFFF00 | rgb(255, 255, 0) | 🟡 |
| برتقالي (Orange) | #FFA500 | rgb(255, 165, 0) | 🟠 |
| بنفسجي (Purple) | #800080 | rgb(128, 0, 128) | 🟣 |
| وردي (Pink) | #FFC0CB | rgb(255, 192, 203) | 🌸 |
| أسود (Black) | #000000 | rgb(0, 0, 0) | ⚫ |
| أبيض (White) | #FFFFFF | rgb(255, 255, 255) | ⚪ |
| رمادي (Gray) | #808080 | rgb(128, 128, 128) | 🩶 |

## كود HTML الكامل

\`\`\`html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>جدول الألوان والأكواد الرقمية</title>
    <style>
        body {
            font-family: 'Tahoma', sans-serif;
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            padding: 40px 20px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            max-width: 700px;
            background-color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            overflow: hidden;
        }

        th, td {
            padding: 12px 15px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }

        thead th { background-color: #444; color: #fff; }
        tbody tr:hover { background-color: #f1f1f1; }

        .swatch {
            display: inline-block;
            width: 40px;
            height: 25px;
            border-radius: 5px;
            border: 1px solid #999;
        }

        .red { background-color: #FF0000; }
        .green { background-color: #00FF00; }
        .blue { background-color: #0000FF; }
    </style>
</head>
<body>
    <table>
        <caption>🎨 جدول الألوان</caption>
        <thead>
            <tr><th>الاسم</th><th>Hex</th><th>RGB</th><th>العينة</th></tr>
        </thead>
        <tbody>
            <tr><td>أحمر</td><td>#FF0000</td><td>rgb(255, 0, 0)</td><td><span class="swatch red"></span></td></tr>
            <tr><td>أخضر</td><td>#00FF00</td><td>rgb(0, 255, 0)</td><td><span class="swatch green"></span></td></tr>
            <tr><td>أزرق</td><td>#0000FF</td><td>rgb(0, 0, 255)</td><td><span class="swatch blue"></span></td></tr>
        </tbody>
    </table>
</body>
</html>
\`\`\`

### مزايا هذا الكود:
- ✅ **اتجاه من اليمين إلى اليسار (RTL)**
- ✅ **عينات ألوان حقيقية** بجانب كل صف
- ✅ **تأثير hover** على الصفوف
- ✅ **كود Hex وRGB** لكل لون

أخبرني إن أردت ألواناً إضافية أو أعمدة أخرى مثل HSL أو CMYK. 😊
`;

export const SAMPLES = { fa, en, ar };

export const getSample = (lang) => SAMPLES[lang] || SAMPLES.fa;
