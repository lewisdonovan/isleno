"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { TOAST_STYLES } from '@/configs/themes';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={TOAST_STYLES as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
