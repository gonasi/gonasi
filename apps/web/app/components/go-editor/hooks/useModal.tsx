import type { JSX, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { Modal } from '~/components/ui/modal';

export default function useModal(): [
  JSX.Element | null,
  (
    title: string,
    getContent: (onClose: () => void) => JSX.Element,
    className?: string,
    leadingIcon?: ReactNode,
  ) => void,
] {
  const [modalContent, setModalContent] = useState<null | {
    closeOnClickOutside: boolean;
    content: JSX.Element;
    title: string;
    className?: string;
    leadingIcon?: ReactNode;
  }>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) {
      return null;
    }
    const { title, content, className, leadingIcon } = modalContent;
    return (
      <Modal open onOpenChange={(open) => open || onClose()}>
        <Modal.Content size='md' className={className}>
          <Modal.Header title={title} leadingIcon={leadingIcon} />
          <Modal.Body>{content}</Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (
      title: string,
      getContent: (onClose: () => void) => JSX.Element,
      className?: string,
      leadingIcon?: ReactNode,
    ) => {
      setModalContent({
        closeOnClickOutside: false,
        content: getContent(onClose),
        title,
        className,
        leadingIcon,
      });
    },
    [onClose],
  );

  return [modal, showModal];
}
