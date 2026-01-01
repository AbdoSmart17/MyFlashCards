const CACHE_NAME = 'flashcards-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap'
];

// التثبيت - تخزين الملفات في ذاكرة التخزين المؤقت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تخزين الملفات في ذاكرة التخزين المؤقت');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// التنشيط - تنظيف الذاكرة القديمة
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('حذف ذاكرة التخزين المؤقت القديمة:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// الاسترجاع - تقديم الملفات المخزنة عند عدم الاتصال
self.addEventListener('fetch', event => {
  // تجاهل طلبات POST وغيرها من الطلبات غير GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا كان الملف موجودًا في الذاكرة المؤقتة، نرجعه
        if (response) {
          return response;
        }
        
        // إذا لم يكن موجودًا، نقوم بتحميله من الشبكة
        return fetch(event.request)
          .then(response => {
            // التحقق من أن الرد صالح للتخزين
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // استنساخ الرد
            const responseToCache = response.clone();
            
            // تخزين الملف في الذاكرة المؤقتة للمستقبل
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // إذا فشل الاتصال بالشبكة، نقوم بإرجاع صفحة بديلة
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// استقبال الرسائل من الصفحة الرئيسية
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});