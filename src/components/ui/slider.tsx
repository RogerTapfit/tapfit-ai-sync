import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className?.includes("enhanced-slider") && "py-4",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className={cn(
        "relative w-full grow overflow-hidden rounded-full bg-secondary",
        className?.includes("enhanced-slider") ? "h-3" : "h-2"
      )}
    >
      <SliderPrimitive.Range 
        className={cn(
          "absolute h-full",
          className?.includes("enhanced-slider") 
            ? "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-yellow-400 to-red-400" 
            : "bg-primary"
        )} 
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "block rounded-full border-2 border-primary bg-background ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className?.includes("enhanced-slider") 
          ? "h-7 w-7 hover:scale-110 shadow-lg border-white" 
          : "h-5 w-5"
      )} 
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
