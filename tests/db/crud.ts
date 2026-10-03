import { getPayload, type Payload } from "payload"

import configPromise from "../../payload.config.ts"
import type { Article } from "../../payload-types.ts"

/**
 * Database-backed CRUD regression harness.
 *
 * Runs real Payload creates/updates/reads against whatever DATABASE_URL points
 * at, so a migration that leaves the schema incomplete fails loudly instead of
 * only breaking `/admin` at runtime.
 *
 * Refuses to run against a remote database: production is never a valid target.
 */
const assertLocalDatabase = () => {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error("DATABASE_URL is required for the database CRUD harness")
  }

  const { hostname } = new URL(url)
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local")

  if (!isLocal && process.env.ALLOW_REMOTE_TEST_DB !== "1") {
    throw new Error(`Refusing to run destructive CRUD scenarios against non-local database host "${hostname}"`)
  }
}

type Scenario = {
  name: string
  run: (payload: Payload) => Promise<void>
}

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message)
  }
}

const richText = (text: string): NonNullable<Article["body"]> => ({
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [{ type: "text", version: 1, text }],
        direction: null,
        format: "",
        indent: 0,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  },
})

const uniqueSlug = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

/** Payload hooks run Next revalidation inside route handlers; the harness is not one. */
const harnessContext = { disableRevalidate: true }

const ensureUser = async (payload: Payload) => {
  const existing = await payload.find({ collection: "users", limit: 1, depth: 0 })
  if (existing.docs[0]) {
    return
  }

  await payload.create({
    collection: "users",
    context: harnessContext,
    data: { email: "crud-harness@local.test", password: "crud-harness-password" },
  })
}

const projectScenarios: Scenario[] = [
  {
    name: "project: create draft",
    run: async (payload) => {
      const slug = uniqueSlug("crud-project")
      const created = await payload.create({
        collection: "projects",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Project",
          slug,
          description: "Created by the database CRUD harness.",
          category: "Strategy",
          year: "2025",
        },
      })

      assert(created.id, "project create returned no id")
      assert(created.slug === slug, `project slug mismatch: ${created.slug}`)
      assert(created._status === "draft", `expected draft status, got ${String(created._status)}`)
      assert(!created.publishedAt, `a draft must not carry a publish date, got ${String(created.publishedAt)}`)
    },
  },
  {
    name: "project: draft save, publish, edit, republish",
    run: async (payload) => {
      const slug = uniqueSlug("crud-project-publish")
      const created = await payload.create({
        collection: "projects",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Project Publish",
          slug,
          description: "Draft body",
          category: "Strategy",
          year: "2025",
        },
      })

      const saved = await payload.update({
        collection: "projects",
        context: harnessContext,
        draft: true,
        id: created.id,
        data: { description: "Edited while still a draft" },
      })
      assert(saved._status === "draft", `draft save changed status to ${String(saved._status)}`)
      assert(!saved.publishedAt, "a saved draft must not carry a publish date")

      const published = await payload.update({
        collection: "projects",
        context: harnessContext,
        id: created.id,
        data: { _status: "published" },
      })
      assert(published._status === "published", `expected published status, got ${String(published._status)}`)
      assert(published.publishedAt, "publishing did not set publishedAt")

      const reloaded = await payload.findByID({ collection: "projects", draft: true, id: created.id })
      assert(reloaded._status === "published", "published status did not survive a reload")
      assert(reloaded.publishedAt === published.publishedAt, "republishing changed the original publish date")

      const edited = await payload.update({
        collection: "projects",
        context: harnessContext,
        id: created.id,
        data: { description: "Edited after publish", _status: "published" },
      })
      assert(edited._status === "published", "edit after publish lost published status")
      assert(edited.publishedAt === published.publishedAt, "editing a published project changed its publish date")

      const searchable = await payload.find({ collection: "projects", depth: 0, where: { slug: { equals: slug } } })
      assert(searchable.docs.length === 1, `published project not searchable by slug (found ${searchable.docs.length})`)
    },
  },
  {
    name: "project: version history is recorded",
    run: async (payload) => {
      const slug = uniqueSlug("crud-project-versions")
      const created = await payload.create({
        collection: "projects",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Project Versions",
          slug,
          description: "Version body",
          category: "Strategy",
          year: "2025",
        },
      })

      const versions = await payload.findVersions({
        collection: "projects",
        depth: 0,
        where: { parent: { equals: created.id } },
      })
      assert(versions.docs.length > 0, "no project version rows were written")
    },
  },
]

