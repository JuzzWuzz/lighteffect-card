import {
  HomeAssistant,
  LightEntity,
  LovelaceCard,
  LovelaceCardEditor,
  fireEvent,
} from "juzz-ha-helper";
import { LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  CARD_DEFAULT_HIDE_IF_NO_EFFECTS,
  CARD_DEFAULT_HIDE_IF_OFF,
  CARD_EDITOR_NAME,
  CARD_NAME,
  LIGHT_DOMAINS,
} from "./const";
import { LightEffectCardConfig, LightEffectCardConfigStrict } from "./lighteffect-card-config";
import { registerCustomCard } from "../utils/custom-cards";

registerCustomCard({
  type: CARD_NAME,
  name: "Lighteffect Card",
  description: "Card with a selection box for the effects for a Light Entity",
});

@customElement(CARD_NAME)
export class LightEffect extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./lighteffect-card-editor");
    return document.createElement(CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(hass: HomeAssistant): Promise<LightEffectCardConfig> {
    const entities = Object.keys(hass.states);
    const lightEntities = entities.filter((e) => LIGHT_DOMAINS.includes(e.split(".")[0]));
    return {
      type: `custom:${CARD_NAME}`,
      entity: lightEntities[0],
    };
  }

  @property({ attribute: false }) private _hass?: HomeAssistant;

  @state() private _config?: LightEffectCardConfigStrict;

  @property({ attribute: false }) private _effect: string = "";

  /**
   * Called whenever the HASS object changes
   * This is done often when states change
   */
  public set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  /**
   * Sets the config for the card
   */
  public setConfig(config: LightEffectCardConfig): void {
    try {
      this._config = {
        ...{
          type: `custom:${CARD_NAME}`,
          hide_if_off: CARD_DEFAULT_HIDE_IF_OFF,
          hide_if_no_effects: CARD_DEFAULT_HIDE_IF_NO_EFFECTS,
        },
        ...config,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`/// ${CARD_NAME.toUpperCase} Invalid Config ///${e.message}`);
    }
  }

  /**
   * Called whenever the component’s update finishes and the element's DOM has been updated and rendered.
   */
  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    // Bail if we have an invalid state
    if (!this._config || !this._hass) {
      return;
    }
  }

  /**
   * Render the card
   */
  protected render() {
    if (!this._hass || !this._config || !this._config.entity) {
      return nothing;
    }

    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId] as LightEntity | undefined;
    if (!stateObj) {
      return nothing;
    }
    const effect = stateObj.attributes.effect ?? "";
    const effectList = stateObj.attributes.effect_list ?? [];
    // Check if this effect has changed from what we know of, this means we must trigger a re-draw
    if (this._effect !== effect) {
      this._effect = effect;
      fireEvent(this, "translations-updated");
    }

    try {
      if (
        (this._config.hide_if_off && stateObj.state === "off") ||
        (this._config.hide_if_no_effects && effectList.length === 0)
      ) {
        return html``;
      }
      return html`
        <ha-card>
          ${this._config?.title
            ? html`
                <h1 class="card-header">
                  <div class="name">${this._config.title}</div>
                </h1>
              `
            : html``}
          <div class="card-content">
            <ha-select
              .label=${this._hass.localize("ui.card.light.effect")}
              .value=${this._effect}
              @selected=${this._effectChanged}
              @closed=${(ev) => ev.stopPropagation()}
            >
              ${effectList.map(
                (effect: string) => html`
                  <mwc-list-item .value=${effect}> ${effect} </mwc-list-item>
                `,
              )}
            </ha-select>
          </div>
        </ha-card>
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorCard = document.createElement("hui-error-card") as LovelaceCard;
      errorCard.setConfig({
        type: "error",
        error: e.toString(),
        origConfig: this._config,
      });
      return html`${errorCard}`;
    }
  }

  static styles = css`
    ha-select {
      display: block;
    }
  `;

  private _effectChanged(event) {
    if (!this._hass || !this._config?.entity) return;

    const newEffect = event.target.value;
    if (newEffect && this._effect !== newEffect) {
      this._effect = newEffect;
      this._hass.callService("light", "turn_on", {
        entity_id: this._config.entity,
        effect: newEffect,
      });
    }
  }
}
