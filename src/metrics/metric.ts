enum Metric {
    /* Timing */
    DiscoverTime,
    MutationTime,
    WireupDelay,
    ActiveTime,
    /* Counter */
    Nodes,
    Bytes,
    Mutations,
    Interactions,
    Clicks,
    Errors,
    /* Summary */
    ViewportWidth,
    ViewportHeight,
    DocumentWidth,
    DocumentHeight,
    /* Semantic Events */
    Click,
    Interaction
}

export default Metric;
