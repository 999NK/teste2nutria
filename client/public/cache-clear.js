// Force cache clear on load
if ('caches' in window) {
  caches.keys().then(function(names) {
    names.forEach(function(name) {
      caches.delete(name);
    });
  });
}

// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Force hard reload
window.location.reload(true);