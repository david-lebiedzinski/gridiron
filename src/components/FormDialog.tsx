import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { APP } from "../strings";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  description?: string;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
}

export default function FormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: FormDialogProps) {
  let descriptionEl: ReactNode = undefined;
  if (description) {
    descriptionEl = (
      <Dialog.Description className="dialog-description">
        {description}
      </Dialog.Description>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          {descriptionEl}
          {children}
          <div className="dialog-actions">
            <Dialog.Close asChild>
              <button className="btn btn-ghost">{APP.cancel}</button>
            </Dialog.Close>
            <button className="btn btn-primary" onClick={onSubmit}>
              {submitLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
