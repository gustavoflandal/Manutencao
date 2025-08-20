import { createApp } from 'vue'

const app = createApp({
  template: `
    <div style="padding: 20px; font-family: Arial;">
      <h1 style="color: green;">🎉 Vue está funcionando!</h1>
      <p>Se você vê esta mensagem, o Vue carregou corretamente.</p>
      <button @click="count++" style="padding: 10px;">Cliques: {{ count }}</button>
    </div>
  `,
  data() {
    return {
      count: 0
    }
  }
})

console.log('Vue app criado:', app)

try {
  app.mount('#app')
  console.log('✅ App montado com sucesso!')
} catch (error) {
  console.error('❌ Erro ao montar app:', error)
}