import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  SetStateAction,
} from "react"

import {
  EmptyMetaType,
  generateKey,
  MetaType,
  OptionalIfPartial,
  useUpdatedRef,
} from "./utils"

/**
 * The type of the array's mirrored item
 * @template T The type of the array's items
 * @template M The type of the items' metadata, must be an object
 */
export type FormArrayItem<T, M extends MetaType = EmptyMetaType> = {
  /** The numberic index of the item */
  readonly index: number
  /** A unique key to use as `key={key}` property */
  readonly key: string
  /** The value associated to the item */
  readonly value: T
  /** The metadata associated to the item */
  readonly meta: M
  /** `true` for `newItem` appendable item */
  readonly newItem?: never
}

/** The type of the array's new empty item */
export type NewFormArrayItem = {
  readonly index?: never
  /** a unique key to use as `key={key}` property */
  readonly key: string
  readonly value?: never
  readonly meta?: never
  readonly newItem: true
}

/**
 * The type of the updated arrays's mirrored item passed to `setItems`
 * @template T The type of the array's items
 * @template M The type of the items' metadata, must be an object
 */
export type UpdatedFormArrayItem<T, M extends MetaType = EmptyMetaType> =
  | FormArrayItem<T, M>
  | {
      readonly index?: never
      readonly key?: string
      readonly value: T
      readonly meta?: M
    }

/**
 * A type constructor for the return value of `setItems`
 * @template I the type of the items, `typeof items`
 */
export type UpdatedFormArrayItems<
  I extends FormArrayItem<unknown, MetaType>[],
> = I extends FormArrayItem<infer T, infer M>[]
  ? UpdatedFormArrayItem<T, M>[]
  : never

/**
 * @template T The type of the array's items
 * @template M The type of the items' metadata, must be an object
 */
export type FormArrayOptions<
  T,
  M extends Record<string, unknown> = EmptyMetaType,
> = {
  /** Function that initate the metadata of each item */
  initMetas: (value: T) => M
}

/**
 * A mirrored version of an array, fitted for editing
 * @template T The type of the array's items
 * @template M The type of the items' metadata, must be an object
 */
export type UseFormArray<
  T,
  M extends Record<string, unknown> = EmptyMetaType,
