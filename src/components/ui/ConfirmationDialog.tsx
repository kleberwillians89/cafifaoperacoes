import { useEffect, useRef } from 'react'

type Props = { open: boolean; title: string; description: string; onConfirm: () => void; onClose: () => void }

export function ConfirmationDialog({ open, title, description, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])
  return (
    <dialog className="dialog" ref={ref} onCancel={onClose}>
      <h2>{title}</h2><p>{description}</p>
      <div><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="danger-button" onClick={onConfirm}>Confirmar</button></div>
    </dialog>
  )
}
