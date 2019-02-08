import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { NodeIndex, Tags } from "@src/plugins/layout/stateprovider";
import { assert } from "chai";
import { IEvent } from "../../../types/core";
import { Action } from "../../../types/layout";

describe("Layout: Mutation Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that dom additions are captured by clarity", testAsync(async (done: DoneFn) => {
        watch();
        let div = document.createElement("div");
        let span = document.createElement("span");
        span.innerHTML = "Clarity";
        div.appendChild(span);
        document.body.insertBefore(div, document.body.firstChild);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 3);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[1].state.tag, "SPAN");
        assert.equal(events[2].state.tag, "*TXT*");
        done();
    }));

    it("checks that dom removals are captured by clarity", testAsync(async (done: DoneFn) => {
        watch();
        let dom = document.getElementById("clarity");
        dom.parentNode.removeChild(dom);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[0].state.action, Action.Remove);
        done();
    }));

    it("checks that dom moves are captured correctly by clarity", testAsync(async (done: DoneFn) => {
        watch();
        let dom = document.getElementById("clarity");
        let backup = document.getElementById("backup");
        backup.appendChild(dom);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Move);
        done();
    }));

    it("checks that insertBefore works correctly", testAsync(async (done: DoneFn) => {
        watch();

        // Insert a node before an existing node
        let dom = document.getElementById("clarity");
        let backup = document.getElementById("backup");
        let domIndex = dom[NodeIndex];
        let firstChildIndex = dom.firstChild[NodeIndex];
        dom.insertBefore(backup, dom.firstChild);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Move);
        assert.equal(events[0].state.parent, domIndex);
        assert.equal(events[0].state.next, firstChildIndex);
        done();
    }));

    it("checks that moving two known nodes to a new location such that they are siblings works correctly",
        testAsync(async (done: DoneFn) => {
            watch();

            // Move multiple nodes from one parent to another
            let dom = document.getElementById("clarity");
            let backup = document.getElementById("backup");
            let span = document.createElement("span");
            dom.parentElement.appendChild(span);
            span.appendChild(dom);
            span.appendChild(backup);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;

            assert.equal(events.length, 3);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.tag, "SPAN");

            assert.equal(events[1].state.action, Action.Move);
            assert.equal(events[1].state.index, dom[NodeIndex]);
            assert.equal(events[1].state.next, backup[NodeIndex]);

            assert.equal(events[2].state.action, Action.Move);
            assert.equal(events[2].state.index, backup[NodeIndex]);
            assert.equal(events[2].state.next, null);
            done();
        })
    );

    it("checks dom changes are captured accurately when multiple siblings are moved to another parent", testAsync(async (done: DoneFn) => {
        watch();

        // Move multiple nodes from one parent to another
        let dom = document.getElementById("clarity");
        let backup = document.getElementById("backup");
        let backupIndex = backup[NodeIndex];
        let childrenCount = dom.childNodes.length;
        while (dom.childNodes.length > 0) {
            backup.appendChild(dom.childNodes[0]);
        }
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, childrenCount);
        assert.equal(events[0].state.action, Action.Move);
        assert.equal(events[0].state.parent, backupIndex);
        assert.equal(events[4].state.parent, backupIndex);
        assert.equal(events[4].state.next, events[5].state.index);
        done();
    }));

    it("checks that insertion of multiple nodes in the same mutation record is handled correctly", testAsync(async (done: DoneFn) => {
        watch();
        let df = document.createDocumentFragment();
        let n1 = document.createElement("div");
        let n2 = document.createElement("span");
        let n3 = document.createElement("a");
        let backup = document.getElementById("backup");
        let backupPrevious = backup.previousSibling;
        df.appendChild(n1);
        df.appendChild(n2);
        df.appendChild(n3);
        backup.parentElement.insertBefore(df, backup);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;

        assert.equal(events.length, 3);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[0].state.previous, backupPrevious[NodeIndex]);
        assert.equal(events[0].state.next, n2[NodeIndex]);

        // Check SPAN insert event
        assert.equal(events[1].state.action, Action.Insert);
        assert.equal(events[1].state.tag, "SPAN");
        assert.equal(events[1].state.next, n3[NodeIndex]);

        // Check A insert event
        assert.equal(events[2].state.action, Action.Insert);
        assert.equal(events[2].state.tag, "A");
        assert.equal(events[2].state.next, backup[NodeIndex]);
        done();
    }));

    it("checks that removal of multiple nodes in the same mutation record is handled correctly", testAsync(async (done: DoneFn) => {
        watch();
        let dom = document.getElementById("clarity");
        let children = [];
        let childIndices = [];
        for (let i = 0; i < dom.childNodes.length; i++) {
            let child = dom.childNodes[i];
            let index = child[NodeIndex];
            children.push(child);
            childIndices[index] = true;
        }

        // Remove all children
        dom.innerHTML = "";
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;

        // Make sure that there is a remove event for every child
        for (let i = 0; i < events.length; i++) {
            let index = events[i].state.index;
            assert.equal(events[i].state.action, Action.Remove);
            assert.equal(childIndices[index], true);
            delete childIndices[index];
        }

        // Make sure that clarity index is cleared from all removed nodes
        for (let i = 0; i < children.length; i++) {
            assert.equal(NodeIndex in children[i], false);
        }
        done();
    }));

    // Nodes that are inserted and then removed in the same mutation don't produce any events and their mutations are ignored
    // However, it's possible that some other observed node can be appended to the ignored node and then get removed from the
    // DOM as a part of the ignored node's subtree. This test makes sure that removing observed node this way is captured correctly.
    it("checks that removal of a known node through a subtree of its ignored parent is handled correctly",
        testAsync(async (done: DoneFn) => {
            watch();
            let clarityNode = document.getElementById("clarity");
            let backupNode = document.getElementById("backup");
            let backupNodeIndex = backupNode[NodeIndex];
            let tempNode = document.createElement("div");
            clarityNode.appendChild(tempNode);
            tempNode.appendChild(backupNode);
            clarityNode.removeChild(tempNode);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 1);
            assert.equal(events[0].state.action, Action.Remove);
            assert.equal(events[0].state.index, backupNodeIndex);

            // Make sure that clarity index is cleared from all removed nodes
            assert.equal(NodeIndex in tempNode, false);
            assert.equal(NodeIndex in backupNode, false);
            done();
        })
    );

    it("checks that dom addition with immediate move ignores the 'Move' action", testAsync(async (done: DoneFn) => {
        watch();

        // Add a node to the document
        let clarity = document.getElementById("clarity");
        let div = document.createElement("div");
        document.body.appendChild(div);
        clarity.appendChild(div);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[0].state.parent, clarity[NodeIndex]);
        done();
    }));

    it("checks that dom addition with the follow-up attribute change captures the 'Update' action", testAsync(async (done: DoneFn) => {
        watch();
        let div = document.createElement("div");
        document.body.appendChild(div);
        await waitFor(PubSubEvents.MUTATION);

        div.setAttribute("data-clarity", "test");
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[1].state.action, Action.Update);
        done();
    }));

    it("checks that dom addition with immediate attribute change ignores the 'Update' action", testAsync(async (done: DoneFn) => {
        watch();
        let div = document.createElement("div");
        document.body.appendChild(div);
        div.setAttribute("data-clarity", "test");
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, "DIV");
        done();
    }));

    it("checks that nodes that are added and removed in the same mutation don't create index gaps in event logs ",
        testAsync(async (done: DoneFn) => {
            watch();
            let div1 = document.createElement("div");
            let div2 = document.createElement("div");
            let div3 = document.createElement("div");
            document.body.appendChild(div1);
            document.body.appendChild(div3);
            document.body.appendChild(div2);
            document.body.removeChild(div3);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 2);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.index, div1[NodeIndex]);
            assert.equal(events[1].state.action, Action.Insert);
            assert.equal(events[1].state.index, div2[NodeIndex]);
            assert.equal(div1[NodeIndex], div2[NodeIndex] - 1);
            done();
        })
    );

    it("checks that we do not instrument disconnected dom tree", testAsync(async (done: DoneFn) => {
        watch();
        let div = document.createElement("div");
        document.body.appendChild(div);
        document.body.removeChild(div);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;

        // Prove that we didn't send any extra instrumentation back for no-op mutation
        assert.equal(events.length, 0);

        // Make sure that clarity index is cleared from all removed nodes
        assert.equal(NodeIndex in div, false);
        done();
    }));

    it("checks that we do not instrument child nodes within disconnected dom tree", testAsync(async (done: DoneFn) => {
        watch();
        let div = document.createElement("div");
        let span = document.createElement("span");
        document.body.appendChild(div);
        div.appendChild(span);
        document.body.removeChild(div);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;

        // Prove that we didn't send any extra instrumentation back for no-op mutation
        assert.equal(events.length, 0);

        // Make sure that clarity index is cleared from all removed nodes
        assert.equal(NodeIndex in div, false);
        assert.equal(NodeIndex in span, false);
        done();
    }));

    it("checks that we do not instrument child nodes within a previously observed disconnected dom tree",
        testAsync(async (done: DoneFn) => {
            watch();
            let clarityDiv = document.getElementById("clarity");
            let span = document.createElement("span");
            let clarityDivIndex = clarityDiv[NodeIndex];
            clarityDiv.appendChild(span);
            clarityDiv.parentElement.removeChild(clarityDiv);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;

            // Prove that we didn't send any extra instrumentation back for no-op mutation
            assert.equal(events.length, 1);
            assert.equal(events[0].state.action, Action.Remove);
            assert.equal(events[0].state.index, clarityDivIndex);

            // Make sure that clarity index is cleared from all removed nodes
            assert.equal(NodeIndex in clarityDiv, false);
            assert.equal(NodeIndex in span, false);
            done();
        })
    );

    it("checks that we do not instrument inserted nodes twice", testAsync(async (done: DoneFn) => {
        watch();

        // Edge case scenario for the test:
        // 1. Node n1 is added to the page
        // 2. Immediately node n2 is appended to n1
        // They both show up as insertions in the same batch of mutations
        // When we serialize n1, we will discover its children and serialize n2 as well
        // Make sure we don't serialize n2 again when we move on to n2 insertion mutation record
        let n1 = document.createElement("div");
        let n2 = document.createElement("span");
        let bodyIndex = document.body[NodeIndex];
        document.body.appendChild(n1);
        n1.appendChild(n2);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 2);

        // Check DIV insert event
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.parent, bodyIndex);
        assert.equal(events[0].state.tag, "DIV");

        // Check SPAN insert event
        assert.equal(events[1].state.action, Action.Insert);
        assert.equal(events[1].state.parent, n1[NodeIndex]);
        assert.equal(events[1].state.tag, "SPAN");
        done();
    }));

    it("checks that all kinds of mutations within the same batch have the same mutation sequence", testAsync(async (done: DoneFn) => {
        watch();
        let divOne = document.createElement("div");
        let clarityDiv = document.getElementById("clarity");
        let backup = document.getElementById("backup");
        document.body.appendChild(divOne);  // Insert
        clarityDiv.firstElementChild.id = "updatedId"; // Update
        divOne.appendChild(clarityDiv); // Move
        backup.parentElement.removeChild(backup); // Remove
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 4);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[1].state.action, Action.Move);
        assert.equal(events[2].state.action, Action.Update);
        assert.equal(events[3].state.action, Action.Remove);

        // Make sure all events have the same mutation sequence
        let mutationSequence = events[0].state.mutationSequence;
        assert.isTrue(mutationSequence >= 0);
        assert.equal(events[0].state.mutationSequence, mutationSequence);
        assert.equal(events[1].state.mutationSequence, mutationSequence);
        assert.equal(events[2].state.mutationSequence, mutationSequence);
        assert.equal(events[3].state.mutationSequence, mutationSequence);
        done();
    }));

    it("checks that mutation sequence number is incremented between mutation callbacks", testAsync(async (done: DoneFn) => {
        watch();
        let divOne = document.createElement("div");
        let divTwo = document.createElement("div");
        document.body.appendChild(divOne);
        await waitFor(PubSubEvents.MUTATION);

        document.body.appendChild(divTwo);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].state.mutationSequence, 0);
        assert.equal(events[1].state.mutationSequence, 1);
        done();
    }));

    it("checks that script element and its text are ignored", testAsync(async (done: DoneFn) => {
        watch();
        let script = document.createElement("script");
        script.innerText = "/*some javascriptcode*/";
        document.body.appendChild(script);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, Tags.Ignore);
        assert.equal(events[0].state.nodeType, Node.ELEMENT_NODE);

        assert.equal(events[1].state.action, Action.Insert);
        assert.equal(events[1].state.tag, Tags.Ignore);
        assert.equal(events[1].state.nodeType, Node.TEXT_NODE);
        done();
    }));

    it("checks that comment node is ignored", testAsync(async (done: DoneFn) => {
        watch();
        let comment = document.createComment("some explanation");
        document.body.appendChild(comment);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, Tags.Ignore);
        assert.equal(events[0].state.nodeType, Node.COMMENT_NODE);
        done();
    }));

    it("checks that meta element is ignored", testAsync(async (done: DoneFn) => {
        watch();
        let meta = document.createElement("meta");
        document.body.appendChild(meta);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, Tags.Ignore);
        assert.equal(events[0].state.nodeType, Node.ELEMENT_NODE);
        done();
    }));

    // This test is related to a specific MutationObserver behavior in Internet Explorer for this scenario:
    //  1. Append script 'myscript' to the page
    //  2. 'myscript' executes and appends 'mydiv' div to the page
    //  3. Inspect MutationObserver callback
    // In Chrome:
    //    MutationObserver will invoke a callback and show 2 mutation records:
    //    (1) script added
    //    (2) <div> added
    // In IE:
    //    (1) MutationObserver will invoke first callback with 1 mutation record: <div> added
    //    (2) MutationObserver will invoke second callback with 1 mutation record: script added
    //  The problem with this behavior in IE is that during the first MutationObserver's callback, script element
    //  can already be observed in the DOM, even though its mutation is not reported in the callback.
    //  As a result, after processing (1), DOM and ShadowDOM states are not consistent until (2) is processed.
    //  This breaks functionality, because after (1) we determine that ShadowDOM arrived to the inconsistent
    //  state and stop processing mutations.
    // Solution:
    //  Wait for 2 consequtive mutations that bring ShadowDOM to the inconsistent state before disabling mutation processing.
    it("checks that inserting script, which inserts an element, works correctly", testAsync(async (done: DoneFn) => {
        watch();
        let events: IEvent[] = [];
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.innerHTML = `var div=document.createElement("div");div.id="newdiv";document.body.appendChild(div);`;
        document.body.appendChild(script);
        await waitFor(PubSubEvents.MUTATION);

        let newEvents = stopWatching().coreEvents;
        events = events.concat(newEvents);

        if (events.length === 1) {
            watch();
            await waitFor(PubSubEvents.MUTATION);

            newEvents = stopWatching().coreEvents;
            events = events.concat(newEvents);
            watch();

            // Add another mutation to ensure that we continue processing mutations
            document.body.appendChild(document.createElement("span"));
            await waitFor(PubSubEvents.MUTATION);

            newEvents = stopWatching().coreEvents;
            assert.equal(events.length, 4);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.tag, "DIV");
            assert.equal(events[1].state.action, Action.Insert);
            assert.equal(events[1].state.tag, Tags.Ignore);
            assert.equal(events[2].state.action, Action.Insert);
            assert.equal(events[2].state.tag, Tags.Ignore);
            assert.equal(events[3].state.action, Action.Insert);
            assert.equal(events[3].state.tag, "SPAN");
            done();
        } else {
            // Non-IE path: Both div and script are reported in the first callback
            assert.equal(events.length, 3);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.tag, Tags.Ignore);
            assert.equal(events[1].state.action, Action.Insert);
            assert.equal(events[1].state.tag, Tags.Ignore);
            assert.equal(events[2].state.action, Action.Insert);
            assert.equal(events[2].state.tag, "DIV");
            done();
        }
    }));
});
