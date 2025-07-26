# react-form-array

A set of hooks to help managing arrays and maps in a form.

- Provides unique keys and metadata stable through reordering
- Intuitive "new item on user input" mode
- Compatible with `useState` or any form manager
- Simple to use and typed

The following hooks are provided:

- [`useFormArray`](#useformarray) — Manages an array
- [`useFormMap`](#useformmap) — Manages a map (string keys only), optionally ordered

## `useFormArray`

Manages an array. Provides unique key and metadata stable through reordering.

```ts
const array = useFormArray<Type, Meta={}>(values, setValues [, options])
```

#### arguments

- `Type` — The array item type
- `Meta` — The type of metadata, must be an object, default empty
- `values` ( `Type[] | undefined` ) — The array to mirror
- `setValues` ( `(values: Type[]) => void` ) — The setter for the array
- `options`:
  - `initMetas` ( `(value: Type) => Meta` ) — Function that initate the metadata of each item

#### properties

- `items` ( `FormArrayItem<Type, Meta>[]` ) — The mirrored items with unique keys
  - `item.index` — The numberic index of the item
  - `item.key` — A unique key to use as `key={key}` property
  - `item.value` ( `Type` ) — The value associated to the item
  - `item.meta` ( `Meta` ) — The metadata associated to the item
  - `item.newItem` — `true` for `newItem` appendable item
- `appendKey` — The unique key used for the next appened item
- `newItem` ( `NewFormArrayItem` ) — An appendable item to be concatenated with `items`
- `setItems(action)` — Fully reorganizes item, new items can be added as `{value}`
- `setValue(index, value [, meta])` — Sets the value at the given index
- `valueSetter(index) => setter(action)` — Returns a setter for the value at the given index
- `appendItem(value, [, meta])` — Appends a new item with the unique key `appendKey`
- `insertItem(index, value, [, meta])` — Inserts a new item at the given index
- `removeItem(index)` — Removes the item at the given index
- `moveItem(from, to)` — Moves the item at the given index to the given index
- `resetMetas([initMetas])` — Resets the metadata of all the items using a function
- `resetMeta(index, meta)` — Resets the metadata of the item at the given index
- `setMetas(field, metas)` — Sets the metadata associated to a key of all items
  - `metas: undefined` — metadata are reset to `undefined` for the field
  - `metas: {[index]: Meta[field]}` — metadata are reset to value for each key
  - `metas: (value, index, item) => Meta[field]` — metadata are reset using the function
- `setMeta(index, field, meta)` — Sets the metadata associated to a key of the item at the given index
- `metaSetter(index, field) => setter(action)` — Returns a setter for the metadata associated to a key of the item at the given index

### Appendable and removable items

- Concatenate `items` with `newItem` in order to show an appendable item on user input, while maintaining the same `item.key`.
- Use `item.newItem` to identify which item is the appendable item
- Call `appendItem` to append an item on user input with the key `appendKey`.
- Call `setValue` to update an item value.
- Call `removeItem` to remove an item value.

<details>
<summary>Show example code</summary>

```tsx
function DataForm() {
	type Data = { name: string; value: string }
	const [data, setData] = useState<Data[]>([])

	const array = useFormArray(data, setData)

	return (
		<>
			{[...array.items, array.newItem].map(({ index, key, value, newItem }) => (
				<fieldset key={key}>
					{newItem ? (
						<legend>New Item</legend>
					) : (
						<legend>
							Item ${index + 1}{" "}
							<button onClick={() => array.removeItem(index)}>Delete</button>
						</legend>
					)}
					{/* Also use this input to create a new item when user types */}
					<label>
						Name:{" "}
						<input
							value={value?.name ?? ""}
							onChange={({ target: { value: inputValue } }) =>
								newItem
									? inputValue &&
										array.appendItem({ name: inputValue, value: "" })
									: array.setValue(index, { ...value, name: inputValue })
							}
						/>
					</label>
					{/* Only display this input for existing items */}
					{!newItem && (
						<label>
							Value:{" "}
							<input
								value={value.value}
								onChange={({ target: { value: inputValue } }) =>
									array.setValue(index, { ...value, value: inputValue })
								}
								disabled={newItem}
							/>
						</label>
					)}
				</fieldset>
			))}
		</>
	)
}
```

</details>

### Metadata

- Set `initMetas` in order to initiate item metadata (or just to type it).
- Use `item.meta` to read the metadata of an item.
- Call `setMeta` to set a specific field of the metadata to one item.
- Call `setMetas` to set a specific field of the metadata for all the items.

<details>
<summary>Show example code</summary>

```tsx
type Data = {
	name: string
	option1?: boolean
	option2?: boolean
	option3?: boolean
}

function DataForm({
	data,
	setData,
	errors,
}: {
	data: Data[] | undefined
	setData: (data: Data[]) => void
	errors: Partial<Record<number, string>>
}) {
	const array = useFormArray(data, setData, {
		initMetas: (value): { error?: string; showOptions: boolean } => ({
			// On initialization, show the options if any option is checked
			showOptions: value.option1 || value.option2 || value.option3 || false,
		}),
	})

	useEffect(() => {
		array.setMetas("error", errors)
	}, [errors, array.setMetas])

	return (
		<>
			{[...array.items].map(({ index, key, value, meta }) => (
				<fieldset key={key}>
					<legend>Item ${index + 1}</legend>
					<label>
						Name:{" "}
						<input
							value={value.name}
							onChange={({ target: { value: inputValue } }) =>
								array.setValue(index, { ...value, name: inputValue })
							}
						/>
					</label>
					{/* Show the error if any */}
					{meta.error && <span className="error">{meta.error}</span>}
					{/* A foldable component to show the possible options */}
					<span
						onClick={() =>
							array.setMeta(index, "showOptions", !meta.showOptions)
						}
					>
						Show Options
					</span>
					<div style={meta.showOptions ? undefined : { display: "none" }}>
						{(["option1", "option2", "option3"] as const).map((field) => (
							<label key={field}>
								{field}:{" "}
								<input
									type="checkbox"
									checked={value[field] || false}
									onChange={({ target: { checked: inputChecked } }) =>
										array.setValue(index, { ...value, [field]: inputChecked })
									}
								/>
							</label>
						))}
					</div>
				</fieldset>
			))}
		</>
	)
}
```

</details>

### Editing items directly

- Call `setItems` to directly edit the list of items.
- Items can be reordered or filtered.
- Add new items using `{ value: newValue }`.
- Use `UpdatedFormArrayItems<typeof items>` to correctly type the returned items.

<details>
<summary>Show example code</summary>

```ts
function DataForm() {
	type Data = { name: string }
	type Meta = { error?: string }

	const [data, setData] = useState<Data[]>([])

	const array = useFormArray<Data, Meta>(data, setData)

	const sortItems = () =>
		array.setItems((items) =>
			items.sort((a, b) => a.value.name.localeCompare(b.value.name)),
		)

	const removeErrorItems = () =>
		array.setItems((items) => items.filter((item) => !item.meta.error))

	const addItems = (...names: string[]) =>
		array.setItems((items) => [
			...items,
			...names.map((name) => ({
				value: {
					name,
				},
			})),
		])

	const doubleItems = () =>
		array.setItems((items) => {
			const doubledItems: UpdatedFormArrayItems<typeof items> = []
			for (const item of items) {
				doubledItems.push(item, { value: item.value })
			}
			return doubledItems
		})
}
```

</details>

## `useFormMap`

Manages a map. Provides unique key and metadata stable through map key update.

```ts
useFormMap<Type, Key=string, Meta={}>(values, setValues [, options])
```

#### arguments

- `Type` — The map value type
- `Key` — The map key type, must be a string
- `Meta` — The type of metadata, must be an object, default empty
- `values` ( `Record<Key, Type> | undefined` ) — The map to mirror
- `setValues` ( `(values: Record<Key, Type>) => void` ) — The setter for the map
- `options`:
  - `initMetas` ( `(value: Type, mapKey: Key) => Meta` ) — Function that initate the metadata of each item
  - `sort` (`boolean | (entry1, entry2: [Key, Type]) => number`) — `true` to sort map keys on intialization, or a comparator function to provide a specific order

#### properties

- `items` ( `FormMapItem<Type, Key, Meta>[]` ) — The mirrored items with unique keys
  - `item.index` — The numberic index of the item
  - `item.key` — A unique key to use as `key={key}` property
  - `item.mapKey` ( `Key` ) — The map key associated to the item
  - `item.value` ( `Type` ) — The value associated to the item
  - `item.meta` ( `Meta` ) — The metadata associated to the item
  - `item.duplicated` — `true` if several items share this map key
  - `item.ignored` — `true` if this map value isn't used because duplicated
  - `item.newItem` — `true` for `newItem` appendable item
- `appendKey` — The unique key used for the next appened item
- `newItem` ( `NewFormMapItem` ) — An appendable item to be concatenated with `items`
- `setItems(action)` — Fully reorganizes item, new items can be added as `{value}`
- `setMapKey(index, mapKey)` — Sets the map key at the given index
- `setValue(index, value [, meta])` — Sets the value at the given index
- `valueSetter(index) => setter(action)` — Returns a setter for the value at the given index
- `appendItem(mapKey, value, [, meta])` — Appends a new item with the unique key `appendKey`
- `insertItem(index, mapKey, value, [, meta])` — Inserts a new item at the given index
- `removeItem(index)` — Removes the item at the given index
- `moveItem(from, to)` — Moves the item at the given index to the given index
- `resetMetas([initMetas])` — Resets the metadata of all the items using a function
- `resetMeta(index, meta)` — Resets the metadata of the item at the given index
- `setMetas(field, metas)` — Sets the metadata associated to a key of all items
  - `metas: undefined` — metadata are reset to `undefined` for the field
  - `metas: {[key]: Meta[field]}` — metadata are reset to value for each key (`undefined` for ignored items)
  - `metas: (value, key, item) => Meta[field]` — metadata are reset using the function
- `setMeta(index, field, meta)` — Sets the metadata associated to a key of the item at the given index
- `metaSetter(index, field) => setter(action)` — Returns a setter for the metadata associated to a key of the item at the given index

### Appendable and removable items

- Concatenate `items` with `newItem` in order to show an appendable item that can be appended on user input, while maintaining the same `item.key`.
- Use `item.newItem` to identify which item is the appendable item
- Call `appendItem` to append an item with the key `appendKey`.
- Call `setMapKey` to update an item key.
- Call `setValue` to update an item value.
- Call `removeItem` to remove an item.

<details>
<summary>Show example code</summary>

```tsx
function DataForm() {
	const [data, setData] = useState<Record<string, string>>({})

	const map = useFormMap(data, setData)

	return (
		<>
			{[...map.items, map.newItem].map(
				({ index, key, mapKey, value, newItem }) => (
					<fieldset key={key}>
						{newItem ? (
							<legend>New Item</legend>
						) : (
							<legend>
								Item ${index + 1}{" "}
								<button onClick={() => map.removeItem(index)}>Delete</button>
							</legend>
						)}
						{/* Also use this input to create a new item when user types */}
						<label>
							Name:{" "}
							<input
								value={mapKey ?? ""}
								onChange={({ target: { value: inputValue } }) =>
									newItem
										? inputValue && map.appendItem(inputValue, "")
										: map.setMapKey(index, inputValue)
								}
							/>
						</label>
						{/* Only display this input for existing items */}
						{!newItem && (
							<label>
								Value:{" "}
								<input
									value={value}
									onChange={({ target: { value: inputValue } }) =>
										map.setValue(index, inputValue)
									}
									disabled={newItem}
								/>
							</label>
						)}
					</fieldset>
				),
			)}
		</>
	)
}
```

</details>

### Metadata

- Set `initMetas` in order to initiate item metadata (or just to type it).
- Use `item.meta` to read the metadata of an item.
- Call `setMeta` to set a specific field of the metadata to one item.
- Call `setMetas` to set a specific field of the metadata for all the items.
- Use `item.duplicated` to show if the map key is duplicated
- Use `item.ignored` to show if the item is ignored because duplicated

<details>
<summary>Show example code</summary>

```tsx
type Data = {
	name: string
	option1?: boolean
	option2?: boolean
	option3?: boolean
}

function DataForm({
	data,
	setData,
	errors,
}: {
	data: Record<string, Data> | undefined
	setData: (data: Record<string, Data>) => void
	errors: Partial<Record<string, string>>
}) {
	const map = useFormMap(data, setData, {
		initMetas: (value): { error?: string; showOptions: boolean } => ({
			// On initialization, show the options if any option is checked
			showOptions: value.option1 || value.option2 || value.option3 || false,
		}),
	})

	useEffect(() => {
		map.setMetas("error", errors)
	}, [errors, map.setMetas])

	return (
		<>
			{[...map.items].map(
				({ index, key, value, meta, duplicated, ignored }) => (
					<fieldset key={key}>
						<legend>Item ${index + 1}</legend>
						<label style={ignored ? { opacity: 0.6 } : undefined}>
							Name:{" "}
							<input
								value={value.name}
								onChange={({ target: { value: inputValue } }) =>
									map.setValue(index, { ...value, name: inputValue })
								}
							/>
						</label>
						{/* Show the error if any */}
						{duplicated ||
							(meta.error && (
								<span className="error">
									{duplicated ? "duplicated item" : meta.error}
								</span>
							))}
						{/* A foldable component to show the possible options */}
						<span
							onClick={() =>
								map.setMeta(index, "showOptions", !meta.showOptions)
							}
						>
							Show Options
						</span>
						<div style={meta.showOptions ? undefined : { display: "none" }}>
							{(["option1", "option2", "option3"] as const).map((field) => (
								<label key={field}>
									{field}:{" "}
									<input
										type="checkbox"
										checked={value[field] || false}
										onChange={({ target: { checked: inputChecked } }) =>
											map.setValue(index, { ...value, [field]: inputChecked })
										}
									/>
								</label>
							))}
						</div>
					</fieldset>
				),
			)}
		</>
	)
}
```

</details>

### Editing items directly

- Call `setItems` to directly edit the list of items.
- Items can be reordered or filtered.
- Add new items using `{ mapKey: newMapKey, value: newValue }`.
- Use `UpdatedMapArrayItems<typeof items>` to correctly type the returned items.

<details>
<summary>Show example code</summary>

```ts
function DataForm() {
	type Meta = { error?: string }

	const [data, setData] = useState<Record<string, string>>({})

	const map = useFormMap<string, string, Meta>(data, setData)

	const sortItems = () =>
		map.setItems((items) =>
			items.sort((a, b) => a.mapKey.localeCompare(b.mapKey)),
		)

	const removeErrorItems = () =>
		map.setItems((items) => items.filter((item) => !item.meta.error))

	const addItems = (...names: string[]) =>
		map.setItems((items) => [
			...items,
			...names.map((name) => ({
				mapKey: name,
				value: name,
			})),
		])

	const doubleItems = () =>
		map.setItems((items) => {
			const doubledItems: UpdatedFormMapItems<typeof items> = []
			for (const item of items) {
				doubledItems.push(item, {
					mapKey: item.mapKey + "-doubled",
					value: item.value,
				})
			}
			return doubledItems
		})
}
```

</details>
