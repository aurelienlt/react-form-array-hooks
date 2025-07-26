import {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
	SetStateAction,
} from "react"

import {
	generateKey,
	mapEntries,
	mapFromEntries,
	MetaType,
	OptionalIfPartial,
	EmptyMetaType,
	useUpdatedRef,
} from "./utils"

/**
 * The type of the map's mirrored item
 * @template T The type of the map's items
 * @template K The type of the map's keys (string only)
 * @template M The type of the items' metadata, must be an object
 */
export type FormMapItem<
	T,
	K extends string = string,
	M extends MetaType = EmptyMetaType,
> = {
	/** The numberic index of the item */
	readonly index: number
	/** A unique key to use as `key={key}` property */
	readonly key: string
	/** The map key associated to the item */
	readonly mapKey: K
	/** The value associated to the item */
	readonly value: T
	/** The metadata associated to the item */
	readonly meta: M
	/** `true` if several items share this map key */
	readonly duplicated: boolean
	/** `true` if this map value isn't used because duplicated */
	readonly ignored: boolean
	/** `true` for `newItem` appendable item */
	readonly newItem?: never
}

/** The type of the map's new empty item */
export type NewFormMapItem = {
	readonly index?: never
	/** a unique key to use as `key={key}` property */
	readonly key: string
	readonly mapKey?: never
	readonly value?: never
	readonly meta?: never
	readonly duplicated?: never
	readonly ignored?: never
	readonly newItem: true
}

/**
 * The type of the updated map's mirrored item passed to `setItems`
 * @template T The type of the map's items
 * @template K The type of the map's keys (string only)
 * @template M The type of the items' metadata, must be an object
 */
export type UpdatedFormMapItem<
	T,
	K extends string = string,
	M extends MetaType = EmptyMetaType,
> =
	| FormMapItem<T, K, M>
	| {
			readonly index?: never
			readonly key?: string
			readonly mapKey: K
			readonly value: T
			readonly meta?: M
	  }

/**
 * A type constructor for the return value of `setItems`
 * @template I the type of the items, `typeof items`
 */
export type UpdatedFormMapItems<
	I extends FormMapItem<unknown, string, MetaType>[],
> = I extends FormMapItem<infer T, infer K, infer M>[]
	? UpdatedFormMapItem<T, K, M>[]
	: never

/**
 * @template T The type of the map's items
 * @template K The type of the map's keys
 * @template M The type of the items' meta, must be an object
 */
export type FormMapOptions<
	T,
	K extends string = string,
	M extends MetaType = EmptyMetaType,
> = {
	/** Function that initate the metadata of each item */
	initMetas: (value: T, mapKey: K) => M
	/** `true` to sort map keys on intialization, or a comparator function `(entry1: [K, T], entry2: [K, T]) => number` to provide a specific order */
	sort?: boolean | ((entry1: [K, T], entry2: [K, T]) => number)
}

/**
 * A mirrored version of an array, fitted for editing
 * @template T The type of the map's items
 * @template K The type of the map's keys
 * @template M The type of the items' metadata, must be an object
 */
export type UseFormMap<
	T,
	K extends string = string,
	M extends MetaType = EmptyMetaType,
