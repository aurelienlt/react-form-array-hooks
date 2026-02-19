# react-array-hook

A set of hooks to help managing arrays and maps in a form.

- Provides unique keys and metadata stable through reordering
- Intuitive "new item on user input" mode
- Provides a simple drag & drop reordering hook
- Compatible with `useState` or any form manager
- Simple to use and typed

The following hooks are provided:

- [`useFormArray`](#useformarray) — Manages an array
- [`useFormMap`](#useformmap) — Manages a map (string keys only), optionally ordered
- [`useFormDrag`](#useformdrag) — Manages drag & drop reordering

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
type Data = { name: string; value: string }

export function DataForm({
  data,
  setData,
}: {
  data: Data[] | undefined
  setData: (data: Data[]) => void
}) {
  const array = useFormArray(data, setData)

  return (
    <>
      {[...array.items, array.newItem].map(({ index, key, value, newItem }) => (
        <Box component="fieldset" key={key}>
          <legend>
            {newItem ? (
              <Typography>New Item</Typography>
            ) : (
              <Typography>
                <IconButton onClick={() => array.removeItem(index)}>
                  X
                </IconButton>
                Item {index + 1}
              </Typography>
            )}
          </legend>
          {/* Also use this input to create a new item when user types */}
          <TextField
            label="Name"
            value={value?.name ?? ""}
            onChange={({ target: { value: inputValue } }) =>
              newItem
                ? inputValue &&
                  array.appendItem({ name: inputValue, value: "" })
                : array.setValue(index, { ...value, name: inputValue })
            }
          />
          {/* Only display this input for existing items */}
          {!newItem && (
            <TextField
              label="Value"
              value={value.value}
              onChange={({ target: { value: inputValue } }) =>
                array.setValue(index, { ...value, value: inputValue })
              }
              disabled={newItem}
            />
          )}
        </Box>
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

  const { setMetas } = array
  useEffect(() => {
    setMetas("error", errors)
  }, [errors, setMetas])

  return (
    <>
      {array.items.map(({ index, key, value, meta }) => (
        <Box component="fieldset" key={key}>
          <legend>
            <Typography>Item {index + 1}</Typography>
          </legend>
          <TextField
            label="Name"
            value={value.name}
            onChange={({ target: { value: inputValue } }) =>
              array.setValue(index, { ...value, name: inputValue })
            }
          />
          {/* Show the error if any */}
          {meta.error && <Alert color="error">{meta.error}</Alert>}
          {/* A foldable component to show the possible options */}
          <Accordion
            expanded={meta.showOptions}
            onChange={(_, expanded) =>
              array.setMeta(index, "showOptions", expanded)
            }
          >
            <AccordionSummary>Show Options</AccordionSummary>
            <AccordionDetails>
              {(["option1", "option2", "option3"] as const).map((field) => (
                <InputLabel key={field}>
                  {field}:{" "}
                  <Checkbox
                    checked={value[field] || false}
                    onChange={({ target: { checked: inputChecked } }) =>
                      array.setValue(index, { ...value, [field]: inputChecked })
                    }
                  />
                </InputLabel>
              ))}
            </AccordionDetails>
          </Accordion>
        </Box>
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
type Data = { name: string }
type Meta = { error?: string }

function DataForm({
  data,
  setData,
}: {
  data: Record<string, string> | undefined
  setData: (data: Record<string, string>) => void
}) {
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
function DataForm({
  data,
  setData,
}: {
  data: Record<string, string> | undefined
  setData: (data: Record<string, string>) => void
}) {
  const map = useFormMap(data, setData)

  return (
    <>
      {[...map.items, map.newItem].map(
        ({ index, key, mapKey, value, newItem }) => (
          <Box component="fieldset" key={key}>
            <legend>
              {newItem ? (
                <Typography>New Item</Typography>
              ) : (
                <Typography>
                  <IconButton onClick={() => map.removeItem(index)}>
                    X
                  </IconButton>
                  Item {index + 1}
                </Typography>
              )}
            </legend>
            {/* Also use this input to create a new item when user types */}
            <TextField
              label="Name"
              value={mapKey ?? ""}
              onChange={({ target: { value: inputValue } }) =>
                newItem
                  ? inputValue && map.appendItem(inputValue, "")
                  : map.setMapKey(index, inputValue)
              }
            />
            {/* Only display this input for existing items */}
            {!newItem && (
              <TextField
                label="Value"
                value={value}
                onChange={({ target: { value: inputValue } }) =>
                  map.setValue(index, inputValue)
                }
                disabled={newItem}
              />
            )}
          </Box>
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
  errors: Partial<Record<number, string>>
}) {
  const map = useFormMap(data, setData, {
    initMetas: (value): { error?: string; showOptions: boolean } => ({
      // On initialization, show the options if any option is checked
      showOptions: value.option1 || value.option2 || value.option3 || false,
    }),
  })

  const { setMetas } = map
  useEffect(() => {
    setMetas("error", errors)
  }, [errors, setMetas])

  return (
    <>
      {map.items.map(
        ({ index, key, mapKey, value, meta, duplicated, ignored }) => (
          <Box component="fieldset" key={key}>
            <legend>
              <Typography>Item: {mapKey}</Typography>
            </legend>
            <TextField
              sx={ignored ? { opacity: 0.6 } : undefined}
              label="Name"
              value={value.name}
              onChange={({ target: { value: inputValue } }) =>
                map.setValue(index, { ...value, name: inputValue })
              }
            />
            {/* Show the error if any */}
            {(duplicated || meta.error) && (
              <Alert color="error">
                {duplicated ? "duplicated item" : meta.error}
              </Alert>
            )}
            {/* A foldable component to show the possible options */}
            <Accordion
              expanded={meta.showOptions}
              onChange={(_, expanded) =>
                map.setMeta(index, "showOptions", expanded)
              }
            >
              <AccordionSummary>Show Options</AccordionSummary>
              <AccordionDetails>
                {(["option1", "option2", "option3"] as const).map((field) => (
                  <InputLabel key={field}>
                    {field}:{" "}
                    <Checkbox
                      checked={value[field] || false}
                      onChange={({ target: { checked: inputChecked } }) =>
                        map.setValue(index, { ...value, [field]: inputChecked })
                      }
                    />
                  </InputLabel>
                ))}
              </AccordionDetails>
            </Accordion>
          </Box>
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
type Meta = { error?: string }

function DataForm({
  data,
  setData,
}: {
  data: Record<string, string> | undefined
  setData: (data: Record<string, string>) => void
}) {
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

## `useFormDrag`

Manages drag & drop reordering. Provides all the event listeners to simply manage drag & drop.

```ts
const drag = useFormDrag(moveItem [, options])
```

#### arguments

- `moveItem` ( `(from: number, to: number) => void` ) — The function that moves the item when dropped, can use `array.moveItem` from `useFormArray`
- `options`:
  - `format` ( `string` ) — The format set to the drag event, a unique one will be generated by if none provided
  - `classNames` ( `UseFormDragClasses` ) — The classes to be used in various cases
  - `styling` ( `boolean` ) — `true` to use the default styling

#### properties

- `draggingSource` ( `number` ) —  The index of the source of the drag & drop, `-1` if none
- `draggingTarget` ( `number` ) —  The index of the target of the drag & drop, `-1` if none
- `draggingDirection` ( `"before" | "after" | undefined` ) — If the drop is set before or after the target, `"after"` when the target if after the source, `"before"` otherwise, unless set manually
- `draggingClassNames(index)` ( `string` ) —  The classes to assign to each element by index
- `onDragStart(index, event)` —  To be asigned to the drop target elements as `onDragOver={event => onDragOver(index, event)}`
- `onDragOver(index, event)` —  To be asigned to the drop target elements as `onDragOver={event => onDragOver(index, event)}`
- `onDrop(event)` —  To be asigned to the drop target elements as `onDrop={onDrop}`
- `onDragEnd()` —  To be asigned to the draggable elements as `onDragEnd={onDragEnd}`
- `resetDragging()` —  Cancels any ongoing drag & drop, can be assign to container element as `onMouseLeave={resetDragging}`
- `setDragging(source=-1, target=-1, direction?)` — Manually sets `draggingSource`, `draggingTarget` and `draggingDirection`, not recommended
- `draggableProps(index)` ( `HTMLProps` ) —  The properties to pass to the draggable elements
- `droppableProps(index)` ( `HTMLProps` ) —  The properties to pass to the drop target elements
- `draggingContainerProps` ( `HTMLProps` ) —  The properties to pass to the dragging container (cancels drag & drop on mouse leave event)

#### classes

By default, `draggingClassNames` will assign classes `use-form-drag-source`, `use-form-drag-target`, `use-form-drag-before` and `use-form-drag-after` to the items. Add CSS properties to those classes to show the status of the drag & drop, or pass your own `{classNames: {source: "", target: "", before: "", after: ""}}` option.

The `source` class is assigned to the item being dragged, the `target` class is assigned to the item being hovered, and the `before` and `after` classes are assigned the the item right before and after the the position where the item will be inserted.

When passing the option `{styled: true}`, additional classes will be assigned to show the default (and ugly) dragging effect: the item being dragged is half transparent, and the dropping target is an grey rounded rectangle. 

### Basic usage

- Assign `{...drag.draggableProps(index)}` to an icon or an element that is used to trigger dragging
- Assign `className={drag.draggingClassNames(index)}` and `{...drag.droppableProps(index)}` to the root element of each item
- Assign `{...drag.draggingContainerProps}` to the container of the items or an ancestor
- Pass the option `{styled: true}` or add CSS to the default classes

<details>
<summary>Show example code</summary>

```tsx
function DataForm({
  data,
  setData,
}: {
  data: string[] | undefined
  setData: (data: string[]) => void
}) {
  const array = useFormArray(data, setData)
  const drag = useFormDrag(array.moveItem, { styling: true })

  return (
    <div {...drag.draggingContainerProps}>
      {array.items.map(({ index, key, value }) => (
        <div
          className={drag.draggingClassNames(index)}
          {...drag.droppableProps(index)}
          key={key}
        >
          <Box component="fieldset">
            <legend>
              <Typography>Drop here</Typography>
            </legend>
            <Typography>
              <Chip label="Drag here" {...drag.draggableProps(index)} /> {value}
            </Typography>
          </Box>
        </div>
      ))}
    </div>
  )
}
```

</details>
