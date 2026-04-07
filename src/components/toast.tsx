interface ToastProps {
  message: string | null;
  type: "success" | "error" | "info";
}

export default function Toast({ message, type }: ToastProps) {
  if (!message) {
    return null;
  }
  return <div className={`toast toast-${type}`}>{message}</div>;
}