> = {
	/** The mirrored items with unique keys */
	readonly items: FormMapItem<T, K, M>[]
	/** The unique key used for the next appened item */
	readonly appendKey: string
	/** An appendable item to be concatenated with `items` */
	readonly newItem: NewFormMapItem
	/** Fully reorganizes item, new items can be added as `{mapKey, value}` */
	readonly setItems: (
		action:
			| UpdatedFormMapItems<FormMapItem<T, K, M>[]>
			| ((
					previous: FormMapItem<T, K, M>[],
			  ) => UpdatedFormMapItems<FormMapItem<T, K, M>[]>),
	) => void
	/** Sets the map key at the given index */
	readonly setMapKey: (index: number, mapKey: K, meta?: M) => void
	/** Sets the value at the given index */
	readonly setValue: (index: number, value: T, meta?: M) => void
	/** Returns a setter for the value at the given `index` */
	readonly valueSetter: (index: number) => (action: SetStateAction<T>) => void
	/** Appends a new item with the unique key `appendKey` */
	readonly appendItem: (
		mapKey: K,
		value: T,
		...[meta]: OptionalIfPartial<M>
	) => void
	/** Inserts a new item at the given index */
	readonly insertItem: (
		index: number,
		mapKey: K,
		value: T,
		...[meta]: OptionalIfPartial<M>
	) => void
	/** Removes the item at the given index */
	readonly removeItem: (index: number) => void
	/** Moves the item at the given index to the given index */
	readonly moveItem: (from: number, to: number) => void
	/** Resets the metadata of all the items using a function */
	readonly resetMetas: (initMetas?: (value: T, key: K) => M) => void
	/** Resets the metadata of the item at the given index */
	readonly resetMeta: (index: number, meta?: M) => void
	/** Sets the metadata associated to a key of all items */
	readonly setMetas: <F extends keyof M>(
		field: F,
		metas:
			| (undefined extends M[F] ? undefined : never)
			| Record<K, M[F]>
			| ((value: T, mapKey: K, item: FormMapItem<T, K, M>) => M[F]),
	) => void
	/** Sets the metadata associated to a key of the item at the given index */
	readonly setMeta: <F extends keyof M>(
		index: number,
		field: F,
		meta: M[F],
	) => void
	/** Returns a setter for the metadata associated to a key of the item at the given index */
	readonly metaSetter: <F extends keyof M>(
		index: number,
		field: F,
	) => (action: SetStateAction<M[F]>) => void
}

/**
 * Returns a mirrored version of an array, fitted for editing
 * @template T The type of the map's items
 * @template K The type of the map's keys
 * @template M The type of the items' metadata, must be an object
 * @param values The map to mirror
 * @param setValues The setter for the map
 * @param options.initMetas Function that initate the metadata of each item
 * @param options.sort `true` to sort map keys on intialization, or a comparator function `(entry1: [K, T], entry2: [K, T]) => number` to provide a specific order
 */
export const useFormMap = <
	T,
	K extends string = string,
	M extends MetaType = EmptyMetaType,
