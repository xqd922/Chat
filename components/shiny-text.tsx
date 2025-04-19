import { cn } from '@/lib/utils'
import type React from 'react'

interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 5,
  className = '',
}) => {
  const animationDuration = `${speed}s`

  return (
    <div
      className={cn(
        'inline-block bg-clip-text text-[#54545494] dark:text-[#b5b5b5a4]',
        className,
        {
          'animate-shine': !disabled,
        }
      )}
      style={
        {
          backgroundImage:
            'linear-gradient(120deg, transparent 40%, var(--shine-color, rgba(255, 255, 255, 0.8)) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          animationDuration: animationDuration,
        } as React.CSSProperties
      }
    >
      {text}
    </div>
  )
}

export default ShinyText
