import type { PaginationStatus } from 'convex/browser'
import type { FunctionArgs, FunctionReference, FunctionReturnType, PaginationOptions, PaginationResult } from 'convex/server'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'
import { useConvexClient } from './useConvexClient'

export interface UseConvexPaginatedQueryOptions {
  initialNumItems: number
}

export interface UseConvexPaginatedQueryReturn<T> {
  results: Ref<T[]>
  status: Ref<PaginationStatus>
  isPending: Ref<boolean>
  loadMore: (numItems: number) => boolean
  error: Ref<Error | null>
}

/**
 * A paginated query reference that can be used with useConvexPaginatedQuery.
 * The query must have a `paginationOpts` argument and return a `PaginationResult`.
 */
export type PaginatedQueryReference = FunctionReference<
  'query',
  'public',
  { paginationOpts: PaginationOptions },
  PaginationResult<unknown>
>

/**
 * Get the arguments type for a paginated query, excluding `paginationOpts`.
 */
export type PaginatedQueryArgs<Query extends PaginatedQueryReference> = Omit<FunctionArgs<Query>, 'paginationOpts'>

/**
 * Get the item type from a paginated query's return type.
 */
export type PaginatedQueryItem<Query extends PaginatedQueryReference> = FunctionReturnType<Query>['page'][number]

/**
 * Internal type for the paginated query result that the client actually passes to callbacks.
 * Note: Convex's type signature says PaginationResult but actually passes PaginatedQueryResult at runtime.
 */
interface PaginatedQueryCallbackResult<T> {
  results: T[]
  status: PaginationStatus
  loadMore: (numItems: number) => boolean
}

/**
 * A composable that provides paginated Convex queries with infinite scroll support.
 * It automatically handles subscriptions and reactivity, updating in real-time when data changes.
 *
 * **Note:** This composable is client-side only. Pagination subscriptions are not supported on the server.
 * On the server, it will return empty results with `isPending: true`.
 *
 * @param query - The Convex paginated query function reference.
 * @param args - The arguments for the query (excluding paginationOpts). Pass "skip" to disable the query.
 * @param options - Options including `initialNumItems` to load initially.
 * @returns An object containing reactive `results`, `status`, `isPending`, `loadMore`, and `error`.
 *
 * @example
 * ```ts
 * const { results, status, isPending, loadMore, error } = useConvexPaginatedQuery(
 *   api.messages.list,
 *   { channel: '#general' },
 *   { initialNumItems: 10 }
 * )
 *
 * // Load more items
 * function handleLoadMore() {
 *   loadMore(10)
 * }
 *
 * // Skip the query conditionally
 * const args = computed(() => threadId.value ? { threadId: threadId.value } : "skip")
 * ```
 */
export function useConvexPaginatedQuery<Query extends PaginatedQueryReference>(
  query: Query,
  args: MaybeRefOrGetter<PaginatedQueryArgs<Query> | 'skip'>,
  options: UseConvexPaginatedQueryOptions,
): UseConvexPaginatedQueryReturn<PaginatedQueryItem<Query>> {
  if (!options || typeof options.initialNumItems !== 'number' || options.initialNumItems < 0) {
    const received = options?.initialNumItems ?? options
    throw new Error(`\`options.initialNumItems\` must be a positive number. Received \`${received}\`.`)
  }

  const isServer = typeof window === 'undefined'

  // Server-side: return empty state (paginated subscriptions not supported on server)
  if (isServer) {
    return {
      results: ref([]),
      status: ref('LoadingFirstPage' as PaginationStatus),
      isPending: ref(true),
      loadMore: () => false,
      error: ref(null),
    }
  }

  const convex = useConvexClient()

  const results = ref<PaginatedQueryItem<Query>[]>([])
  const status = ref<PaginationStatus>('LoadingFirstPage')
  const error = ref<Error | null>(null)

  // Store the loadMore function from the current subscription
  let currentLoadMore: ((numItems: number) => boolean) | null = null

  const handleResult = (result: PaginatedQueryCallbackResult<PaginatedQueryItem<Query>>) => {
    results.value = result.results
    status.value = result.status
    currentLoadMore = result.loadMore
    error.value = null
  }

  const handleError = (err: Error) => {
    error.value = err
  }

  const loadMore = (numItems: number): boolean => {
    if (!currentLoadMore) {
      return false
    }
    return currentLoadMore(numItems)
  }

  const createSubscription = (queryArgs: PaginatedQueryArgs<Query> | 'skip') => {
    if (queryArgs === 'skip') {
      throw new Error('Cannot create subscription with skip args')
    }
    // Note: Convex's type signature for the callback says PaginationResult,
    // but the actual runtime value is PaginatedQueryResult with { results, status, loadMore }
    return convex.onPaginatedUpdate_experimental(
      query,
      queryArgs as FunctionArgs<Query>,
      { initialNumItems: options.initialNumItems },
      // @ts-expect-error - Type assertion needed due to Convex type mismatch
      handleResult,
      handleError,
    )
  }

  // Computed args that unwraps the MaybeRefOrGetter
  const computedArgs = computed(() => toValue(args))

  // Recreate subscription when args change
  let unsubscribe: (() => void) | undefined
  watch(computedArgs, (newArgs) => {
    // Clean up previous subscription
    unsubscribe?.()

    // Reset state for new query
    results.value = []
    status.value = 'LoadingFirstPage'
    currentLoadMore = null
    error.value = null

    // Skip subscription if args is "skip"
    if (newArgs === 'skip') {
      return
    }

    // Create new subscription
    const subscription = createSubscription(newArgs)
    unsubscribe = subscription.unsubscribe
  }, {
    immediate: true,
    deep: true,
  })

  // Cleanup subscription when component is unmounted
  onScopeDispose(() => unsubscribe?.())

  const isPending = computed(() => status.value === 'LoadingFirstPage' || status.value === 'LoadingMore')

  return {
    results,
    status,
    isPending,
    loadMore,
    error,
  }
}
