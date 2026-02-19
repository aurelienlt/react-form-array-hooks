import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Checkbox,
  InputLabel,
  TextField,
  Typography,
} from "@mui/material"
import { useEffect, useMemo, useState } from "react"
import { useFormMap } from "react-array-hook"

type Data = {
  name: string
  option1?: boolean
  option2?: boolean
  option3?: boolean
}

export function MapMeta() {
  const [data, setData] = useState<Record<string, Data>>({
    first: { name: "nothing selected" },
    second: { name: "" },
    third: { name: "some selected", option1: true, option3: true },
  })
  const errors = useMemo(() => {
    const errors: Partial<Record<string, string>> = {}
    for (const [key, item] of Object.entries(data ?? {})) {
      if (!item.name) errors[key] = "name required"
    }
    return errors
  }, [data])
  return <DataForm data={data} setData={setData} errors={errors} />
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
