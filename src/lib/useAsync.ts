import { useEffect, useState } from "react"

interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
}

/**
 * Runs an async factory whenever `deps` change and tracks loading/error state.
 * Guards against setting state after the effect has been superseded.
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  deps: unknown[]
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: undefined }))
    factory()
      .then((data) => {
        if (active) setState({ data, loading: false, error: undefined })
      })
      .catch((err: unknown) => {
        if (active)
          setState({
            data: undefined,
            loading: false,
            error: err instanceof Error ? err.message : "Something went wrong",
          })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
