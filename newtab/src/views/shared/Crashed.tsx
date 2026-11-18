import { t } from "../../locales/ui";
import React, { FC } from "react";
import { FallbackProps } from "react-error-boundary";

import {UiAsyncState} from "../../ui";
const Crashed: FC<FallbackProps> = () => <UiAsyncState kind="error" text={t(" Sorry this plugin has crashed!")} />;
export default Crashed;
