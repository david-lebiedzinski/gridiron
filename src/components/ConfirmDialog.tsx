import { useState } from "react";
import type { ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { APP } from "../locales/en";

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    await onConfirm();
    setOpen(false);
  }

  const btnClass = variant === "danger" ? "btn btn-danger" : "btn btn-primary";

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title className="dialog-title">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="dialog-description">
            {description}
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <button className="btn btn-ghost">{APP.cancel}</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button className={btnClass} onClick={handleConfirm}>
                {confirmLabel ?? APP.delete}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
