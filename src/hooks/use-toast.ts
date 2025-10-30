import { toast as sonnerToast } from "sonner"

export type ToastVariant = "default" | "destructive"

export interface ToastProps {
  title?: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === "destructive") {
        sonnerToast.error(title, {
          description,
        })
      } else {
        sonnerToast.success(title, {
          description,
        })
      }
    },
  }
}
