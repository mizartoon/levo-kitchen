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

## سینک با اسنپ‌فود

قیمت و موجودی از یک فایل جدا (`data/prices.json`) در زمانِ باز شدنِ اپ خوانده می‌شود —
مستقل از `index.html`، پس آپدیت‌کردنش نیازی به `node build/build.js` ندارد؛ فقط
`data/prices.json` عوض می‌شود و push می‌شود.

**نکته‌ی مهم:** `snappfood.ir` فقط با IP ایران باز می‌شود. هیچ‌کدام از ابزارهای من
(نه ترمینال، نه مرورگر) به IP ایران دسترسی ندارند — تست شد و روی هرسه (curl،
PowerShell، کروم واقعی) با `ERR_TIMED_OUT` قطع شد. یعنی:

- ❌ من نمی‌توانم اسکریپتِ سینک را خودم اجرا یا تست کنم.
- ❌ GitHub Actions هم کار نمی‌کند (سرورهایش خارج از ایران‌اند).
- ✅ فقط از **کامپیوتر خودت** (یا هر سرور با IP ایران) کار می‌کند.

### راه‌اندازی (یک‌بار)

۱. یک نمونه‌ی واقعی از صفحه‌ی منو بگیر تا پارسر با ساختار واقعی کالیبره شود: در
   کروم روی لینک منو، `Ctrl+S` → نوع «Webpage, HTML Only» → ذخیره در همین پوشه با
   نام `snappfood-sample.html`.

۲. تست کن:
   ```bash
   node build/sync-snappfood.js --file=snappfood-sample.html --dump
   ```
   کنسول می‌گوید کدام نان‌ها پیدا/گم شدند. اگر اسمِ آیتمی در اسنپ‌فود با آنچه در
   `build/snappfood-map.json` نوشته شده فرق دارد، همان‌جا اصلاحش کن (یا از
   `build/sync-debug-lines.txt` — که با `--dump` ساخته می‌شود — متن دقیقِ صفحه را
   ببین).

۳. وقتی روی فایل محلی درست کار کرد، همان را روی صفحه‌ی زنده اجرا کن (بدون
   `--file`، چون این‌بار از خودِ اینترنتِ تو با IP ایران می‌خواند):
   ```bash
   node build/sync-snappfood.js
   ```
   اگر خروجی درست بود، `data/prices.json` را با `git add/commit/push` دستی
   بفرست، یا مستقیم با `--commit` بگذار خودش این کار را بکند:
   ```bash
   node build/sync-snappfood.js --commit
   ```

### اجرای خودکار و مستمر

برای این‌که هر چند ساعت خودش اجرا شود (بدون این‌که خودت هر بار دستور بزنی)، در
یک PowerShell معمولی (نه از طریق من):

```powershell
cd "D:\Projects\Levo\levo-kitchen"
powershell -ExecutionPolicy Bypass -File build\schedule-sync.ps1 -IntervalHours 3
```

این یک Task در Task Scheduler ویندوز می‌سازد که هر ۳ ساعت (قابل تغییر با
`-IntervalHours`) اسکریپت را اجرا و در صورت تغییر، push می‌کند — **فقط وقتی این
کامپیوتر روشن و آنلاین باشد.** برای اجرای فوری یک‌بار:
`Start-ScheduledTask -TaskName "LevoSnappfoodSync"`. برای حذفش:
`powershell -ExecutionPolicy Bypass -File build\unschedule-sync.ps1`.

اگر می‌خواهی این کاملاً مستقل از کامپیوتر شخصی‌ات و ۲۴ ساعته باشد، تنها راه یک
سرور/VPS با IP ایران است که همین اسکریپت را روی آن با یک cron job زمان‌بندی کنی؛
GitHub Actions یا هر سرویس ابری خارجی گزینه نیست.

## نسخه‌ی آنلاین

https://claude.ai/artifact/EHmSjkqcHX8Cvoi9Y7Cv3Z
