import * as ko from "knockout";
import * as _ from "lodash";

import { toModifierString } from "../../common/Toolbox";
import { CombatantCommander } from "../Commands/CombatantCommander";
import { ConcentrationPrompt } from "../Commands/Prompts/ConcentrationPrompt";
import { DefaultPrompt, LegacyPrompt } from "../Commands/Prompts/Prompt";
import { Conditions } from "../Rules/Conditions";
import { CurrentSettings } from "../Settings/Settings";
import { Metrics } from "../Utility/Metrics";
import { Combatant } from "./Combatant";
import { Tag } from "./Tag";

const animatedCombatantIds = ko.observableArray<string>([]);

export class CombatantViewModel {
  public HP: KnockoutComputed<string>;
  public Name: KnockoutComputed<string>;
  public NeedsAnimate = ko.pureComputed(
    () => animatedCombatantIds().indexOf(this.Combatant.Id) == -1
  );

  constructor(
    public Combatant: Combatant,
    public CombatantCommander: CombatantCommander,
    public PromptUser: (prompt: LegacyPrompt) => void,
    public LogEvent: (message: string) => void
  ) {
    this.HP = ko.pureComputed(() => {
      if (this.Combatant.TemporaryHP()) {
        return `${this.Combatant.CurrentHP()}+${this.Combatant.TemporaryHP()}/${this.Combatant.MaxHP()}`;
      } else {
        return `${this.Combatant.CurrentHP()}/${this.Combatant.MaxHP()}`;
      }
    });
    this.Name = Combatant.DisplayName;
    setTimeout(() => animatedCombatantIds.push(this.Combatant.Id), 500);
  }

  public ApplyDamage(inputDamage: string) {
    const damage = parseInt(inputDamage),
      healing = -damage,
      shouldAutoCheckConcentration = CurrentSettings().Rules
        .AutoCheckConcentration;

    if (isNaN(damage)) {
      return;
    }

    if (damage > 0) {
      Metrics.TrackEvent("DamageApplied", { Amount: damage.toString() });
      if (
        shouldAutoCheckConcentration &&
        this.Combatant.Tags().some(t => t.Text === ConcentrationPrompt.Tag)
      ) {
        this.CombatantCommander.CheckConcentration(this.Combatant, damage);
      }
      this.Combatant.ApplyDamage(damage);
    } else {
      this.Combatant.ApplyHealing(healing);
    }
  }

  public ApplyTemporaryHP(inputTHP: string) {
    const newTemporaryHP = parseInt(inputTHP);

    if (isNaN(newTemporaryHP)) {
      return;
    }

    this.Combatant.ApplyTemporaryHP(newTemporaryHP);
  }

  public ApplyInitiative(inputInitiative: string) {
    const initiative = parseInt(inputInitiative);
    this.Combatant.Initiative(initiative);
    this.Combatant.Encounter.SortByInitiative(true);
  }

  public InitiativeClass = ko.pureComputed(() => {
    if (this.Combatant.InitiativeGroup()) {
      return "fas fa-link";
    }
  });

  public GetHPColor() {
    const maxHP = this.Combatant.MaxHP(),
      currentHP = this.Combatant.CurrentHP();
    const green = Math.floor((currentHP / maxHP) * 170);
    const red = Math.floor(((maxHP - currentHP) / maxHP) * 170);
    return "rgb(" + red + "," + green + ",0)";
  }

  public EditHP() {
    this.CombatantCommander.EditSingleCombatantHP(this);
  }

  public EditInitiative() {
    const currentInitiative = this.Combatant.Initiative();
    const modifier = toModifierString(this.Combatant.InitiativeBonus());
    const preRoll = currentInitiative || this.Combatant.GetInitiativeRoll();
    let message = `Set initiative for ${this.Name()} (${modifier}): <input id='initiative' class='response' type='number' value='${preRoll}' />`;
    if (this.Combatant.InitiativeGroup()) {
      message += ` Break Link: <input class='response' name='break-link' type='checkbox' value='break' />`;
    }
    const prompt = new DefaultPrompt(message, response => {
      const initiative = response["initiative"];
      const breakLink = response["break-link"] === "break";
      if (initiative) {
        if (breakLink) {
          this.Combatant.InitiativeGroup(null);
          this.Combatant.Encounter.CleanInitiativeGroups();
        }
        this.ApplyInitiative(initiative);
        this.LogEvent(`${this.Name()} initiative set to ${initiative}.`);
        Metrics.TrackEvent("InitiativeSet", { Name: this.Name() });
      }
    });
    this.PromptUser(prompt);
  }

  public SetAlias() {
    const currentName = this.Name();
    const prompt = new DefaultPrompt(
      `Change alias for ${currentName}: <input id='alias' class='response' />`,
      response => {
        const alias = response["alias"];
        this.Combatant.Alias(alias);
        if (alias) {
          this.LogEvent(`${currentName} alias changed to ${alias}.`);
          Metrics.TrackEvent("AliasSet", {
            StatBlockName: this.Combatant.StatBlock().Name,
            Alias: alias
          });
        } else {
          this.LogEvent(`${currentName} alias removed.`);
        }
      }
    );
    this.PromptUser(prompt);
  }

  public HiddenClass = ko.pureComputed(() => {
    return this.Combatant.Hidden() ? "fa-eye-slash" : "fa-eye";
  });

  public IsSelected = ko.pureComputed(() => {
    return this.CombatantCommander.SelectedCombatants().some(c => c === this);
  });

  public IsActive = ko.pureComputed(() => {
    const activeCombatant = this.Combatant.Encounter.EncounterFlow.ActiveCombatant();
    return this.Combatant === activeCombatant;
  });

  public ToggleHidden() {
    if (this.Combatant.Hidden()) {
      this.Combatant.Hidden(false);
      this.LogEvent(`${this.Name()} revealed in player view.`);
      Metrics.TrackEvent("CombatantRevealed", {
        Name: this.Name()
      });
    } else {
      this.Combatant.Hidden(true);
      this.LogEvent(`${this.Name()} hidden in player view.`);
      Metrics.TrackEvent("CombatantHidden", {
        Name: this.Name()
      });
    }
  }

  public ToggleRevealedAC() {
    if (this.Combatant.RevealedAC()) {
      this.Combatant.RevealedAC(false);
      this.LogEvent(`${this.Name()} AC hidden in player view.`);
      Metrics.TrackEvent("CombatantACHidden", {
        Name: this.Name()
      });
    } else {
      this.Combatant.RevealedAC(true);
      this.LogEvent(`${this.Name()} AC revealed in player view.`);
      Metrics.TrackEvent("CombatantACRevealed", {
        Name: this.Name()
      });
    }
  }

  public RemoveTag = (tag: Tag) => {
    this.Combatant.Tags.splice(this.Combatant.Tags.indexOf(tag), 1);
    this.LogEvent(`${this.Name()} removed tag: "${tag.Text}"`);
  };

  public ReferenceTaggedCondition = (tag: Tag) => {
    const casedConditionName = _.startCase(tag.Text);
    if (Conditions[casedConditionName]) {
      const prompt = new DefaultPrompt(
        `<div class="p-condition-reference"><h3>${casedConditionName}</h3>${Conditions[casedConditionName]}</div>`
      );
      this.PromptUser(prompt);
    }
  };

  public TagHasReference = (tag: Tag) => {
    const casedConditionName = _.startCase(tag.Text);
    return Conditions[casedConditionName] !== undefined;
  };
}