>(
	values: Record<K, T> | undefined,
	setValues: (value: Record<K, T>) => void,
	...[{ initMetas, sort } = {}]: OptionalIfPartial<
		M,
		Partial<FormMapOptions<T, K, M>>,
		FormMapOptions<T, K, M>
	>
): UseFormMap<T, K, M> => {
	const [items, setItemsState] = useState<FormMapItem<T, K, M>[]>([])
	const itemsRef = useRef(items)

	const initMetaRef = useUpdatedRef(initMetas)
	// reset items if incoherent with the current values
	useEffect(() => {
		if (!areItemsCompatible(values, items)) {
			const entries = mapEntries(values)
			if (typeof sort === "function") {
				entries.sort(sort)
			} else if (sort) {
				entries.sort(([a], [b]) => a.localeCompare(b))
			}
			const updatedItems = entries.map(([mapKey, value], index) => ({
				key: generateKey(),
				index,
				mapKey,
				value,
				meta: initMetaRef.current?.(value, mapKey) || ({} as M),
				duplicated: false,
				ignored: false,
			}))
			itemsRef.current = updatedItems
			setItemsState(updatedItems)
		}
	}, [values, items])

	const [appendKey, setAppendKey] = useState(generateKey)
	// an empty item to be used as appendable
	const newItem = useMemo<NewFormMapItem>(
		() => ({
			key: appendKey,
			newItem: true,
		}),
		[appendKey],
	)

	const setValuesRef = useUpdatedRef(setValues)
	// updates items and values on update
	const updateItems = useCallback(
		(items: FormMapItem<T, K, M>[], soft?: boolean) => {
			const [fixedItems, values] = getFixedItemsValues(items)
			itemsRef.current = fixedItems
			setItemsState(fixedItems)
			if (!soft) setValuesRef.current(values)
		},
		[],
	)

	const setItems = useCallback(
		(
			action:
				| UpdatedFormMapItem<T, K, M>[]
				| ((previous: FormMapItem<T, K, M>[]) => UpdatedFormMapItem<T, K, M>[]),
		) => {
			let updatedItems: UpdatedFormMapItem<T, K, M>[]
			if (typeof action === "function") {
				updatedItems = action(itemsRef.current)
			} else {
				updatedItems = action
			}
			updateItems(
				updatedItems.map((item, index) =>
					typeof item.index === "number"
						? item
						: {
								key: item.key || generateKey(),
								index,
								mapKey: item.mapKey,
								value: item.value,
								meta:
									item.meta ||
									initMetaRef.current?.(item.value, item.mapKey) ||
									({} as M),
								duplicated: false,
								ignored: true, // if key already exists, use the other value
							},
				),
			)
		},
		[updateItems],
	)

	const setMapKey = useCallback(
		(index: number, mapKey: K, meta?: M) =>
			updateItems(
				itemsRef.current.map((item, i) =>
					i === index
						? {
								...item,
								mapKey: mapKey,
								meta: meta ? { ...item.meta, meta } : item.meta,
								ignored: true, // if key already exists, use the other value
							}
						: item,
				),
			),
		[updateItems],
	)

	const setValue = useCallback(
		(index: number, value: T, meta?: M) => {
			updateItems(
				itemsRef.current.map((item, i) =>
					i === index
						? {
								...item,
								value: value,
								meta: meta ? { ...item.meta, meta } : item.meta,
							}
						: item,
				),
			)
		},
		[updateItems],
	)

	const valueSetter = useMemo(() => {
		const cache: Partial<Record<number, (action: SetStateAction<T>) => void>> =
			{}
		return (index: number) => {
			const cacheSetter = cache[index]
			if (cacheSetter) return cacheSetter
			const newSetter = (action: SetStateAction<T>) => {
				const item = itemsRef.current[index]
				if (!item) return
				let value: T
				if (typeof action === "function") {
					value = (action as (previous: T) => T)(item.value)
				} else {
					value = action
				}
				setValue(index, value)
			}
			cache[index] = newSetter
			return newSetter
		}
	}, [setValue])

	const appendItem = useCallback(
		(mapKey: K, value: T, ...[meta]: OptionalIfPartial<M>) => {
			setAppendKey(generateKey())
			updateItems([
				...itemsRef.current,
				{
					key: appendKey,
					index: itemsRef.current.length,
					mapKey: mapKey,
					value: value,
					meta: meta || ({} as M),
					duplicated: false,
					ignored: true, // if key already exists, use the other value
				},
			])
		},
		[updateItems, appendKey],
	)

	const insertItem = useCallback(
		(index: number, mapKey: K, value: T, ...[meta]: OptionalIfPartial<M>) =>
			updateItems([
				...itemsRef.current.slice(0, index),
				{
					key: generateKey(),
					index,
					mapKey: mapKey,
					value: value,
					meta: meta || ({} as M),
					duplicated: false,
					ignored: true, // if key already exists, use the other value
				},
				...itemsRef.current.slice(index),
			]),
		[updateItems],
	)

	const removeItem = useCallback(
		(index: number) =>
			updateItems(itemsRef.current.filter((_, i) => i !== index)),
		[updateItems],
	)

	const moveItem = useCallback(
		(from: number, to: number) =>
			from < to
				? updateItems([
						...itemsRef.current.slice(0, from),
						...itemsRef.current.slice(from + 1, to + 1),
						itemsRef.current[from],
						...itemsRef.current.slice(to + 1),
					])
				: from > to
					? updateItems([
							...itemsRef.current.slice(0, to),
							itemsRef.current[from],
							...itemsRef.current.slice(to, from),
							...itemsRef.current.slice(from + 1),
						])
					: undefined,
		[updateItems],
	)

	const resetMetas = useCallback(
		(initMetas?: (value: T, mapKey: K) => M) =>
			updateItems(
				itemsRef.current.map((item) => ({
					...item,
					meta:
						initMetas?.(item.value, item.mapKey) ||
						initMetaRef.current?.(item.value, item.mapKey) ||
						({} as M),
				})),
				true,
			),
		[updateItems],
	)

	const resetMeta = useCallback(
		(index: number, meta?: M) =>
			updateItems(
				itemsRef.current.map((item, i) =>
					i === index
						? {
								...item,
								meta:
									meta ||
									initMetaRef.current?.(item.value, item.mapKey) ||
									({} as M),
							}
						: item,
				),
				true,
			),
		[updateItems],
	)

	const setMetas = useCallback(
		<F extends keyof M>(
			field: F,
			metas:
				| (undefined extends M[F] ? undefined : never)
				| Record<K, M[F]>
				| ((value: T, mapKey: K, item: FormMapItem<T, K, M>) => M[F]),
		) => {
			updateItems(
				itemsRef.current.map((item) => ({
					...item,
					meta: {
						...item.meta,
						[field]:
							typeof metas === "function"
								? metas(item.value, item.mapKey, item)
								: !item.ignored && metas
									? metas[item.mapKey]
									: undefined,
					},
				})),
				true,
			)
		},
		[updateItems],
	)

	const setMeta = useCallback(
		<F extends keyof M>(index: number, field: F, meta: M[F]) =>
			updateItems(
				itemsRef.current.map((item, i) =>
					i === index
						? {
								...item,
								meta: { ...item.meta, [field]: meta },
							}
						: item,
				),
				true,
			),
		[updateItems],
	)

	const metaSetter = useMemo(() => {
		const cache: Partial<{
			[F in keyof M]: Partial<
				Record<number, (action: SetStateAction<M[F]>) => void>
			>
		}> = {}
		return <F extends keyof M>(index: number, field: F) => {
			const cacheSetter = cache[field]?.[index]
			if (cacheSetter) return cacheSetter
			const newSetter = (action: SetStateAction<M[F]>) => {
				const item = itemsRef.current[index]
				if (!item) return
				let value: M[F]
				if (typeof action === "function") {
					value = (action as (previous: M[F]) => M[F])(item.meta[field])
				} else {
					value = action
				}
				setMeta(index, field, value)
			}
			if (!cache[field]) {
				cache[field] = { [index]: newSetter }
			} else {
				cache[field][index] = newSetter
			}
			return newSetter
		}
	}, [setMeta])

	return useMemo(
		() =>
			({
				items,
				appendKey,
				newItem,
				setItems,
				setMapKey,
				setValue,
				valueSetter,
				appendItem,
				insertItem,
				removeItem,
				moveItem,
				resetMetas,
				resetMeta,
				setMetas,
				setMeta,
				metaSetter,
			}) as const,
		[
			items,
			appendKey,
			newItem,
			setItems,
			setMapKey,
			setValue,
			valueSetter,
			appendItem,
			insertItem,
			removeItem,
			moveItem,
			resetMetas,
			resetMeta,
			setMetas,
			setMeta,
			metaSetter,
		],
	)
}

