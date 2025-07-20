import { useRef } from "react"

let UNIQUE_ID = 0

/** Returns a new unique key to be used by react */
export const generateKey = () => `item-${UNIQUE_ID++}`

export type AnyKey = keyof any

export type MetaType = Record<AnyKey, unknown>

export type EmptyMetaType = Record<string, never>

/** Makes the given type option if `{}` is an accepted value */
export type OptionalIfPartial<M, T = M, U = T> =
	Record<AnyKey, never> extends M ? [arg?: T] : [arg: U]

/** A properly typed version of Object.entries */
export const mapEntries = <K extends string, T>(
	map: Record<K, T> | undefined,
): [K, T][] => (map ? (Object.entries(map) as [K, T][]) : [])

/** A properly typed version of Object.fromEntries */
export const mapFromEntries: <K extends string, T>(
	entries: [K, T][] | [],
) => Record<K, T> = Object.fromEntries

export const useUpdatedRef = <T>(value: T): { readonly current: T } => {
	const ref = useRef(value)
	ref.current = value
	return ref
}
