import { useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useThemeStore } from '@/stores/theme-store'

export function App(): React.ReactElement {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
  }, [theme])

  return <AppLayout />
}
