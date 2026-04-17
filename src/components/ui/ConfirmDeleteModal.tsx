import type { ReactNode } from "react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-text-secondary mb-2">{message}</p>
      <ModalFooter className="-mx-6 -mb-5 mt-5">
        <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-danger hover:bg-danger/80"
        >
          {isDeleting ? "Deleting..." : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
