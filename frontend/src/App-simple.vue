<template>
  <div id="app" style="padding: 20px;">
    <h1 style="color: green;">🎉 App.vue está funcionando!</h1>
    <p>Se você vê esta mensagem, o Vue está carregando corretamente.</p>
    <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
      <strong>Debug Info:</strong>
      <br>Auth Store: {{ authStore ? 'Carregado' : 'Não carregado' }}
      <br>Router: {{ $router ? 'Carregado' : 'Não carregado' }}
      <br>Route atual: {{ $route?.path || 'Nenhuma' }}
    </div>
  </div>
</template>

<script setup>
console.log('🚀 App.vue SIMPLES carregando...')

try {
  import { useAuthStore } from '@/stores/auth'
  const authStore = useAuthStore()
  console.log('✅ Auth store carregado')
} catch (error) {
  console.error('❌ Erro no auth store:', error)
}

console.log('✅ App.vue SIMPLES carregado com sucesso!')
</script>

<style>
#app {
  font-family: Arial, sans-serif;
}
</style>