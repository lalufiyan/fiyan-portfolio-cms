export const failures: string[] = []

export const check = (label: string, condition: boolean, detail = "") => {
  if (condition) {
    console.log(`  PASS ${label}`)
    return
  }

  failures.push(`${label}${detail ? ` — ${detail}` : ""}`)
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`)
}

export const finish = () => {
  if (failures.length > 0) {
    console.log(`\n${failures.length} FAILURE(S)`)
  }
  process.exit(failures.length > 0 ? 1 : 0)
}
