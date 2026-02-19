import { Box, IconButton, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { useFormArray } from "react-array-hook"

type Data = { name: string; value: string }

export function ArrayAppend() {
  const [data, setData] = useState<Data[]>([
    { name: "first item", value: "first value" },
    { name: "second item", value: "second value" },
    { name: "third item", value: "third value" },
  ])

  return <DataForm data={data} setData={setData} />
}

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
