

Custom Event Reporting
==

This plugin can be used when a site using Clarity wants to record custom data points that aren't already tracked by Clarity, or wants to record data points in a way that makes them easier to recognize.

For example, if your site has a search bar that appears on demand, Clarity might already be tracking the appearance of the search bar by tracking the related DOM changes. However, you could use this plugin to store a custom event with a clear name that helps the analyst recognize when the search bar is opened.

Usage
--

Custom events are created by dispatching a normal DOM event with the type `claritydata` and your data object in the `detail` property. Clarity will receive your event and record the associated data.

Custom events are objects with a `type` and a `data` property. The list of types and schema of the data property are left up to the client site to define.

Custom data is subject to the same bandwidth usage limits as other Clarity events.

Example
--

The following JavaScript snippet demonstrates how to use the custom data plugin.

    var clarityEvent = document.createEvent("Event");
    clarityEvent.initEvent(
      "claritydata",
      true,
      false
    );
    clarityEvent.detail = { type: "test", data: "this is a test object" };

    document.dispatchEvent(clarityEvent);

The resulting event recorded by Clarity will look like:

    {
      "id": xxx,
      "time": xxx,
      "type": "Custom",
      "state": {
	    "type": "test", "data": "this is a test object"
      }
    }
