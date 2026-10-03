"use client"

import type { RelationshipFieldClientComponent } from "payload"
import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"

import { useField } from "@payloadcms/ui"
import { useFormFields } from "@payloadcms/ui/forms/Form"

type ProjectID = number | string

type ProjectOption = {
  category?: string
  id: ProjectID
  image?: string
  published: boolean
  slug?: string
  title: string
  year?: string
}

type ProjectDoc = {
  _status?: string
  category?: string
  id: ProjectID
  slug?: string
  thumbnail?: {
    alt?: string
    sizes?: Record<string, { url?: string }>
    thumbnailURL?: string
    url?: string
  }
  title?: string
  year?: string
}

const idKey = (id: ProjectID) => String(id)

const normalizeValue = (value: unknown): ProjectID[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === "number" || typeof item === "string") {
        return item
      }

      if (item && typeof item === "object") {
        const record = item as { id?: ProjectID; value?: ProjectID | { id?: ProjectID } }

        if (typeof record.value === "number" || typeof record.value === "string") {
          return record.value
        }

        if (record.value && typeof record.value === "object" && "id" in record.value) {
          return record.value.id
        }

        return record.id
      }

      return undefined
    })
    .filter((item): item is ProjectID => typeof item === "number" || typeof item === "string")
}

const projectImage = (project: ProjectDoc) =>
  project.thumbnail?.sizes?.thumbnail?.url ||
  project.thumbnail?.sizes?.gallery?.url ||
  project.thumbnail?.thumbnailURL ||
  project.thumbnail?.url

const toProjectOption = (project: ProjectDoc): ProjectOption => ({
  category: project.category,
  id: project.id,
  image: projectImage(project),
  published: project._status !== "draft",
  slug: project.slug,
  title: project.title || `Project ${project.id}`,
  year: project.year,
})

const styles = {
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
    alignItems: "center",
    background: "var(--theme-elevation-50)",
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: 6,
    color: "var(--theme-text)",
    cursor: "pointer",
    display: "inline-flex",
    font: "inherit",
    minHeight: 34,
    padding: "6px 10px",
  },
  draftBadge: {
    color: "var(--theme-warning-500, #8a6116)",
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    alignItems: "center",
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: 8,
    display: "grid",
    gap: 12,
    gridTemplateColumns: "72px minmax(0, 1fr) auto",
    padding: 10,
  },
  empty: {
    border: "1px dashed var(--theme-elevation-200)",
    borderRadius: 8,
    color: "var(--theme-elevation-500)",
    padding: 16,
  },
  field: {
    display: "grid",
    gap: 14,
  },
  help: {
    color: "var(--theme-elevation-500)",
    fontSize: 13,
    margin: 0,
  },
  image: {
    aspectRatio: "4 / 3",
    background: "var(--theme-elevation-100)",
    borderRadius: 6,
    height: 54,
    objectFit: "cover",
    width: 72,
  },
  input: {
    background: "var(--theme-input-bg)",
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: 6,
    color: "var(--theme-text)",
    font: "inherit",
    minHeight: 38,
    padding: "8px 10px",
    width: "100%",
  },
  list: {
    display: "grid",
    gap: 8,
  },
  meta: {
    color: "var(--theme-elevation-500)",
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    margin: 0,
    textTransform: "uppercase",
  },
  error: {
    color: "var(--theme-error-500)",
    fontSize: 13,
    margin: 0,
  },
  warning: {
    borderColor: "var(--theme-warning-500)",
    color: "var(--theme-warning-700)",
  },
  title: {
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} satisfies Record<string, CSSProperties>

