import { toast, Toast as ToastObject } from "react-hot-toast";

export interface ToastProps {
  toastObj: ToastObject,
  text: string,
  showDismiss?: boolean,
}

export function Toast({ toastObj, text, showDismiss }: ToastProps) {
  return (
    <div
      className={ "p-4 rounded mcui-window " + 
        (toastObj.visible ? "animate-enter" : "animate-leave")
      }
    >
      { text }
      
      { showDismiss &&
        <button
          className="ms-3 w-24 h-10 mcui-button"
          onClick={() => toast.dismiss(toastObj.id)}
        >
          Dismiss
        </button>
      }
    </div>
  )
}