"use client";

import { Button, Collapse } from "antd";
import { DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, HolderOutlined } from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * A single sortable row: drag handle + collapse panel (header + content).
 * Uses index (name) as the sortable id.
 */
function SortableRow({
  id,
  itemTitle,
  itemIndex,
  totalItems,
  children,
  reorderClassName,
  onMoveUp,
  onMoveDown,
  onRemove,
  hideRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const label = (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingRight: 8,
        gap: 4,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: "grab",
            color: "#999",
            display: "flex",
            alignItems: "center",
            touchAction: "none",
          }}
          title="Drag to reorder"
        >
          <HolderOutlined />
        </span>
        <strong>{itemTitle}</strong>
      </span>
      <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <Button
          type="text"
          size="small"
          icon={<ArrowUpOutlined />}
          disabled={itemIndex === 0}
          onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
          title="Move up"
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowDownOutlined />}
          disabled={itemIndex === totalItems - 1}
          onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
          title="Move down"
        />
        {!hideRemove && totalItems > 1 && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          />
        )}
      </span>
    </span>
  );

  return (
    <div ref={setNodeRef} style={style} className={reorderClassName}>
      <Collapse
        size="small"
        defaultActiveKey={[String(id)]}
        items={[
          {
            key: String(id),
            label,
            children,
          },
        ]}
      />
    </div>
  );
}

/**
 * Sortable drag-and-drop list for Form.List with accordion-style rows.
 * Renders DndContext + SortableContext and a list of sortable rows (drag handle, up/down/delete, collapsible content).
 *
 * @param {object} props
 * @param {Array} props.fields - From Form.List render props
 * @param {Function} props.add - From Form.List
 * @param {Function} props.remove - From Form.List
 * @param {Function} props.move - From Form.List
 * @param {string} props.itemLabel - e.g. "Item", "Slide"
 * @param {Function} props.renderItemContent - (name, restField) => ReactNode
 * @param {number} props.reorderMovedIndex - For transition class (-1 when none)
 * @param {string} props.reorderDirection - "up" | "down"
 * @param {string} [props.addButtonText] - e.g. "Add item", "Add slide"
 */
export default function SortableFormList({
  fields,
  add,
  remove,
  move,
  itemLabel = "Item",
  renderItemContent,
  reorderMovedIndex = -1,
  reorderDirection = "up",
  addButtonText = "Add item",
  defaultAddPayload,
  onMoveWithTransition,
  resolveItemTitle,
  hideRemove = false,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMove = (from, to) => {
    move(from, to);
    onMoveWithTransition?.(from, to);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over != null && active.id !== over.id) {
      const from = Number(active.id);
      const to = Number(over.id);
      if (!Number.isNaN(from) && !Number.isNaN(to)) {
        move(from, to);
        onMoveWithTransition?.(from, to);
      }
    }
  };

  const ids = fields.map((f) => f.name);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="sortable-form-list" style={{ marginBottom: 12 }}>
            {fields.map(({ key, name, ...restField }) => (
              <SortableRow
                key={key}
                id={name}
                itemTitle={
                  typeof resolveItemTitle === "function"
                    ? resolveItemTitle(name)
                    : `${itemLabel} ${name + 1}`
                }
                itemIndex={name}
                totalItems={fields.length}
                reorderClassName={
                  reorderMovedIndex === name
                    ? `admin-reorder-moved-${reorderDirection}`
                    : undefined
                }
                onMoveUp={() => handleMove(name, name - 1)}
                onMoveDown={() => handleMove(name, name + 1)}
                onRemove={() => remove(name)}
                hideRemove={hideRemove}
              >
                {renderItemContent ? renderItemContent(name, restField) : null}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => add(defaultAddPayload)}
          title="Add New"
        />
      </div>
    </>
  );
}