export const LandingProjectsField: RelationshipFieldClientComponent = ({ field, path: pathFromProps }) => {
  const path = pathFromProps || "landingProjects"
  const { value, setValue, errorMessage, showError } = useField<unknown>({ path })
  // Sibling toggle in the same Home Page global; undefined means the default (enabled) is in effect.
  const fallbackEnabled = useFormFields(([fields]) => fields.fallbackToFeatured?.value) !== false
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedIDs = useMemo(() => normalizeValue(value), [value])
  const selectedKeys = useMemo(() => new Set(selectedIDs.map(idKey)), [selectedIDs])
  const projectByID = useMemo(() => new Map(projects.map((project) => [idKey(project.id), project])), [projects])
  const selectedProjects: ProjectOption[] = selectedIDs.map(
    (id) => projectByID.get(idKey(id)) || { id, published: true, title: `Selected project ${id}` },
  )
  const availableProjects = projects.filter((project) => !selectedKeys.has(idKey(project.id)))
  const filteredProjects = availableProjects.filter((project) => {
    const haystack = `${project.title} ${project.category || ""} ${project.year || ""}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      try {
        const response = await fetch("/api/projects?depth=1&draft=true&limit=100&sort=-year", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Could not load projects")
        }

        const data = (await response.json()) as { docs?: ProjectDoc[] }

        if (isMounted) {
          setProjects(Array.isArray(data.docs) ? data.docs.map(toProjectOption) : [])
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Could not load projects")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      isMounted = false
    }
  }, [])

  const updateSelected = (nextIDs: ProjectID[]) => setValue(nextIDs)

  const addProject = (id: ProjectID) => {
    if (!selectedKeys.has(idKey(id))) {
      updateSelected([...selectedIDs, id])
    }
  }

  const removeProject = (id: ProjectID) => {
    updateSelected(selectedIDs.filter((selectedID) => idKey(selectedID) !== idKey(id)))
  }

  const moveProject = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedIDs.length) {
      return
    }

    const nextIDs = [...selectedIDs]
    const [item] = nextIDs.splice(fromIndex, 1)
    if (typeof item !== "undefined") {
      nextIDs.splice(toIndex, 0, item)
      updateSelected(nextIDs)
    }
  }

  return (
    <div className="field-type relationship" id={`field-${path?.replace(/\./g, "__")}`} style={styles.field}>
      <div>
        <label className="field-label" htmlFor={`${path}-search`}>
          {typeof field.label === "string" ? field.label : "Landing page projects"}
          {field.required && <span className="required">*</span>}
        </label>
        {showError && errorMessage && <p style={styles.error}>{errorMessage}</p>}
      </div>

      <div style={styles.list}>
        <p style={styles.sectionTitle}>Selected homepage slides</p>
        {selectedProjects.length > 0 ? (
          selectedProjects.map((project, index) => (
            <article key={idKey(project.id)} style={styles.card}>
              {project.image ? (
                <img alt="" src={project.image} style={styles.image} />
              ) : (
                <div aria-hidden="true" style={styles.image} />
              )}
              <div>
                <div style={styles.title}>{project.title}</div>
                <div style={styles.meta}>
                  {[project.category, project.year].filter(Boolean).join(" / ") || project.slug || `ID ${project.id}`}
                </div>
                {!project.published && <div style={styles.draftBadge}>Draft - only visible in preview</div>}
              </div>
              <div style={styles.actions}>
                <button
                  disabled={index === 0}
                  onClick={() => moveProject(index, index - 1)}
                  style={styles.button}
                  type="button"
                >
                  Up
                </button>
                <button
                  disabled={index === selectedProjects.length - 1}
                  onClick={() => moveProject(index, index + 1)}
                  style={styles.button}
                  type="button"
                >
                  Down
                </button>
                <button onClick={() => removeProject(project.id)} style={styles.button} type="button">
                  Remove
                </button>
              </div>
            </article>
          ))
        ) : fallbackEnabled ? (
          <div style={styles.empty}>
            No projects selected. The homepage falls back to projects marked as featured.
          </div>
        ) : (
          <div style={{ ...styles.empty, ...styles.warning }}>
            No projects selected and "Use featured projects when empty" is off. Publishing stays blocked until you add at
            least one project or turn the fallback back on; until then the live homepage shows featured projects.
          </div>
        )}
      </div>

      <div style={styles.list}>
        <p style={styles.sectionTitle}>Add projects</p>
        <input
          id={`${path}-search`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects by title, category, or year"
          style={styles.input}
          type="search"
          value={query}
        />
        {isLoading && <div style={styles.empty}>Loading projects...</div>}
        {error && <div style={styles.empty}>{error}</div>}
        {!isLoading &&
          !error &&
          filteredProjects.map((project) => (
            <article key={idKey(project.id)} style={styles.card}>
              {project.image ? <img alt="" src={project.image} style={styles.image} /> : <div aria-hidden="true" style={styles.image} />}
              <div>
                <div style={styles.title}>{project.title}</div>
                <div style={styles.meta}>{[project.category, project.year].filter(Boolean).join(" / ")}</div>
                {!project.published && <div style={styles.draftBadge}>Draft - only visible in preview</div>}
              </div>
              <button onClick={() => addProject(project.id)} style={styles.button} type="button">
                Add
              </button>
            </article>
          ))}
        {!isLoading && !error && filteredProjects.length === 0 && (
          <div style={styles.empty}>No matching projects available.</div>
        )}
      </div>

      {typeof field.admin?.description === "string" && <p style={styles.help}>{field.admin.description}</p>}
    </div>
  )
}
