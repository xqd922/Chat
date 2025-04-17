'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function ThemeColorManager() {
  const { theme, systemTheme } = useTheme()

  useEffect(() => {
    const updateThemeColor = () => {
      const currentTheme = theme === 'system' ? systemTheme : theme
      const meta = document.querySelector('meta[name="theme-color"]')

      if (!meta) {
        const newMeta = document.createElement('meta')
        newMeta.name = 'theme-color'
        document.head.appendChild(newMeta)
      }

      const themeColor =
        currentTheme === 'dark'
          ? '#0a0a0ab6' // 深色模式背景色
          : 'rgba(255, 255, 255, 0.8)' // 浅色模式背景色

      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', themeColor)
    }

    // Update on mount and theme change
    updateThemeColor()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateThemeColor)

    return () => mediaQuery.removeEventListener('change', updateThemeColor)
  }, [theme, systemTheme])

  return null
}
