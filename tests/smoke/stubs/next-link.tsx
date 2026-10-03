import { createElement, type ReactNode } from "react"

export default function Link({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) {
  return createElement("a", props, children)
}
