import { ILayoutState } from "../../../declarations/clarity";

export default class StateManager {

  private layoutStates: ILayoutState[];

  constructor() {
    this.layoutStates = [];
  }

  public get(index: number): ILayoutState {
    let state = this.layoutStates[index];
    return state || null;
  }

  public add(state: ILayoutState) {
    if (this.layoutStates[state.index]) {
      throw new Error("Trying to insert already existing layout state");
    }
    this.layoutStates[state.index] = state;
  }

  public update(newState: ILayoutState) {
    if (this.layoutStates[newState.index]) {
      this.layoutStates[newState.index] = newState;
    } else {
      throw new Error("Trying to update a state that is not found.");
    }
  }
}
