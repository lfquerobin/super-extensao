import { UiButton } from "../../../ui";
import React, { FC } from "react";

interface Props extends React.AriaAttributes {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  title?: string;
}

const IconButton: FC<Props> = ({ children, primary, ...props }) => (
  <UiButton
    className={`ui-button-icon button--icon ${primary ? "button--primary" : ""}`}
    aria-label={props.title}
    {...props}
  >
    {children}
  </UiButton>
);

export default IconButton;
