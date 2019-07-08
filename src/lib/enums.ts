export enum Method {
    Discover,
    Mutation,
    Layout,
    Serialize
}

export enum Metric {
    /* Core */
    Wireup,
    Bytes,
    /* DOM */
    DiscoverCount,
    MutationCount,
    /* Pointer */
    PointerDistance,
    SwipeCount,
    /* Viewport */
    ViewportX,
    ViewportY,
    ViewportWidth,
    ViewportHeight,
    DocumentWidth,
    DocumentHeight,
    ActiveTime,
    TotalTime
}
