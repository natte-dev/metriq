"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Option {
  id: number;
  label: string;
}

interface HybridSelectProps {
  label?: string;
  options: Option[];
  selectedId: number | null | undefined;
  textValue: string;
  onSelectId: (id: number | null) => void;
  onTextChange: (text: string) => void;
  placeholder?: string;
}

/**
 * Hybrid: shows a dropdown of registered items + a text fallback.
 * If user picks from dropdown, textValue is cleared.
 * If user types in text, selectedId is cleared.
 */
export function HybridSelect({
  options,
  selectedId,
  textValue,
  onSelectId,
  onTextChange,
  placeholder = "Selecione ou digite...",
}: HybridSelectProps) {
  const selectedOption = options.find((o) => o.id === selectedId);

  function handleSelectChange(val: string) {
    if (!val) {
      onSelectId(null);
    } else {
      onSelectId(Number(val));
      onTextChange(""); // clear text when selecting from list
    }
  }

  function handleTextChange(val: string) {
    onTextChange(val);
    if (val) onSelectId(null); // clear selection when typing
  }

  function handleClear() {
    onSelectId(null);
    onTextChange("");
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <select
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedId ?? ""}
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="">-- Selecionar cadastrado --</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {(selectedId || textValue) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleClear}
            title="Limpar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {!selectedId && (
        <Input
          placeholder={placeholder}
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          className="text-sm"
        />
      )}
      {selectedOption && (
        <p className="text-xs text-muted-foreground px-1">
          Selecionado: <strong>{selectedOption.label}</strong>
        </p>
      )}
    </div>
  );
}
