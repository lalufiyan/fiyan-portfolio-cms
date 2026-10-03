import type { Block } from "payload"

const imageFeatureBlock: Block = {
  slug: "imageFeature",
  labels: {
    singular: "Image feature",
    plural: "Image features",
  },
  admin: {
    group: "Case study",
  },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      displayPreview: true,
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "wide",
      options: [
        { label: "Wide", value: "wide" },
        { label: "Full width", value: "full" },
        { label: "Inset", value: "inset" },
      ],
    },
    {
      name: "caption",
      type: "text",
      admin: {
        description: "Optional override. Leave empty to use the media library caption.",
      },
    },
  ],
}

const metricsBlock: Block = {
  slug: "metrics",
  labels: {
    singular: "Metrics",
    plural: "Metrics",
  },
  admin: {
    group: "Case study",
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      defaultValue: "Results",
    },
    {
      name: "items",
      type: "array",
      minRows: 1,
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "textarea",
        },
      ],
    },
  ],
}

const pullQuoteBlock: Block = {
  slug: "pullQuote",
  labels: {
    singular: "Pull quote",
    plural: "Pull quotes",
  },
  admin: {
    group: "Editorial",
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      required: true,
    },
    {
      name: "attribution",
      type: "text",
    },
  ],
}

const calloutBlock: Block = {
  slug: "callout",
  labels: {
    singular: "Callout",
    plural: "Callouts",
  },
  admin: {
    group: "Editorial",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
    },
    {
      name: "tone",
      type: "select",
      defaultValue: "neutral",
      options: [
        { label: "Neutral", value: "neutral" },
        { label: "Strong", value: "strong" },
      ],
    },
  ],
}

const ctaBlock: Block = {
  slug: "cta",
  labels: {
    singular: "Call to action",
    plural: "Calls to action",
  },
  admin: {
    group: "Editorial",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "text",
      type: "textarea",
    },
    {
      name: "href",
      label: "Link URL",
      type: "text",
      required: true,
    },
    {
      name: "label",
      label: "Button label",
      type: "text",
      required: true,
      defaultValue: "Get in touch",
    },
  ],
}

export const caseStudyBlocks: Block[] = [imageFeatureBlock, metricsBlock, pullQuoteBlock, calloutBlock, ctaBlock]
