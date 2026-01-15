import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-105 active:scale-95 hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/25",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-destructive/25",
        outline: "border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-secondary/25",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100",
        // Naruto-style gradient - Blue/Teal energy
        gradient: "bg-gradient-to-r from-sky-500 via-teal-500 to-green-500 text-white hover:from-sky-600 hover:via-teal-600 hover:to-green-600 shadow-lg hover:shadow-xl hover:shadow-teal-500/30",
        success: "bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-green-500/25",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hover:shadow-yellow-500/25",
        // Cartoon bounce style
        sky: "bg-sky-500 text-white hover:bg-sky-600 shadow-md hover:shadow-sky-500/30",
        teal: "bg-teal-500 text-white hover:bg-teal-600 shadow-md hover:shadow-teal-500/30",
        orange: "bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-orange-500/25",
        // Chakra style (orange-red energy)
        chakra: "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/40",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
