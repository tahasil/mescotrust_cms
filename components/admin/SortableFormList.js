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
import styled from "styled-components";

const StyledCollapse = styled(Collapse)`
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;

  .ant-collapse-item {
    min-width: 0 !important;
    max-width: 100% !important;
  }

  .ant-collapse-header {
    display: flex !important;
    align-items: center !important;
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  .ant-collapse-header-text {
    flex: 1 1 0% !important;
    min-width: 0 !important;
    width: 0 !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }
`;

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
  defaultExpanded = false,
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        minWidth: 0,
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          flex: "1 1 0%",
          overflow: "hidden",
        }}
      >
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: "grab",
            color: "#999",
            display: "flex",
            alignItems: "center",
            touchAction: "none",
            flexShrink: 0,
          }}
          title="Drag to reorder"
        >
          <HolderOutlined />
        </span>
        <strong
          style={{
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            width: "100%",
            display: "block",
            color: "#1f2937",
          }}
          title={typeof itemTitle === "string" ? itemTitle : undefined}
        >
          {itemTitle}
        </strong>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          flexShrink: 0,
          marginLeft: 4,
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<ArrowUpOutlined />}
          disabled={itemIndex === 0}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp?.();
          }}
          title="Move up"
        />
        <Button
          type="text"
          size="small"
          icon={<ArrowDownOutlined />}
          disabled={itemIndex === totalItems - 1}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown?.();
          }}
          title="Move down"
        />
        {!hideRemove && totalItems > 1 && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div ref={setNodeRef} style={{ ...style, minWidth: 0, width: "100%", maxWidth: "100%" }} className={reorderClassName}>
      <StyledCollapse
        size="small"
        destroyInactivePanel={false}
        defaultActiveKey={defaultExpanded ? [String(id)] : []}
        items={[
          {
            key: String(id),
            label,
            children,
            forceRender: true,
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
 * @param {boolean} [props.hideRemove=false]
 * @param {boolean} [props.hideAdd=false]
 * @param {boolean} [props.defaultExpanded=true]
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
  hideAdd = false,
  defaultExpanded = false,
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
                defaultExpanded={defaultExpanded}
              >
                {renderItemContent ? renderItemContent(name, restField) : null}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {!hideAdd && (
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
      )}
    </>
  );
}
