/* Super Extensão: implementation adapters; metadata and registration live in newtab/engine/catalog.ts. */
import { Config } from "./types";
import backgrounds_colour_dashboardComponent from "./backgrounds/colour/Colour";
import backgrounds_colour_settingsComponent from "./backgrounds/colour/ColourSettings";
import backgrounds_giphy_dashboardComponent from "./backgrounds/giphy/Giphy";
import backgrounds_giphy_settingsComponent from "./backgrounds/giphy/GiphySettings";
import backgrounds_gradient_dashboardComponent from "./backgrounds/gradient/Gradient";
import backgrounds_gradient_settingsComponent from "./backgrounds/gradient/GradientSettings";
import backgrounds_image_dashboardComponent from "./backgrounds/image/Image";
import backgrounds_image_settingsComponent from "./backgrounds/image/ImageSettings";
import backgrounds_unsplash_dashboardComponent from "./backgrounds/unsplash/Unsplash";
import backgrounds_unsplash_settingsComponent from "./backgrounds/unsplash/UnsplashSettings";
import widgets_css_dashboardComponent from "./widgets/css/Css";
import widgets_css_settingsComponent from "./widgets/css/CssSettings";
import widgets_github_dashboardComponent from "./widgets/github/GitHub";
import widgets_github_settingsComponent from "./widgets/github/GitHubSettings";
import widgets_greeting_dashboardComponent from "./widgets/greeting/Greeting";
import widgets_greeting_settingsComponent from "./widgets/greeting/GreetingSettings";
import widgets_ipInfo_dashboardComponent from "./widgets/ipInfo/IpInfo";
import widgets_ipInfo_settingsComponent from "./widgets/ipInfo/IpInfoSettings";
import widgets_js_dashboardComponent from "./widgets/js/Js";
import widgets_js_settingsComponent from "./widgets/js/JsSettings";
import widgets_links_dashboardComponent from "./widgets/links/Links";
import widgets_links_settingsComponent from "./widgets/links/LinksSettings";
import widgets_literatureClock_dashboardComponent from "./widgets/literatureClock/LiteratureClock";
import widgets_literatureClock_settingsComponent from "./widgets/literatureClock/LiteratureClockSettings";
import widgets_message_dashboardComponent from "./widgets/message/Message";
import widgets_message_settingsComponent from "./widgets/message/MessageSettings";
import widgets_nba_dashboardComponent from "./widgets/nba/Nba";
import widgets_nba_settingsComponent from "./widgets/nba/NbaSettings";
import { Notes as widgets_notes_dashboardComponent } from "./widgets/notes/Notes";
import widgets_quote_dashboardComponent from "./widgets/quote/Quote";
import widgets_quote_settingsComponent from "./widgets/quote/QuoteSettings";
import widgets_search_dashboardComponent from "./widgets/search/Search";
import widgets_search_settingsComponent from "./widgets/search/SearchSettings";
import widgets_time_dashboardComponent from "./widgets/time/Time";
import widgets_time_settingsComponent from "./widgets/time/TimeSettings";
import widgets_todo_dashboardComponent from "./widgets/todo/Todo";
import widgets_todo_settingsComponent from "./widgets/todo/TodoSettings";
import widgets_weather_dashboardComponent from "./widgets/weather/Weather";
import widgets_weather_settingsComponent from "./widgets/weather/WeatherSettings";
import widgets_workHours_dashboardComponent from "./widgets/workHours/WorkHours";
import widgets_workHours_settingsComponent from "./widgets/workHours/WorkHoursSettings";
export const bindings = new Map<
  string,
  Pick<Config, "dashboardComponent" | "settingsComponent">
>([
  [
    "background/colour",
    {
      dashboardComponent: backgrounds_colour_dashboardComponent,
      settingsComponent: backgrounds_colour_settingsComponent,
    },
  ],
  [
    "background/giphy",
    {
      dashboardComponent: backgrounds_giphy_dashboardComponent,
      settingsComponent: backgrounds_giphy_settingsComponent,
    },
  ],
  [
    "background/gradient",
    {
      dashboardComponent: backgrounds_gradient_dashboardComponent,
      settingsComponent: backgrounds_gradient_settingsComponent,
    },
  ],
  [
    "background/image",
    {
      dashboardComponent: backgrounds_image_dashboardComponent,
      settingsComponent: backgrounds_image_settingsComponent,
    },
  ],
  [
    "background/unsplash",
    {
      dashboardComponent: backgrounds_unsplash_dashboardComponent,
      settingsComponent: backgrounds_unsplash_settingsComponent,
    },
  ],
  [
    "widget/css",
    {
      dashboardComponent: widgets_css_dashboardComponent,
      settingsComponent: widgets_css_settingsComponent,
    },
  ],
  [
    "widget/github",
    {
      dashboardComponent: widgets_github_dashboardComponent,
      settingsComponent: widgets_github_settingsComponent,
    },
  ],
  [
    "widget/greeting",
    {
      dashboardComponent: widgets_greeting_dashboardComponent,
      settingsComponent: widgets_greeting_settingsComponent,
    },
  ],
  [
    "widget/ipInfo",
    {
      dashboardComponent: widgets_ipInfo_dashboardComponent,
      settingsComponent: widgets_ipInfo_settingsComponent,
    },
  ],
  [
    "widget/js",
    {
      dashboardComponent: widgets_js_dashboardComponent,
      settingsComponent: widgets_js_settingsComponent,
    },
  ],
  [
    "widget/links",
    {
      dashboardComponent: widgets_links_dashboardComponent,
      settingsComponent: widgets_links_settingsComponent,
    },
  ],
  [
    "widget/literature-clock",
    {
      dashboardComponent: widgets_literatureClock_dashboardComponent,
      settingsComponent: widgets_literatureClock_settingsComponent,
    },
  ],
  [
    "widget/message",
    {
      dashboardComponent: widgets_message_dashboardComponent,
      settingsComponent: widgets_message_settingsComponent,
    },
  ],
  [
    "widget/nba",
    {
      dashboardComponent: widgets_nba_dashboardComponent,
      settingsComponent: widgets_nba_settingsComponent,
    },
  ],
  ["widget/notes", { dashboardComponent: widgets_notes_dashboardComponent }],
  [
    "widget/quote",
    {
      dashboardComponent: widgets_quote_dashboardComponent,
      settingsComponent: widgets_quote_settingsComponent,
    },
  ],
  [
    "widget/search",
    {
      dashboardComponent: widgets_search_dashboardComponent,
      settingsComponent: widgets_search_settingsComponent,
    },
  ],
  [
    "widget/time",
    {
      dashboardComponent: widgets_time_dashboardComponent,
      settingsComponent: widgets_time_settingsComponent,
    },
  ],
  [
    "widget/todo",
    {
      dashboardComponent: widgets_todo_dashboardComponent,
      settingsComponent: widgets_todo_settingsComponent,
    },
  ],
  [
    "widget/weather",
    {
      dashboardComponent: widgets_weather_dashboardComponent,
      settingsComponent: widgets_weather_settingsComponent,
    },
  ],
  [
    "widget/workHours",
    {
      dashboardComponent: widgets_workHours_dashboardComponent,
      settingsComponent: widgets_workHours_settingsComponent,
    },
  ],
]);
