import React, { FC } from "react";

import { useCachedEffect } from "../../../hooks";

import { Props, defaultData } from "./types";
import { getIpInfo } from "./api";
import { MINUTES } from "../../../utils";
import { usePushError } from "../../../api";

const IpInfo: FC<Props> = ({ cache, data = defaultData, setCache, loader }) => {
  const pushError = usePushError();
  const refreshInterval = data.refreshInterval * MINUTES;

  useCachedEffect(
    () => {
      let active = true;
      getIpInfo(loader).then((value) => { if (active) setCache(value); })
        .catch((error) => { if (active) pushError(error); });
      return () => { active = false; };
    },
    cache ? cache.timestamp + refreshInterval : 0,
    [],
  );

  if (!cache) {
    return null;
  }

  return (
    <div className="IpInfo">
      {cache.ip ? cache.ip : data.ip}

      {data.displayCity && (cache.city ? ", " + cache.city : data.city)}

      {data.displayCountry &&
        (cache.country ? ", " + cache.country : data.country)}
    </div>
  );
};

export default IpInfo;
