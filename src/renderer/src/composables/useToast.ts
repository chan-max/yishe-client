import { reactive } from 'vue'

const toast = reactive({
  visible: false,
  icon: 'mdi-information-outline',
  color: 'primary',
  message: ''
})

export function useToast() {
  const showToast = (options: { color: string; icon: string; message: string }) => {
    toast.color = options.color
    toast.icon = options.icon
    toast.message = options.message
    toast.visible = true
  }

  return {
    toast,
    showToast
  }
}

