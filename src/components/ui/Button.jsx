import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-sm",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500 shadow-sm",
        outline: "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-primary-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-6 text-sm",
        lg: "h-11 px-8 text-base",
        xl: "h-12 px-10 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }

