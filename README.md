# آشپزخانه‌ی لوو — وب‌اپ موبایل

کتاب آشپزی نان‌های خمیرترش لوو. ۳۰ دستور پخت، مرتب‌شده بر اساس **نان** و **وعده**، با
امکان نصب روی گوشی (PWA) و کارکرد آفلاین.

## فایل‌ها

| فایل | کارش چیست |
|---|---|
| `artifact.html` | **سرچشمه‌ی کد.** همه‌ی ویرایش‌ها اینجا انجام می‌شود (استایل + داده‌ها + جاوااسکریپت). |
| `index.html` | خروجیِ ساخته‌شده برای میزبانی. **دستی ویرایشش نکنید** — با هر بیلد بازنویسی می‌شود. |
| `manifest.webmanifest` | تعریف اپ برای نصب روی گوشی (نام، آیکن، رنگ، حالت standalone). |
| `sw.js` | سرویس‌ورکر؛ اپ را آفلاین در دسترس نگه می‌دارد. |
| `icon-*.png` / `apple-touch-icon.png` | آیکن‌های اپ. |
| `build/make-icons.js` | آیکن‌ها را از صفر می‌سازد (بدون هیچ وابستگی). |
| `build/build.js` | `artifact.html` را به `index.html` قابل‌نصب تبدیل می‌کند. |
| `build/serve.js` | سرور محلی برای تست. |

## ویرایش دستورها

همه‌ی محتوا داخل `artifact.html` در آرایه‌های `BREADS` و `RECIPES` است.

```js
{ id: "r31", bread: "b6", meals: ["شام"], art: "pizza", time: 25, serves: 2, level: "آسان",
  title: "…", sub: "…",
  ing: [["نام ماده", "مقدار"], …],
  steps: ["مرحله‌ی اول", …],
  tip: "نکته‌ی لوو" }
```

- `bread` باید یکی از `id`های `BREADS` باشد.
- `meals` از این فهرست: صبحانه، ناهار، شام، سوپ و سالاد، میان‌وعده، مهمانی، شیرین.
- `art` یکی از کلیدهای شیء `ART`: loaf, baguette, focaccia, dough, toastloaf, toast,
  frenchtoast, sandwich, opensandwich, tartine, pizza, calzone, knots, bowl, salad,
  board, egg, casserole, sweet.

بعد از هر ویرایش:

```bash
node build/build.js
```

## تست محلی

```bash
node build/serve.js
```

بعد `http://localhost:4173` را باز کنید.

## انتشار روی دامنه‌ی خودتان

کل پوشه (به‌جز `build/`) را روی هر میزبان استاتیکی آپلود کنید — Netlify Drop، GitHub Pages،
Cloudflare Pages، یا هاست معمولی. دو نکته:

1. حتماً روی **HTTPS** باشد، وگرنه سرویس‌ورکر اجرا نمی‌شود و اپ قابل نصب نخواهد بود.
2. اگر اپ را در زیرپوشه گذاشتید (`example.com/kitchen/`)، مسیرهای نسبی همان‌طور کار می‌کنند.

هر بار که `index.html` یا آیکن‌ها عوض شدند، مقدار `CACHE` در `sw.js` را یک شماره جلو ببرید
تا کش کاربران قدیمی پاک شود.

## تنظیمات

- لینک سفارش: ثابتِ `ORDER_URL` در بالای اسکریپت `artifact.html`.
- رنگ‌ها و فونت‌ها: توکن‌های `:root` در ابتدای `artifact.html` (همان پالت برند لوو —
  تراکوتا، زنگاری، کرم، جوهری؛ فونت‌های Lalezar و Vazirmatn).

## نسخه‌ی آنلاین

https://claude.ai/artifact/EHmSjkqcHX8Cvoi9Y7Cv3Z
