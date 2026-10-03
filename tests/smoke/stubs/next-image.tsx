import { createElement } from "react"

export default function Image(props: Record<string, unknown>) {
  return createElement("img", props)
}
