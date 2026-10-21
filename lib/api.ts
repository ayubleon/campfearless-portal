// The one place a server call is made. Today there is no server: it waits a moment, so the loading states can be seen,
// and then runs the local change on the dummy data. When the backend connects, replace the body with a real fetch
// (keep the signature) and every Save, Verify and Confirm button already shows its loading and error states.
export async function callApi<T>(action: () => T | Promise<T>, delayMs = 400): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  return await action()
}
