import React from "react";
import {UiModal} from "../../../ui";
import {t} from "../../../locales/ui";
const Modal: React.FC<{children: React.ReactNode; onClose: () => void; title?: string}> = ({children, onClose, title = t("Errors")}) => (
  <UiModal title={title} closeLabel={t("Close")} onClose={onClose}>{children}</UiModal>
);
export default Modal;
