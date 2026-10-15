import Button from './Button.jsx';
import Modal from './Modal.jsx';

// Yes/no confirmation for destructive actions such as cancelling an order or deleting an address.
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Yes, continue',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {description && <p className="text-cocoa">{description}</p>}
    </Modal>
  );
}
