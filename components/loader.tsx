import { cn } from '@/lib/utils'

const bars = Array(8).fill(0)

export const Loader = ({
  visible,
  className,
}: { visible: boolean; className?: string }) => {
  return (
    <div className="hamster-loading-wrapper" data-visible={visible}>
      <div className="hamster-spinner">
        {bars.map((_, i) => (
          <div
            className={cn('hamster-loading-bar bg-stone-400', className)}
            key={`hamster-bar-${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
