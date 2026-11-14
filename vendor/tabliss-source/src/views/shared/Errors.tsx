import {UiAsyncState} from "../../ui";
import { t } from "../../locales/ui";
import React from "react";
import { ErrorContext } from "../../contexts/error";
import Modal from "./modal/Modal";

type Props = {
  onClose: () => void;
};

const Errors: React.FC<Props> = ({ onClose }) => {
  const { errors } = React.useContext(ErrorContext);
  return (
    <Modal onClose={onClose}>
      <div className="Settings">
        <a
          className="button button--primary"
          href="https://tabliss.io/support.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ float: "right", fontSize: "1.1em" }}
        >
          {t("Visit support")}</a>
        <h2 style={{ margin: 0 }}>{t("Errors")}</h2>
        {errors.map((error, index) => (
          <UiAsyncState key={index} kind="error" text={error.message} />
        ))}
      </div>
    </Modal>
  );
};

export default Errors;