/** Retuns if items still presents values */
const areItemsCompatible = <T>(
	values: Record<string, T> | undefined,
	items: FormMapItem<T, string, MetaType>[],
) => {
	const foundValues = mapFromEntries(
		Object.keys(values ?? {}).map((mapKey) => [mapKey, false]),
	)
	for (const { mapKey, value, ignored: duplicated } of items) {
		// key doesn't exist in values
		if (!values || !(mapKey in values)) return false
		// item is marked as duplicated, skip it
		if (duplicated) continue
		// key is duplicated but not mark as duplicated, should never happen
		if (foundValues[mapKey]) return false
		// the value associated to key is different
		if (values[mapKey] !== value) return false
		// key is found with the right value
		foundValues[mapKey] = true
	}
	// check that all keys were found
	return Object.values(foundValues).every((found) => found)
}

/** Retuns the fixed items and values */
const getFixedItemsValues = <T, K extends string, M extends MetaType>(
	items: FormMapItem<T, K, M>[],
) => {
	const values = {} as Record<K, T>
	// check which items are duplicated
	const selected: Partial<
		Record<
			K,
			{
				index: number
				duplicated: boolean
				ignored: boolean
			}
		>
	> = {}
	items.forEach((item, index) => {
		const s = selected[item.mapKey]
		// key hasn't been seen yet, use this value in case it is the only one
		if (!s) {
			values[item.mapKey] = item.value
			selected[item.mapKey] = {
				index,
				duplicated: false,
				ignored: item.ignored,
			}
			return
		}
		s.duplicated = true
		// key has been seen, but this item isn't ignored, use this value instead
		if (!item.ignored && s.ignored) {
			values[item.mapKey] = item.value
			s.index = index
			s.ignored = false
		}
	})
	// fix index, duplicated and ignored, but keep the item when possible
	items = items.map((item, index) => {
		const s = selected[item.mapKey]
		const duplicated = s?.duplicated || false
		const ignored = s?.index !== index
		return item.index === index &&
			item.duplicated === duplicated &&
			item.ignored === ignored
			? item
			: { ...item, index, duplicated, ignored: ignored }
	})

	return [items, values] as const
}
