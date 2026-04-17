import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useRef, useState } from 'react';

interface UseEntityFormOptions<T, E> {
  entity: E | null | undefined;
  isOpen: boolean;
  defaultFormData: T;
  toFormData: (entity: E) => T;
  onSubmit: (formData: T) => Promise<void>;
  onClose: () => void;
  errorLabel: string;
}

interface UseEntityFormResult<T> {
  formData: T;
  setFormData: Dispatch<SetStateAction<T>>;
  loading: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

/**
 * Manages the loading/formData/reset/submit boilerplate shared by every
 * entity create-or-edit modal. On open (or when `entity` changes) the form
 * repopulates: from `toFormData(entity)` when editing, or `defaultFormData`
 * when creating.
 */
export function useEntityForm<T, E>({
  entity,
  isOpen,
  defaultFormData,
  toFormData,
  onSubmit,
  onClose,
  errorLabel,
}: UseEntityFormOptions<T, E>): UseEntityFormResult<T> {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<T>(defaultFormData);

  // Refs let the reset effect depend only on [entity, isOpen] without
  // forcing callers to memoize defaultFormData / toFormData.
  const defaultRef = useRef(defaultFormData);
  const toFormDataRef = useRef(toFormData);
  defaultRef.current = defaultFormData;
  toFormDataRef.current = toFormData;

  useEffect(() => {
    if (entity) {
      setFormData(toFormDataRef.current(entity));
    } else {
      setFormData(defaultRef.current);
    }
  }, [entity, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(`Failed to save ${errorLabel}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return { formData, setFormData, loading, handleSubmit };
}
