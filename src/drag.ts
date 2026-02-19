import { useState, useMemo, useCallback, DragEvent } from "react"

import { mapEntries, useUpdatedRef } from "./utils"
import "./drag.css"

let DRAG_ID = 0

/** The classes created on dragging */
export type UseFormDragClasses = {
  /** Assigned to the source of the drag & drop */
  source?: string
  /** Assigned to the target of the drag & drop */
  target?: string
  /** Assigned to the target of the drag & drop if before the source */
  before?: string
  /** Assigned to the target of the drag & drop if before after source */
  after?: string
}

const DRAG_CLASSES = {
  source: "use-form-drag-source",
  target: "use-form-drag-target",
  before: "use-form-drag-before",
  after: "use-form-drag-after",
}

const DRAG_CLASSES_STYLED = {
  source: "use-form-drag-source-styled",
  target: "use-form-drag-target-styled",
  before: "use-form-drag-before-styled",
  after: "use-form-drag-after-styled",
}

/** The status of a drag & drop operation */
export type UseFormDrag = {
  /** The index of the source of the drag & drop, `-1` if none */
  draggingSource: number
  /** The index of the target of the drag & drop, `-1` if none */
  draggingTarget: number
  /** If the drop is set before or after the target, `"after"` when the target if after the source, `"before"` otherwise, unless set manually */
  draggingDirection: "before" | "after" | undefined
  /** The classes to assign to each element by index */
  draggingClassNames: (index: number) => string
  /** To be asigned to the draggable elements as `onDragStart={event => onDragStart(index, event)}` */
  onDragStart: (index: number, event: DragEvent) => void
  /** To be asigned to the drop target elements as `onDragOver={event => onDragOver(index, event)}` */
  onDragOver: (index: number, event: DragEvent) => void
  /** To be asigned to the drop target elements as `onDrop={onDrop}` */
  onDrop: (event: DragEvent) => void
  /** To be asigned to the draggable elements as `onDragEnd={onDragEnd}` */
  onDragEnd: () => void
  /** Cancels any ongoing drag & drop, can be assign to container element as `onMouseLeave={resetDragging}` */
  resetDragging: () => void
  /** Manually sets `draggingSource`, `draggingTarget` and `draggingDirection`, not recommended */
  setDragging: (
    source?: number,
    target?: number,
    direction?: "before" | "after",
  ) => void
  /** The properties to pass to the draggable elements */
  draggableProps: (index: number | undefined) =>
    | {
        draggable: boolean
        onDragStart: (event: DragEvent) => void
        onDragEnd: () => void
      }
    | {
        draggable?: undefined
        onDragStart?: undefined
        onDragEnd?: undefined
      }
  /** The properties to pass to the drop target elements */
  droppableProps: (index: number | undefined) =>
    | {
        onDragOver: (event: DragEvent) => void
        onDrop: (event: DragEvent) => void
      }
    | {
        onDragOver?: undefined
        onDrop?: undefined
      }
  /** The properties to pass to the dragging container (cancels drag & drop on mouse leave event) */
  draggingContainerProps: {
    onMouseLeave: () => void
  }
}

/**
 * Returns a utility object for management drag & drop on an array
 * @param moveItem The function to move an item when dropped
 * @param options.format The format set to the drag event
 * @param options.classNames The classes to be used in various cases
 * @param options.styling `true` to use the default styling
 */
