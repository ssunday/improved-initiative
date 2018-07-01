import React = require("react");
import { Checkbox, Form, FormApi, NestedForm, Text, } from "react-form";
import { NameAndModifier, StatBlock } from "../../common/StatBlock";
import { Button } from "../Components/Button";

export class StatBlockEditor extends React.Component<StatBlockEditorProps, StatBlockEditorState> {
    public saveAndClose = (submittedValues) => {
        const editedStatBlock = {
            ...this.props.statBlock,
            ...submittedValues,
        };

        this.props.onSave(editedStatBlock);
        this.props.onClose();
    }

    private close = () => {
        this.props.onClose();
    }

    private textField = (label: string, fieldName: string) =>
        <label className="c-statblock-editor-text">
            <div className="label">{label}</div>
            <Text field={fieldName} />
        </label>

    private valueAndNotesField = (label: string, fieldName: string) =>
        <label className="c-statblock-editor-text">
            <div className="label">{label}</div>
            <div className="inline-inputs">
                <Text className="value" field={`${fieldName}.Value`} />
                <Text className="notes" field={`${fieldName}.Notes`} />
            </div>
        </label>

    private initiativeField = () =>
        <div className="c-statblock-editor-text">
            <label className="label" htmlFor="InitiativeModifier">Initiative Modifier</label>
            <div className="inline-inputs">
                <Text className="value" id="InitiativeModifier" field="InitiativeModifier" />
                <label> Roll with Advantage
                <Checkbox field="InitiativeAdvantage" />
                </label>
            </div>
        </div>

    private abilityScoreField = (abilityName: string) =>
        <div key={abilityName} className="c-statblock-editor-ability">
            <label htmlFor={`ability-${abilityName}`}>{abilityName}</label>
            <Text id={`ability-${abilityName}`} field={`Abilities.${abilityName}`} />
        </div>

    private nameAndModifierFields = (api: FormApi, modifierType: string) =>
        <div className={`c-statblock-editor-${modifierType}`}>
            <div className="label">{modifierType}</div>
            <div className="inline-names-and-modifiers">
                {api.values[modifierType].map((v: NameAndModifier, i: number) => {
                    return <div key={i}>
                        <Text field={`${modifierType}[${i}].Name`} />
                        <Text type="number" field={`${modifierType}[${i}].Modifier`} />
                        <span className="fa-clickable fa-trash"
                            onClick={() => api.removeValue(modifierType, i)}
                        />
                    </div>;
                })}
                <Button faClass="plus"
                    onClick={() => api.addValue(modifierType, { Name: "", Modifier: "" })} />
            </div>
        </div>

    public render() {
        const header =
            this.props.editMode == "combatant" ? "Edit Combatant Statblock" :
                this.props.editMode == "library" ? "Edit Library Statblock" :
                    "Edit StatBlock";

        return <Form onSubmit={this.saveAndClose}
            defaultValues={this.props.statBlock}
            render={api => (
                <form className="c-statblock-editor"
                    onSubmit={api.submitForm}>
                    <h2>{header}</h2>
                    <div className="bordered c-statblock-editor-headers">
                        {this.textField("Name", "Name")}
                        {this.textField("Folder", "Path")}
                        {this.textField("Portrait URL", "ImageURL")}
                        {this.textField("Source", "Source")}
                        {this.textField("Type", "Type")}
                    </div>
                    <div className="bordered c-statblock-editor-stats">
                        {this.valueAndNotesField("Hit Points", "HP")}
                        {this.valueAndNotesField("Armor Class", "AC")}
                        {this.initiativeField()}
                    </div>
                    <div className="bordered c-statblock-editor-abilityscores">
                        {["Str", "Dex", "Con", "Int", "Wis", "Cha"]
                            .map(this.abilityScoreField)}
                    </div>
                    <div className="bordered c-statblock-editor-saves">
                        {this.nameAndModifierFields(api, "Saves")}
                    </div>
                    <div className="c-statblock-editor-buttons">
                        <Button onClick={this.close} faClass="times" />
                        <button type="submit" className="button fa fa-save" />
                    </div>
                </form>
            )} />;
    }
}

interface StatBlockEditorProps {
    statBlock: StatBlock;
    onSave: (statBlock: StatBlock) => void;
    onClose: () => void;
    editMode: "library" | "combatant";
}

interface StatBlockEditorState { }