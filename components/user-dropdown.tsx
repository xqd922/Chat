import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth-client'
import { useState } from 'react'
import { Spinner } from './ui/spinner'

type UserDropDownProps = {
  userName: string
}

export function UserDropDown({ userName }: UserDropDownProps) {
  const [isLoading, setIsLoading] = useState(false)
  const handleSelect = async (e: Event) => {
    e.preventDefault() // 阻止默认的关闭行为
    setIsLoading(true)
    await signOut()
    setIsLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-fit px-2 py-0.5">
          {userName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-36 rounded-[10px] shadow-lg"
        align="end"
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => handleSelect(e)}
          className="rounded-[8px]"
        >
          {isLoading && <Spinner className="size-4" />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
