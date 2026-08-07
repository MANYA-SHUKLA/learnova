'use client';

import { useCallback, useState } from 'react';

export function useSuccessPopup(defaultMessage = 'Saved successfully.') {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const showSuccess = useCallback(
    (nextMessage?: string) => {
      setMessage(nextMessage ?? defaultMessage);
      setOpen(true);
    },
    [defaultMessage],
  );

  const closeSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, message, showSuccess, closeSuccess };
}
