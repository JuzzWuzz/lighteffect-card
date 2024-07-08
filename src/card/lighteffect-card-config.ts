import { LovelaceCardConfig, baseLovelaceCardConfig } from "juzz-ha-helper";
import { assign, boolean, object, optional, string } from "superstruct";

export interface LightEffectCardConfig extends LovelaceCardConfig {
  entity?: string;
  title?: string;
  hide_if_off?: boolean;
  hide_if_no_effects?: boolean;
}

// Enforce strict types for internal use
export type LightEffectCardConfigStrict = LightEffectCardConfig & {
  hide_if_off: boolean;
  hide_if_no_effects: boolean;
};

export const LightEffectCardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    entity: optional(string()),
    title: optional(string()),
    hide_if_off: optional(boolean()),
    hide_if_no_effects: optional(boolean()),
  }),
);
