import { withPayload } from '@payloadcms/next/withPayload'

const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim()

/**
 * Remote image optimization is limited to the single R2 host configured through
 * R2_PUBLIC_URL. R2_PUBLIC_URL is optional outside production, so an invalid
 * value disables remote patterns instead of breaking the build.
 */
const r2RemotePatterns = (() => {
  if (!r2PublicUrl) {
    return []
  }

  try {
    const { hostname, port, protocol } = new URL(r2PublicUrl)

    if (protocol !== 'http:' && protocol !== 'https:') {
      console.warn('[next.config] R2_PUBLIC_URL must be an http(s) URL; remote R2 images stay unoptimized.')
      return []
    }

    return [
      {
        hostname,
        protocol: protocol.replace(':', ''),
        ...(port ? { port } : {}),
      },
    ]
  } catch {
    console.warn('[next.config] R2_PUBLIC_URL is not a valid URL; remote R2 images stay unoptimized.')
    return []
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only the R2 public host is allowed to be proxied through the image optimizer.
    // `/placeholder.svg` needs no SVG opt-in: with the default loader Next serves
    // `.svg` sources as-is (unoptimized) unless dangerouslyAllowSVG is enabled.
    remotePatterns: r2RemotePatterns,
  },
  async redirects() {
    return [
      {
        // The prototype `/portfolio` route now lives on the homepage.
        source: '/portfolio',
        destination: '/',
        permanent: true,
      },
      {
        source: '/portfolio/:path*',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default withPayload(nextConfig)
