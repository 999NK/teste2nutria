// Script para limpar todos os caches e forçar atualização
(function() {
  console.log('Iniciando limpeza completa de cache...');
  
  // Limpar service worker e todos os caches
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        console.log('Removendo service worker:', registration);
        registration.unregister();
      }
    });
  }
  
  // Limpar todos os caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        console.log('Removendo cache:', name);
        caches.delete(name);
      });
    });
  }
  
  // Limpar localStorage e sessionStorage
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Storage limpo');
  } catch(e) {
    console.log('Erro ao limpar storage:', e);
  }
  
  // Recarregar com cache bypass
  setTimeout(function() {
    console.log('Recarregando página...');
    window.location.reload(true);
  }, 1000);
})();