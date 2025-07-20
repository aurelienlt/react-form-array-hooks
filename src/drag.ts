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
	/** The classes to assign to each element by index */
	draggingClassNames: Partial<Record<number, string>>
	/** To be asigned to the draggable elements as `onDragStart={event => onDragStart(index, event)}` */
	onDragStart: (index: number, event: DragEvent) => void
	/** To be asigned to the drop target elements as `onDragOver={event => onDragOver(index, event)}` */
	onDragOver: (index: number, event: DragEvent) => void
	/** To be asigned to the drop target elements as `onDrop={onDrop}` */
	onDrop: (event: DragEvent) => void
	/**
	 * - To be asigned to the draggable elements as `onDragEnd={onDragEnd}` */
	onDragEnd: () => void
	/** Cancels any ongoing drag & drop, can be assign to container element as `onMouseLeave={resetDragging}` */
	resetDragging: () => void
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
	draggingContainerProps: (index: number) => {
		onMouseLeave: () => void
	}
}

export const useFormDrag = (
	moveItem: (from: number, to: number) => void,
	opts?: {
		format?: string
		classNames?: UseFormDragClasses
		styling?: boolean
	},
): UseFormDrag => {
	const {
		format: optsFormat,
		classNames: optsClassNames = DRAG_CLASSES,
		styling,
	} = opts ?? {}
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

	const [draggingSource, setDraggingSource] = useState(-1)
	const [draggingTarget, setDraggingTarget] = useState(-1)

	const onDragStart = useCallback(
		(index: number, event: DragEvent) => {
			// start drag-and-drop by setting those
			setDraggingSource(index)
			setDraggingTarget(-1)
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
				setDraggingTarget(-1)
				event.dataTransfer.dropEffect = "none"
			} else {
				setDraggingTarget(index)
				event.dataTransfer.dropEffect = "move"
			}
		},
		[draggingSource, format],
	)

	const onDrop = useCallback(
		(event: DragEvent) => {
			console.log("!!! onDrop", draggingSource, draggingTarget)
			if (draggingSource < 0) return
			event.preventDefault()
			moveItemRef.current(draggingSource, draggingTarget)
			setDraggingSource(-1)
			setDraggingTarget(-1)
		},
		[draggingSource, draggingTarget],
	)

	const onDragEnd = useCallback(() => {
		setDraggingSource(-1)
		setDraggingTarget(-1)
	}, [])

	const {
		source: classSource = "",
		target: classTarget = "",
		before: classBefore = "",
		after: classAfter = "",
	} = classNames
	const draggingClassNames = useMemo(() => {
		const classNames: Partial<Record<number, string>> = {}
		if (draggingSource < 0) return classNames
		classNames[draggingSource] = classSource
		if (draggingTarget < 0) return classNames
		const classPosition =
			draggingTarget < draggingSource ? classBefore : classAfter
		classNames[draggingTarget] = `${classTarget} ${classPosition}`
		return classNames
	}, [
		draggingSource,
		draggingTarget,
		classSource,
		classTarget,
		classBefore,
		classAfter,
	])

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

	const draggingContainerProps = useCallback(
		(index: number) => ({
			onMouseLeave: onDragEnd,
		}),
		[onDragEnd],
	)

	return useMemo(
		() => ({
			draggingSource,
			draggingTarget,
			draggingClassNames,
			onDragStart,
			onDragOver,
			onDrop,
			onDragEnd,
			resetDragging: onDragEnd,
			draggableProps,
			droppableProps,
			draggingContainerProps,
		}),
		[
			draggingSource,
			draggingTarget,
			draggingClassNames,
			onDragStart,
			onDragOver,
			onDrop,
			onDragEnd,
			draggableProps,
			droppableProps,
			draggingContainerProps,
		],
	)
}
