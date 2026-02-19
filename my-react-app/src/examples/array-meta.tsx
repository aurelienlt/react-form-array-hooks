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
import { useFormArray } from "react-array-hook"

type Data = {
  name: string
  option1?: boolean
  option2?: boolean
  option3?: boolean
}

export function ArrayMeta() {
  const [data, setData] = useState<Data[]>([
    { name: "nothing selected" },
    { name: "" },
    { name: "some selected", option1: true, option3: true },
  ])
  const errors = useMemo(() => {
    const errors: Partial<Record<number, string>> = {}
    for (const [index, item] of (data ?? []).entries()) {
      if (!item.name) errors[index] = "name required"
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
