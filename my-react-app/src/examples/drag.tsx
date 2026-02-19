import { Box, Chip, Typography } from "@mui/material"
import { useState } from "react"
import { useFormArray, useFormDrag } from "react-array-hook"

export function Drag() {
  const [data, setData] = useState([
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
  ])

  return <DataForm data={data} setData={setData} />
}

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
