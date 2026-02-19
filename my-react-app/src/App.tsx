import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material"
import { ArrayAppend } from "./examples/array-append"
import { ArrayMeta } from "./examples/array-meta"
import { MapAppend } from "./examples/map-append"
import { MapMeta } from "./examples/map-meta"
import { Drag } from "./examples/drag"

function App() {
  return (
    <div>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h4">Array Append</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ArrayAppend />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h4">Array Meta</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ArrayMeta />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h4">Map Append</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <MapAppend />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h4">Map Meta</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <MapMeta />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary>
          <Typography variant="h4">Drag & Drop</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Drag />
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default App