> = {
  /** The mirrored items with unique keys */
  readonly items: FormArrayItem<T, M>[]
  /** The unique key used for the next appened item */
  readonly appendKey: string
  /** An appendable item to be concatenated with `items` */
  readonly newItem: NewFormArrayItem
  /** Fully reorganizes item, new items can be added as `{value}` */
  readonly setItems: (
    action:
      | UpdatedFormArrayItems<FormArrayItem<T, M>[]>
      | ((
          previous: FormArrayItem<T, M>[],
        ) => UpdatedFormArrayItems<FormArrayItem<T, M>[]>),
  ) => void
  /** Sets the value at the given index */
  readonly setValue: (index: number, value: T, meta?: M) => void
  /** Returns a setter for the value at the given index */
  readonly valueSetter: (index: number) => (action: SetStateAction<T>) => void
  /** Appends a new item with the unique key `appendKey` */
  readonly appendItem: (value: T, ...[meta]: OptionalIfPartial<M>) => void
  /** Inserts a new item at the given index */
  readonly insertItem: (
    index: number,
    value: T,
    ...[meta]: OptionalIfPartial<M>
  ) => void
  /** Removes the item at the given index */
  readonly removeItem: (index: number) => void
  /** Moves the item at the given index to the given index */
  readonly moveItem: (from: number, to: number) => void
  /** Resets the metadata of all the items using a function */
  readonly resetMetas: (initMetas?: (value: T) => M) => void
  /** Resets the metadata of the item at the given index */
  readonly resetMeta: (index: number, meta?: M) => void
  /** Sets the metadata associated to a key of all items */
  readonly setMetas: <F extends keyof M>(
    field: F,
    metas:
      | (undefined extends M[F] ? undefined : never)
      | M[F][]
      | Record<number, M[F]>
      | Record<string, M[F]>
      | ((value: T, index: number, item: FormArrayItem<T, M>) => M[F]),
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
 * @template T The type of the array's items
 * @template M The type of the items' metadata, must be an object
 * @param values The array to mirror
 * @param setValues The setter for the array
 * @param options.initMetas Function that initate the metadata of each item
 */
export const useFormArray = <
  T, // the array type cloned
  // a map of metadata values to store along each item
  // ex: {errors?: ValidationResult<T>, touched?: boolean}
  M extends Record<string, unknown> = EmptyMetaType,
>(
  values: T[] | undefined,
  setValues: (values: T[]) => void,
  ...[{ initMetas } = {}]: OptionalIfPartial<
    M,
    Partial<FormArrayOptions<T, M>>,
    FormArrayOptions<T, M>
  >
): UseFormArray<T, M> => {
  const [items, setItemsState] = useState<FormArrayItem<T, M>[]>([])
  const itemsRef = useRef(items)

  const initMetaRef = useUpdatedRef(initMetas)
  // reset items if incoherent with the current values
  useEffect(() => {
    if (!areItemsCompatible(values, items)) {
      const items = (values ?? []).map((value, index) => ({
        key: generateKey(),
        index,
        value,
        meta: initMetaRef.current?.(value) || ({} as M),
      }))
      itemsRef.current = items
      setItemsState(items)
    }
  }, [values, items])

  const [appendKey, setAppendKey] = useState(generateKey)
  // an empty item to be used as appendable
  const newItem = useMemo<NewFormArrayItem>(
    () => ({ key: appendKey, newItem: true }),
    [appendKey],
  )

  const setValuesRef = useUpdatedRef(setValues)
  // updates items and values on update
  const updateItems = useCallback(
    (items: FormArrayItem<T, M>[], soft?: boolean) => {
      items = items.map((item, index) =>
        item.index === index ? item : { ...item, index },
      )
      itemsRef.current = items
      setItemsState(items)
      if (!soft) setValuesRef.current(items.map((item) => item.value))
    },
    [],
  )

  const setItems = useCallback(
    (
      action:
        | UpdatedFormArrayItem<T, M>[]
        | ((previous: FormArrayItem<T, M>[]) => UpdatedFormArrayItem<T, M>[]),
    ) => {
      let updatedItems: UpdatedFormArrayItem<T, M>[]
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
                value: item.value,
                meta:
                  item.meta || initMetaRef.current?.(item.value) || ({} as M),
              },
        ),
      )
    },
    [updateItems],
  )

  const setValue = useCallback(
    (index: number, value: T, meta?: M) =>
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
      ),
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
    (value: T, ...[meta]: OptionalIfPartial<M>) => {
      setAppendKey(generateKey())
      updateItems([
        ...itemsRef.current,
        {
          key: appendKey,
          index: itemsRef.current.length,
          value: value,
          meta: meta || ({} as M),
        },
      ])
    },
    [updateItems, appendKey],
  )

  const insertItem = useCallback(
    (index: number, value: T, ...[meta]: OptionalIfPartial<M>) =>
      updateItems([
        ...itemsRef.current.slice(0, index),
        {
          key: generateKey(),
          index,
          value: value,
          meta: meta || ({} as M),
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
    (initMetas?: (value: T) => M) =>
      updateItems(
        itemsRef.current.map((item) => ({
          ...item,
          meta:
            initMetas?.(item.value) ||
            initMetaRef.current?.(item.value) ||
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
                meta: meta || initMetaRef.current?.(item.value) || ({} as M),
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
        | M[F][]
        | Record<number, M[F]>
        | Record<string, M[F]>
        | ((value: T, index: number, item: FormArrayItem<T, M>) => M[F]),
    ) => {
      updateItems(
        itemsRef.current.map((item, i) => ({
          ...item,
          meta: {
            ...item.meta,
            [field]:
              typeof metas === "function"
                ? metas(item.value, item.index, item)
                : metas
                  ? (metas as M[F][] | Record<number, M[F]>)[i]
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

const areItemsCompatible = <T>(
  values: T[] | undefined,
  items: FormArrayItem<T, MetaType>[],
) =>
  (values?.length ?? 0) === items.length &&
  items.every((item, i) => values?.[i] === item.value)