export const useFormDrag = (
  moveItem: (from: number, to: number) => void,
  options?: {
    format?: string
    classNames?: UseFormDragClasses
    styling?: boolean
  },
): UseFormDrag => {
  const {
    format: optsFormat,
    classNames: optsClassNames = DRAG_CLASSES,
    styling,
  } = options ?? {}
  const dfltFormat = useMemo(() => {
    DRAG_ID++
    return `use-form-drag/id-${DRAG_ID}`
  }, [])
  const format = optsFormat || dfltFormat
  const classNames = { ...optsClassNames }
  if (styling) {
    for (const [k, s] of mapEntries(DRAG_CLASSES_STYLED)) {
      classNames[k] =
        classNames[k] && s ? `${classNames[k]} ${s}` : classNames[k] || s
    }
  }

  const moveItemRef = useUpdatedRef(moveItem)

  const [
    { draggingSource, draggingTarget, draggingDirection },
    setDraggingState,
  ] = useState<{
    draggingSource: number
    draggingTarget: number
    draggingDirection?: "before" | "after"
  }>({
    draggingSource: -1,
    draggingTarget: -1,
  })

  const onDragStart = useCallback(
    (index: number, event: DragEvent) => {
      // start drag-and-drop by setting those
      setDraggingState({ draggingSource: index, draggingTarget: -1 })
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData(format, index.toString())
    },
    [format],
  )

  const onDragOver = useCallback(
    (index: number, event: DragEvent) => {
      if (draggingSource < 0) return
      if (
        event.dataTransfer.effectAllowed !== "move" ||
        !event.dataTransfer.types.includes(format)
      ) {
        return
      }
      event.preventDefault()
      if (index === draggingSource) {
        setDraggingState({ draggingSource, draggingTarget: -1 })
        event.dataTransfer.dropEffect = "none"
      } else {
        setDraggingState({
          draggingSource,
          draggingTarget: index,
          draggingDirection: draggingSource < index ? "after" : "before",
        })
        event.dataTransfer.dropEffect = "move"
      }
    },
    [draggingSource, format],
  )

  const onDrop = useCallback(
    (event: DragEvent) => {
      if (draggingSource < 0) return
      event.preventDefault()
      moveItemRef.current(draggingSource, draggingTarget)
      setDraggingState({ draggingSource: -1, draggingTarget: -1 })
    },
    [draggingSource, draggingTarget],
  )

  const onDragEnd = useCallback(() => {
    setDraggingState({ draggingSource: -1, draggingTarget: -1 })
  }, [])

  const resetDragging = useCallback(() => {
    setDraggingState({ draggingSource: -1, draggingTarget: -1 })
  }, [])

  const setDragging = useCallback(
    (source = -1, target = -1, direction?: "before" | "after") => {
      direction =
        target < 0
          ? undefined
          : direction
            ? direction
            : source < target
              ? "after"
              : "before"
      setDraggingState({
        draggingSource: source,
        draggingTarget: target,
        draggingDirection: direction,
      })
    },
    [],
  )

  const {
    source: classSource = "",
    target: classTarget = "",
    before: classBefore = "",
    after: classAfter = "",
  } = classNames
  const draggingClassNames = useCallback(
    (index: number) => {
      const classNames: string[] = []
      if (index === draggingSource) classNames.push(classSource)
      if (index === draggingTarget) classNames.push(classTarget)
      if (draggingDirection === "before") {
        if (index === draggingTarget - 1) classNames.push(classAfter)
        if (index === draggingTarget) classNames.push(classBefore)
      }
      if (draggingDirection === "after") {
        if (index === draggingTarget) classNames.push(classAfter)
        if (index === draggingTarget + 1) classNames.push(classBefore)
      }
      return classNames.join(" ")
    },
    [
      draggingSource,
      draggingTarget,
      classSource,
      classTarget,
      classBefore,
      classAfter,
    ],
  )

  const draggableProps = useCallback(
    (index: number | undefined) =>
      typeof index === "number"
        ? {
            draggable: true,
            onDragStart: (event: DragEvent) => onDragStart(index, event),
            onDragEnd: onDragEnd,
          }
        : {},
    [onDragStart, onDragEnd],
  )

  const droppableProps = useCallback(
    (index: number | undefined) =>
      typeof index === "number"
        ? {
            onDragOver: (event: DragEvent) => onDragOver(index, event),
            onDrop: onDrop,
          }
        : {},
    [onDragOver, onDrop],
  )

  const draggingContainerProps = useMemo(
    () => ({
      onMouseLeave: resetDragging,
    }),
    [resetDragging],
  )

  return useMemo(
    () => ({
      draggingSource,
      draggingTarget,
      draggingDirection,
      draggingClassNames,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      resetDragging,
      setDragging,
      draggableProps,
      droppableProps,
      draggingContainerProps,
    }),
    [
      draggingSource,
      draggingTarget,
      draggingDirection,
      draggingClassNames,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      resetDragging,
      setDragging,
      draggableProps,
      droppableProps,
      draggingContainerProps,
    ],
  )
}
