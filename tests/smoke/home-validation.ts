// The Home Page global must refuse to publish an empty slide selection with the featured fallback
// off, while still allowing drafts and every other combination.
import type { CheckboxField } from "payload"

import { HomePage } from "../../globals/HomePage"
import { check, finish } from "./assert"

const isFallbackToggle = (field: (typeof HomePage.fields)[number]): field is CheckboxField =>
  field.type === "checkbox" && "name" in field && field.name === "fallbackToFeatured"

const fallbackField = HomePage.fields.find(isFallbackToggle)

const main = async () => {
  console.log("home page fallback validation")

  check("the fallback toggle is a validated checkbox", Boolean(fallbackField?.validate))

  if (!fallbackField?.validate) {
    finish()
    return
  }

  const validate = fallbackField.validate
  // Payload's runner supplies the full options bag; this smoke only needs siblingData.
  const run = (value: boolean, landingProjects?: unknown) =>
    validate(value, { siblingData: { landingProjects } } as unknown as Parameters<typeof validate>[1])

  check("allows the toggle to stay on with no selection", (await run(true)) === true)
  check("allows an empty selection while the fallback is on", (await run(true, [])) === true)
  check("allows turning the fallback off when projects are selected", (await run(false, [{ id: 1 }])) === true)

  const blocked = await run(false, [])
  check("blocks turning the fallback off with an empty selection", typeof blocked === "string", String(blocked))
  check(
    "explains both ways out of the blocked state",
    typeof blocked === "string" &&
      blocked.includes("featured projects") &&
      blocked.includes("landing page project"),
    String(blocked),
  )

  const unset = await run(false)
  check("blocks an unset selection the same way", typeof unset === "string", String(unset))

  finish()
}

void main()
