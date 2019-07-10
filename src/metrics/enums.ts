export enum Timer {
    Discover = "dt",
    Mutation = "mt",
    Layout = "lt",
    Serialize = "st",
    Wireup = "wt",
    Active = "at"
}

export enum Counter {
    Nodes = "nc",
    Bytes = "bc",
    Mutations = "mc",
    Swipes = "sc",
}

export enum Histogram {
    PointerDistance = "ph",
    ViewportX = "xh",
    ViewportY = "yh",
    ViewportWidth = "wh",
    ViewportHeight = "hh",
    DocumentWidth = "dwh",
    DocumentHeight = "dhh"
}

export enum Mark {
    Click = "cm",
    Error = "em",
    Interaction = "ic"
}
