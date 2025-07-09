"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface KpiConfigDrawerProps {
  kpiOrder: string[];
  setKpiOrder: (order: string[]) => void;
  objectives: Record<string, number>;
  setObjectives: (o: Record<string, number>) => void;
  hiddenKpisGeneral: Set<string>;
  setHiddenKpisGeneral: (h: Set<string>) => void;
  hiddenKpisCollab: Set<string>;
  setHiddenKpisCollab: (h: Set<string>) => void;
  hiddenClosers: Set<number>;
  setHiddenClosers: (h: Set<number>) => void;
  closers: { id: number; name: string }[];
}

export default function KpiConfigDrawer({
  kpiOrder,
  setKpiOrder,
  objectives,
  setObjectives,
  hiddenKpisGeneral,
  setHiddenKpisGeneral,
  hiddenKpisCollab,
  setHiddenKpisCollab,
  hiddenClosers,
  setHiddenClosers,
  closers,
}: KpiConfigDrawerProps) {
  const [open, setOpen] = useState(false);
  // State for import textarea
  const [importText, setImportText] = useState("");
  const sensors = useSensors(useSensor(PointerSensor));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Configure KPIs</Button>
      </DialogTrigger>
      <DialogContent className="p-6 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-2xl font-bold mb-4">
          KPIs Configuration
        </DialogTitle>
        <h3 className="text-lg font-semibold mb-4">Objectives</h3>
        {kpiOrder.map((key) => (
          <div key={key} className="flex items-center gap-2 mb-2">
            <label className="w-40">{key}</label>
            <Input
              type="number"
              value={objectives[key] ?? ""}
              onChange={(e) => setObjectives({ ...objectives, [key]: +e.target.value })}
            />
          </div>
        ))}
        <h3 className="text-lg font-semibold my-4">Order KPIs</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (over) {
              const oldIndex = kpiOrder.indexOf(active.id as string);
              const newIndex = kpiOrder.indexOf(over.id as string);
              if (oldIndex !== newIndex) {
                setKpiOrder(arrayMove(kpiOrder, oldIndex, newIndex));
              }
            }
          }}
        >
          <SortableContext
            items={kpiOrder}
            strategy={verticalListSortingStrategy}
          >
            {kpiOrder.map((key) => (
              <SortableItem key={key} id={key} />
            ))}
          </SortableContext>
        </DndContext>
        <h3 className="text-lg font-semibold my-4">Ocultar KPIs – General</h3>
        {kpiOrder.map((key) => (
          <div key={key} className="flex items-center gap-2 mb-2">
            <label className="flex-1">{key}</label>
            <Switch
              checked={!hiddenKpisGeneral.has(key)}
              onCheckedChange={(val) => {
                const copy = new Set(hiddenKpisGeneral);
                if (!val) copy.add(key);
                else copy.delete(key);
                setHiddenKpisGeneral(copy);
              }}
            />
          </div>
        ))}
        <h3 className="text-lg font-semibold my-4">Ocultar KPIs – Colaboradores</h3>
        {kpiOrder.map((key) => (
          <div key={key} className="flex items-center gap-2 mb-2">
            <label className="flex-1">{key}</label>
            <Switch
              checked={!hiddenKpisCollab.has(key)}
              onCheckedChange={(val) => {
                const copy = new Set(hiddenKpisCollab);
                if (!val) copy.add(key);
                else copy.delete(key);
                setHiddenKpisCollab(copy);
              }}
            />
          </div>
        ))}
        <h3 className="text-lg font-semibold my-4">Hide Closers</h3>
        {closers.map((c) => (
          <div key={c.id} className="flex items-center gap-2 mb-1">
            <label className="flex-1">{c.name}</label>
            <Switch
              checked={!hiddenClosers.has(c.id)}
              onCheckedChange={(val) => {
                const copy = new Set(hiddenClosers);
                if (!val) copy.add(c.id);
                else copy.delete(c.id);
                setHiddenClosers(copy);
              }}
            />
          </div>
        ))}
      {/* Export / Import Config */}
      <h3 className="text-lg font-semibold my-4">Exportar / Importar Configuración</h3>
      <div className="space-y-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => {
            const cfg = {
              kpiOrder,
              objectives,
              hiddenKpisGeneral: Array.from(hiddenKpisGeneral),
              hiddenKpisCollab: Array.from(hiddenKpisCollab),
              hiddenClosers: Array.from(hiddenClosers),
            };
            const json = JSON.stringify(cfg, null, 2);
            navigator.clipboard.writeText(json);
            alert('Configuración copiada al portapapeles');
          }}
        >
          Exportar Config
        </button>
        <div>
          <label htmlFor="import-config" className="block text-sm">
            Pega JSON aquí para importar:
          </label>
          <textarea
            id="import-config"
            rows={5}
            className="w-full border rounded p-2"
            placeholder="{ ... }"
            onChange={(e) => setImportText(e.target.value)}
            value={importText}
          />
          <button
            className="mt-1 px-3 py-1 bg-green-600 text-white rounded"
            onClick={() => {
              try {
                const cfg = JSON.parse(importText);
                setKpiOrder(cfg.kpiOrder);
                setObjectives(cfg.objectives);
                setHiddenKpisGeneral(new Set(cfg.hiddenKpisGeneral));
                setHiddenKpisCollab(new Set(cfg.hiddenKpisCollab));
                setHiddenClosers(new Set(cfg.hiddenClosers));
                alert('Configuración importada exitosamente');
              } catch {
                alert('JSON inválido');
              }
            }}
          >
            Importar Config
          </button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}

function SortableItem(props: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded p-2 mb-1 bg-muted cursor-move"
      {...attributes}
      {...listeners}
    >
      {props.id}
    </div>
  );
}