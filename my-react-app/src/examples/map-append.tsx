import { Box, IconButton, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { useFormMap } from "react-array-hook"

export function MapAppend() {
  const [data, setData] = useState<Record<string, string>>({
    first: "first value",
    second: "second value",
    third: "third value",
  })

  return <DataForm data={data} setData={setData} />
}

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
