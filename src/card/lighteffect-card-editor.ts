import { HaFormSchema, HomeAssistant, LovelaceCardEditor, fireEvent } from "juzz-ha-helper";
import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { assert } from "superstruct";

import { CARD_EDITOR_NAME, LIGHT_DOMAINS } from "./const";
import { LightEffectCardConfig, LightEffectCardConfigStruct } from "./lighteffect-card-config";

const SCHEMA: HaFormSchema[] = [
  { name: "entity", required: true, selector: { entity: { filter: { domain: LIGHT_DOMAINS } } } },
  { name: "title", selector: { text: {} } },
  { name: "hide_if_off", selector: { boolean: {} } },
  { name: "hide_if_no_effects", selector: { boolean: {} } },
];

@customElement(CARD_EDITOR_NAME)
export class LightEffectCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @state() private _config?: LightEffectCardConfig;

  /**
   * Called whenever the HASS object changes
   * This is done often when states change
   */
  public set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  public setConfig(config: LightEffectCardConfig): void {
    assert(config, LightEffectCardConfigStruct);
    this._config = config;
  }

  private _computeLabel = (schema: HaFormSchema) => {
    if (schema.name === "hide_if_off") {
      return "Hide if Light Off?";
    }
    if (schema.name === "hide_if_no_effects") {
      return "Hide if no Effects?";
    }
    return this._hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
  };

  protected render() {
    if (!this._hass || !this._config) {
      return nothing;
    }

    return html`
      <ha-form
        .hass=${this._hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    fireEvent(this, "config-changed", { config: ev.detail.value });
  }
}
