// Force cache invalidation
const timestamp = Date.now();
document.documentElement.setAttribute('data-cache-buster', timestamp);
console.log('Cache buster activated:', timestamp);