const articleScenarios: Scenario[] = [
  {
    name: "article: create draft with rich text body",
    run: async (payload) => {
      const slug = uniqueSlug("crud-article")
      const created = await payload.create({
        collection: "articles",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Article",
          slug,
          description: "Created by the database CRUD harness.",
          body: richText("Rich text body written by the harness."),
        },
      })

      assert(created.id, "article create returned no id")
      assert(created._status === "draft", `expected draft status, got ${String(created._status)}`)
      assert(created.body, "rich text body was not persisted")
      assert(!created.publishedAt, "a draft article must not carry a publish date")
    },
  },
  {
    name: "article: draft save, publish, edit, republish",
    run: async (payload) => {
      const slug = uniqueSlug("crud-article-publish")
      const created = await payload.create({
        collection: "articles",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Article Publish",
          slug,
          description: "Draft body",
          body: richText("First draft"),
        },
      })

      const saved = await payload.update({
        collection: "articles",
        context: harnessContext,
        draft: true,
        id: created.id,
        data: { description: "Edited while still a draft" },
      })
      assert(saved._status === "draft", `draft save changed status to ${String(saved._status)}`)
      assert(!saved.publishedAt, "a saved draft article must not carry a publish date")

      const published = await payload.update({
        collection: "articles",
        context: harnessContext,
        id: created.id,
        data: { _status: "published" },
      })
      assert(published._status === "published", `expected published status, got ${String(published._status)}`)
      assert(published.publishedAt, "publishing an article did not set publishedAt")

      const edited = await payload.update({
        collection: "articles",
        context: harnessContext,
        id: created.id,
        data: { body: richText("Published body edit"), _status: "published" },
      })
      assert(edited._status === "published", "edit after publish lost published status")

      const reloaded = await payload.findByID({ collection: "articles", draft: true, id: created.id })
      assert(reloaded._status === "published", "published article status did not survive a reload")
      assert(reloaded.publishedAt === published.publishedAt, "editing a published article changed its publish date")
    },
  },
  {
    name: "article: legacy content column no longer blocks new articles",
    run: async (payload) => {
      const slug = uniqueSlug("crud-article-legacy")
      const created = await payload.create({
        collection: "articles",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Legacy Column",
          slug,
          description: "New article that supplies no legacy plain-text content.",
          body: richText("Body only"),
        },
      })

      assert(created.id, "article create without legacy content returned no id")
      assert(!created.content, `unexpected legacy content value: ${String(created.content)}`)
    },
  },
]

const visibilityScenarios: Scenario[] = [
  {
    name: "public read hides drafts",
    run: async (payload) => {
      const slug = uniqueSlug("crud-project-hidden")
      await payload.create({
        collection: "projects",
        context: harnessContext,
        draft: true,
        data: {
          title: "CRUD Harness Hidden Draft",
          slug,
          description: "Must not be public",
          category: "Strategy",
          year: "2025",
        },
      })

      const publicRead = await payload.find({
        collection: "projects",
        depth: 0,
        overrideAccess: false,
        where: { slug: { equals: slug } },
      })
      assert(publicRead.docs.length === 0, "draft project is readable without access control")
    },
  },
]

const scenarios: Scenario[] = [...projectScenarios, ...articleScenarios, ...visibilityScenarios]

const main = async () => {
  assertLocalDatabase()

  const payload = await getPayload({ config: configPromise })
  await ensureUser(payload)

  const failures: { error: string; name: string }[] = []

  for (const scenario of scenarios) {
    try {
      await scenario.run(payload)
      console.log(`PASS ${scenario.name}`)
    } catch (error) {
      const chain: string[] = []
      let current: unknown = error
      while (current instanceof Error && chain.length < 8) {
        chain.push(current.message.split("\n")[0])
        current = current.cause
      }

      const message = chain.join(" <- ")
      failures.push({ name: scenario.name, error: message })
      console.log(`FAIL ${scenario.name}`)
      console.log(`     ${chain.slice(-2).join("\n     cause: ")}`)
    }
  }

  console.log(`\n${scenarios.length - failures.length}/${scenarios.length} CRUD scenarios passed`)
  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
