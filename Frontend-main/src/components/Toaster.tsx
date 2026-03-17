import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(88, 28, 135, 0.9)',
          color: 'white',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          backdropFilter: 'blur(10px)',
        },
      }}
    />
  );
}
