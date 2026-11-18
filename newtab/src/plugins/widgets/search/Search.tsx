import React, { FC } from "react";
import { defineMessages, useIntl } from "react-intl";
import { Props, defaultData } from "./types";
import { buildUrl, getSearchUrl } from "./utils";
import "./Search.sass";

const messages = defineMessages({
  placeholder: {
    id: "plugins.search.placeholder",
    description: "Placeholder text to show in the search box before typing",
    defaultMessage: "Type to search",
  },
});

const Search: FC<Props> = ({ data = defaultData }) => {
  const input = React.useRef<HTMLInputElement>(null);
  const intl = useIntl();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const field = input.current;
    if (field) document.location.assign(buildUrl(field.value, getSearchUrl(data.searchEngine)));
  };

  return (
    <form className="Search" onSubmit={submit}>
      <input
        autoFocus
        placeholder={intl.formatMessage(messages.placeholder)}
        ref={input}
        tabIndex={1}
        type="text"
      />
    </form>
  );
};

export default Search;
