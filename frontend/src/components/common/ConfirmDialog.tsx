import type { ReactNode } from 'react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal
      open={open}
      title={title}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-[13px] text-ink">{children}</div>
    </Modal>
  );
}
