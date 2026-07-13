"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { GripVertical, RotateCcw, Loader2 } from "lucide-react";
import type { Story, StoryStatus } from "@/lib/client-types";
import StoryModal from "./StoryModal";

type Columns = Record<StoryStatus, Story[]>;

const COLS: { key: StoryStatus; title: string; emoji: string; ring: string }[] = [
  { key: "todo", title: "Por hacer", emoji: "📋", ring: "ring-slate-500/40" },
  { key: "in_progress", title: "En proceso", emoji: "⚙️", ring: "ring-amber-500/40" },
  { key: "done", title: "Terminado", emoji: "✅", ring: "ring-emerald-500/40" },
];

function group(stories: Story[]): Columns {
  const cols: Columns = { todo: [], in_progress: [], done: [] };
  for (const s of stories) cols[s.status].push(s);
  return cols;
}

export default function KanbanBoard({
  initialStories,
  isTeacher,
}: {
  initialStories: Story[];
  isTeacher: boolean;
}) {
  const [columns, setColumns] = useState<Columns>(() => group(initialStories));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Story | null>(null);
  const [reseeding, setReseeding] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function reseed() {
    if (
      !confirm(
        "Esto reemplaza TODAS las historias por la plantilla de 12 semanas y reinicia su estado y criterios. ¿Continuar?"
      )
    )
      return;
    setReseeding(true);
    try {
      const res = await fetch("/api/stories/reseed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast.success(`Tablero reiniciado con ${data.count} historias 🗂️`);
      window.location.reload();
    } catch (e) {
      toast.error((e as Error).message);
      setReseeding(false);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  const activeStory = useMemo(() => {
    if (!activeId) return null;
    for (const k of Object.keys(columns) as StoryStatus[]) {
      const s = columns[k].find((x) => x._id === activeId);
      if (s) return s;
    }
    return null;
  }, [activeId, columns]);

  function findContainer(id: string): StoryStatus | null {
    if (id in columns) return id as StoryStatus;
    for (const k of Object.keys(columns) as StoryStatus[]) {
      if (columns[k].some((s) => s._id === id)) return k;
    }
    return null;
  }

  function schedulePersist(cols: Columns) {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const items: { id: string; status: StoryStatus; order: number }[] = [];
      (Object.keys(cols) as StoryStatus[]).forEach((k) => {
        cols[k].forEach((s, i) => items.push({ id: s._id, status: k, order: i }));
      });
      fetch("/api/stories/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }, 300);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeC = findContainer(String(active.id));
    const overC = findContainer(String(over.id));
    if (!activeC || !overC || activeC === overC) return;

    setColumns((prev) => {
      const activeItems = prev[activeC];
      const overItems = prev[overC];
      const activeIndex = activeItems.findIndex((s) => s._id === active.id);
      if (activeIndex < 0) return prev;
      const moved = { ...activeItems[activeIndex], status: overC };

      let newIndex = overItems.length;
      if (!(String(over.id) in prev)) {
        const overIndex = overItems.findIndex((s) => s._id === over.id);
        if (overIndex >= 0) newIndex = overIndex;
      }
      return {
        ...prev,
        [activeC]: activeItems.filter((s) => s._id !== active.id),
        [overC]: [...overItems.slice(0, newIndex), moved, ...overItems.slice(newIndex)],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const activeC = findContainer(String(active.id));
    const overC = over ? findContainer(String(over.id)) : null;

    setColumns((prev) => {
      let next = prev;
      if (activeC && overC && activeC === overC) {
        const items = prev[activeC];
        const oldIndex = items.findIndex((s) => s._id === active.id);
        let newIndex = items.length - 1;
        if (over && !(String(over.id) in prev)) {
          const oi = items.findIndex((s) => s._id === over.id);
          if (oi >= 0) newIndex = oi;
        }
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          next = { ...prev, [activeC]: arrayMove(items, oldIndex, newIndex) };
        }
      }
      schedulePersist(next);
      return next;
    });
    setActiveId(null);
  }

  // Actualiza una historia en el estado (tras editar criterios en el modal)
  function updateStory(updated: Story) {
    setColumns((prev) => {
      const next = group(
        (Object.values(prev).flat() as Story[]).map((s) =>
          s._id === updated._id ? updated : s
        )
      );
      return next;
    });
    setSelected((s) => (s && s._id === updated._id ? updated : s));
  }

  function removeStory(id: string) {
    setColumns((prev) =>
      group((Object.values(prev).flat() as Story[]).filter((s) => s._id !== id))
    );
    setSelected(null);
  }

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, []);

  return (
    <>
      {isTeacher && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={reseed}
            disabled={reseeding}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
            title="Cargar/actualizar la plantilla de 12 semanas"
          >
            {reseeding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            Reiniciar tablero (12 semanas)
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLS.map((col) => (
            <Column
              key={col.key}
              id={col.key}
              title={col.title}
              emoji={col.emoji}
              ring={col.ring}
              count={columns[col.key].length}
            >
              <SortableContext
                items={columns[col.key].map((s) => s._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex min-h-[120px] flex-col gap-3">
                  {columns[col.key].map((story) => (
                    <SortableCard
                      key={story._id}
                      story={story}
                      onOpen={() => setSelected(story)}
                    />
                  ))}
                  {columns[col.key].length === 0 && (
                    <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                      Arrastra historias aquí
                    </p>
                  )}
                </div>
              </SortableContext>
            </Column>
          ))}
        </div>

        <DragOverlay>
          {activeStory ? <CardBody story={activeStory} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {selected && (
        <StoryModal
          story={selected}
          isTeacher={isTeacher}
          onClose={() => setSelected(null)}
          onUpdate={updateStory}
          onDelete={removeStory}
        />
      )}
    </>
  );
}

function Column({
  id,
  title,
  emoji,
  ring,
  count,
  children,
}: {
  id: string;
  title: string;
  emoji: string;
  ring: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`glass rounded-2xl p-3 ring-1 transition ${ring} ${
        isOver ? "bg-white/10" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 font-bold text-white">
          <span>{emoji}</span> {title}
        </h3>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function SortableCard({ story, onOpen }: { story: Story; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: story._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <CardBody story={story} onOpen={onOpen} handleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function CardBody({
  story,
  onOpen,
  handleProps,
  dragging,
}: {
  story: Story;
  onOpen?: () => void;
  handleProps?: Record<string, unknown>;
  dragging?: boolean;
}) {
  const total = story.acceptanceCriteria.length;
  const done = story.acceptanceCriteria.filter((c) => c.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      layout
      onClick={onOpen}
      className={`cursor-pointer rounded-xl border border-white/10 bg-[#131a2e] p-3 shadow-sm transition hover:border-brand-400/50 ${
        dragging ? "rotate-2 ring-2 ring-brand-400/60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...handleProps}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 cursor-grab touch-none text-slate-500 hover:text-slate-300 active:cursor-grabbing"
          aria-label="Arrastrar"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-md bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-200">
              Semana {story.week}
            </span>
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
              {story.estimation} pts
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug text-white">{story.title}</p>
          {total > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {done}/{total} criterios ✓
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
