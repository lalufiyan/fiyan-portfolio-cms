// Smoke stub: case programs install a fake Payload client on globalThis before calling into
// lib/site-settings, so the real normalization code runs without a database.
export const getPayload = async () => (globalThis as { __fakePayload?: unknown }).__fakePayload
