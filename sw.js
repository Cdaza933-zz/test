// Listen for install event, set callback
self.addEventListener('install', function(event) {
    // Perform some task
    e.waitUntil(
    caches.open('test_cache').then(cache => { cache.addAll(['/index.html','/images','/styles/inline.css', 'scripts/app.js'])})
      );
}); 
