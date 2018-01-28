import * as React from "react";
import { ChangeEvent } from "react";
import { SketchPicker, ColorResult } from "react-color";
import { PlayerViewCustomStyles } from "../Settings";

export interface CustomCSSEditorProps {
    currentCSS: string;
    currentStyles: PlayerViewCustomStyles;
    updateCSS: (css: string) => void;
    updateStyle: (name: keyof PlayerViewCustomStyles, value: string) => void;
}

interface State {
    manualCSS: string;
    styles: PlayerViewCustomStyles;
    selectedStyle: keyof PlayerViewCustomStyles | null;
}

export class CustomCSSEditor extends React.Component<CustomCSSEditorProps, State> {
    constructor(props: CustomCSSEditorProps) {
        super(props);
        this.state = {
            manualCSS: "",
            styles: {
                combatantBackground: "",
                combatantText: "",
                font: "",
                headerBackground: "",
                headerText: "",
                mainBackground: ""
            },
            selectedStyle: null
        };
    }

    private updateCSS = (event: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({ manualCSS: event.target.value });
        this.props.updateCSS(event.target.value);
    }

    private handleChangeComplete = (color: ColorResult) => {
        const updatedState = {
            styles: { ...this.state.styles, [this.state.selectedStyle]: color.hex }
        };

        this.setState(updatedState);
        this.props.updateStyle(this.state.selectedStyle, color.hex);
    }

    private bindClickToSelectStyle(style: keyof PlayerViewCustomStyles) {
        return () => this.setState({ selectedStyle: style });
    }

    public render() {
        return <div className="custom-css-editor">
            <p>Epic Initiative is enabled.</p>
            <h4>Colors</h4>
            <p>Combatant Text: <ColorBlock color={this.state.styles.combatantText} click={this.bindClickToSelectStyle("combatantText")} /></p>
            <p>Combatant Background: <ColorBlock color={this.state.styles.combatantBackground} click={this.bindClickToSelectStyle("combatantBackground")} /></p>
            {this.state.selectedStyle !== null && <SketchPicker width="210px" color={this.state.styles[this.state.selectedStyle]} onChangeComplete={this.handleChangeComplete} />}
            <h4>Additional CSS</h4>
            <textarea rows={10} onChange={this.updateCSS} value={this.props.currentCSS} />
        </div>;
    }
}

class ColorBlock extends React.Component<{ color: string, click: () => void }, {}> {
    constructor(props) {
        super(props);
    }
    public render() {
        const style = {
            display: "inline-block",
            width: "18px",
            height: "18px",
            border: "1px black solid",
            verticalAlign: "middle",
            backgroundColor: this.props.color
        };
        return <span style={style} onClick={this.props.click} />;
    }
}