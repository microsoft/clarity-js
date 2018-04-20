import { Action, IEvent, Source } from "../clarity";
import { config } from "../src/config";
import * as core from "../src/core";
import { NodeIndex, Tags } from "../src/plugins/layout/stateprovider";
import { mask } from "../src/utils";
import { activateCore, cleanupFixture, setupFixture } from "./testsetup";
import { observeEvents } from "./utils";

import * as chai from "chai";
import { ForceMaskAttribute } from "../src/plugins/layout/nodeinfo";

let eventName = "Layout";
let assert = chai.assert;

describe("Layout Tests", () => {

  beforeEach(() => {
    setupFixture(["layout"]);
  });
  afterEach(cleanupFixture);

  it("checks that dom additions are captured by clarity", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let div = document.createElement("div");
    let span = document.createElement("span");
    span.innerHTML = "Clarity";
    div.appendChild(span);
    document.body.insertBefore(div, document.body.firstChild);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 3);
      assert.equal(events[0].state.tag, "DIV");
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[1].state.tag, "SPAN");
      assert.equal(events[2].state.tag, "*TXT*");
      done();
    }
  });

  it("checks that dom removals are captured by clarity", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Remove a node from the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let dom = document.getElementById("clarity");
    dom.parentNode.removeChild(dom);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "DIV");
      assert.equal(events[0].state.action, Action.Remove);
      done();
    }
  });

  it("checks that dom moves are captured correctly by clarity", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Move an existing node in the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    backup.appendChild(dom);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Move);
      done();
    }
  });

  it("checks that insertBefore works correctly", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Insert a node before an existing node and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    let domIndex = dom[NodeIndex];
    let firstChildIndex = dom.firstChild[NodeIndex];
    dom.insertBefore(backup, dom.firstChild);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Move);
      assert.equal(events[0].state.parent, domIndex);
      assert.equal(events[0].state.next, firstChildIndex);
      done();
    }
  });

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
  it("checks that inserting script, which inserts an element, works correctly", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Insert a node before an existing node and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let events: IEvent[] = [];
    let callbackCount = 0;
    let script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = `var div=document.createElement("div");div.id="newdiv";document.body.appendChild(div);`;
    document.body.appendChild(script);

    function callback() {
      // Uncompress recent data from mutations
      let newEvents = stopObserving();
      events = events.concat(newEvents);

      if (callbackCount === 0) {
        // IE path: Only div insertion is reported in the first callback
        if (events.length === 1) {
          // Observe more events
          stopObserving = observeEvents(eventName);
        } else {
          // Non-IE path: Both div and script are reported in the first callback
          observer.disconnect();
          assert.equal(events.length, 3);
          assert.equal(events[0].state.action, Action.Insert);
          assert.equal(events[0].state.tag, Tags.Ignore);
          assert.equal(events[1].state.action, Action.Insert);
          assert.equal(events[1].state.tag, Tags.Ignore);
          assert.equal(events[2].state.action, Action.Insert);
          assert.equal(events[2].state.tag, "DIV");
          done();
        }
      } else if (callbackCount === 1) {
        // Add another mutation to ensure that we continue processing mutations
        let span = document.createElement("span");
        document.body.appendChild(span);
        // Observe more events
        stopObserving = observeEvents(eventName);
      } else {
        observer.disconnect();
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
      }
      callbackCount++;
    }
  });

  it("checks that moving two known nodes to a new location such that they are siblings works correctly", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Move multiple nodes from one parent to another and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    let span = document.createElement("span");

    dom.parentElement.appendChild(span);
    span.appendChild(dom);
    span.appendChild(backup);

    function callback() {
      observer.disconnect();
      let events = stopObserving();

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
    }
  });

  it("checks that we capture cssRule modifications via javascript when cssRule config is enabled", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, {childList: true, subtree: true });

    config.cssRules = true;

    // Add a style tag and later modify styles using javascript
    let stopObserving = observeEvents(eventName);
    let dom = document.getElementById("clarity");
    let style = document.createElement("style");
    style.textContent = "body {}";
    dom.appendChild(style);
    let stylesheet = style.sheet as CSSStyleSheet;
    let rules = stylesheet.cssRules;
    let styleRule = rules[0] as CSSStyleRule;
    styleRule.style.background = "red";

    function callback() {
      observer.disconnect();

      // Uncompress recent data from mutations
      let events = stopObserving();

      // Assert that style state has css rules and that style's child text node is ignored
      assert.equal(events.length, 2);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(!!events[0].state.cssRules, true);
      assert.equal(events[0].state.cssRules.length, 1);
      assert.equal(events[0].state.cssRules[0].indexOf("red") > 0, true);
      assert.equal(events[1].state.tag, Tags.Ignore);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks dom changes are captured accurately when multiple siblings are moved to another parent", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Move multiple nodes from one parent to another and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    let backupIndex = backup[NodeIndex];
    let childrenCount = dom.childNodes.length;
    while (dom.childNodes.length > 0) {
      backup.appendChild(dom.childNodes[0]);
    }
    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, childrenCount);
      assert.equal(events[0].state.action, Action.Move);
      assert.equal(events[0].state.parent, backupIndex);
      assert.equal(events[4].state.parent, backupIndex);
      assert.equal(events[4].state.next, events[5].state.index);
      done();
    }
  });

  it("checks that insertion of multiple nodes in the same mutation record is handled correctly", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });
    let stopObserving = observeEvents(eventName);

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

    function callback() {
      observer.disconnect();
      let events = stopObserving();

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
    }
  });

  it("checks that removal of multiple nodes in the same mutation record is handled correctly", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });
    let stopObserving = observeEvents(eventName);

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

    function callback() {
      observer.disconnect();
      let events = stopObserving();

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
    }
  });

  // Nodes that are inserted and then removed in the same mutation don't produce any events and their mutations are ignored
  // However, it's possible that some other observed node can be appended to the ignored node and then get removed from the
  // DOM as a part of the ignored node's subtree. This test makes sure that removing observed node this way is captured correctly.
  it("checks that removal of a known node through a subtree of its ignored parent is handled correctly", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });
    let stopObserving = observeEvents(eventName);

    let clarityNode = document.getElementById("clarity");
    let backupNode = document.getElementById("backup");
    let backupNodeIndex = backupNode[NodeIndex];
    let tempNode = document.createElement("div");

    clarityNode.appendChild(tempNode);
    tempNode.appendChild(backupNode);
    clarityNode.removeChild(tempNode);

    function callback() {
      observer.disconnect();

      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Remove);
      assert.equal(events[0].state.index, backupNodeIndex);

      // Make sure that clarity index is cleared from all removed nodes
      assert.equal(NodeIndex in tempNode, false);
      assert.equal(NodeIndex in backupNode, false);

      done();
    }
  });

  it("checks that dom addition with the follow-up attribute change captures the 'Update' action", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let count = 0;
    let div = document.createElement("div");
    document.body.appendChild(div);

    function callback(mutations) {
      div.setAttribute("data-clarity", "test");
      if (count++ > 0) {
        observer.disconnect();
        let events = stopObserving();
        assert.equal(events.length, 2);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[1].state.action, Action.Update);
        done();
      }
    }
  });

  it("checks that dom addition with immediate attribute change ignores the 'Update' action", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let div = document.createElement("div");
    document.body.appendChild(div);
    div.setAttribute("data-clarity", "test");

    function callback(mutations) {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, "DIV");
      done();
    }
  });

  it("checks that dom addition with immediate move ignores the 'Move' action", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let clarity = document.getElementById("clarity");
    let div = document.createElement("div");
    document.body.appendChild(div);
    clarity.appendChild(div);

    function callback(mutations) {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, "DIV");
      assert.equal(events[0].state.parent, clarity[NodeIndex]);
      done();
    }
  });

  it("checks that nodes that are added and removed in the same mutation don't create index gaps in event logs ", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let div1 = document.createElement("div");
    let div2 = document.createElement("div");
    let div3 = document.createElement("div");

    document.body.appendChild(div1);
    document.body.appendChild(div3);
    document.body.appendChild(div2);
    document.body.removeChild(div3);

    function callback(mutations) {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 2);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.index, div1[NodeIndex]);
      assert.equal(events[1].state.action, Action.Insert);
      assert.equal(events[1].state.index, div2[NodeIndex]);
      assert.equal(div1[NodeIndex], div2[NodeIndex] - 1);
      done();
    }
  });

  it("checks that we do not instrument disconnected dom tree", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let div = document.createElement("div");
    document.body.appendChild(div);
    document.body.removeChild(div);

    function callback(mutations) {
      observer.disconnect();
      let events = stopObserving();

      // Prove that we didn't send any extra instrumentation back for no-op mutation
      assert.equal(events.length, 0);

      // Make sure that clarity index is cleared from all removed nodes
      assert.equal(NodeIndex in div, false);

      done();
    }
  });

  it("checks that we do not instrument child nodes within disconnected dom tree", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let div = document.createElement("div");
    let span = document.createElement("span");
    document.body.appendChild(div);
    div.appendChild(span);
    document.body.removeChild(div);

    function callback(mutations) {
      observer.disconnect();
      let events = stopObserving();

      // Prove that we didn't send any extra instrumentation back for no-op mutation
      assert.equal(events.length, 0);

      // Make sure that clarity index is cleared from all removed nodes
      assert.equal(NodeIndex in div, false);
      assert.equal(NodeIndex in span, false);

      done();
    }
  });

  it("checks that we do not instrument child nodes within a previously observed disconnected dom tree", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    let stopObserving = observeEvents(eventName);
    let clarityDiv = document.getElementById("clarity");
    let span = document.createElement("span");
    let clarityDivIndex = clarityDiv[NodeIndex];
    clarityDiv.appendChild(span);
    clarityDiv.parentElement.removeChild(clarityDiv);

    function callback(mutations) {
      observer.disconnect();
      let events = stopObserving();

      // Prove that we didn't send any extra instrumentation back for no-op mutation
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Remove);
      assert.equal(events[0].state.index, clarityDivIndex);

      // Make sure that clarity index is cleared from all removed nodes
      assert.equal(NodeIndex in clarityDiv, false);
      assert.equal(NodeIndex in span, false);

      done();
    }
  });

  it("checks that we do not instrument inserted nodes twice", (done: DoneFn) => {
    // Edge case scenario for the test:
    // 1. Node n1 is added to the page
    // 2. Immediately node n2 is appended to n1
    // They both show up as insertions in the same batch of mutations
    // When we serialize n1, we will discover its children and serialize n2 as well
    // Make sure we don't serialize n2 again when we move on to n2 insertion mutation record
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Insert a node before an existing node and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let n1 = document.createElement("div");
    let n2 = document.createElement("span");
    let bodyIndex = document.body[NodeIndex];
    document.body.appendChild(n1);
    n1.appendChild(n2);

    function callback() {
      observer.disconnect();

      let events = stopObserving();
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
    }
  });

  it("checks that all kinds of mutations within the same batch have the same mutation sequence", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    let stopObserving = observeEvents(eventName);
    let divOne = document.createElement("div");
    let clarityDiv = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    document.body.appendChild(divOne);  // Insert
    clarityDiv.firstElementChild.id = "updatedId"; // Update
    divOne.appendChild(clarityDiv); // Move
    backup.parentElement.removeChild(backup); // Remove

    function callback() {
      observer.disconnect();
      let events = stopObserving();

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
    }
  });

  it("checks that mutation sequence number is incremented between mutation callbacks", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    let stopObserving = observeEvents(eventName);
    let divOne = document.createElement("div");
    let divTwo = document.createElement("div");
    let callbackNumber = 0;
    document.body.appendChild(divOne);

    function callback() {
      if (callbackNumber === 1) {
        observer.disconnect();

        let events = stopObserving();
        assert.equal(events.length, 2);

        let firstEventSequence = events[0].state.mutationSequence;
        assert.isTrue(firstEventSequence >= 0);
        assert.equal(events[1].state.mutationSequence, firstEventSequence + 1);

        done();
      } else {
        document.body.appendChild(divTwo);
      }
      callbackNumber++;
    }
  });

  it("checks that images source is not captured if the config disallows it", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Disable images
    config.showImages = false;

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let img = document.createElement("img");
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
    document.body.appendChild(img);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "IMG");
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal("src" in events[0].state.attributes, false);
      done();
    }
  });

  it("checks that images source is not captured if the config allows it but mask attribute is applied", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });
    config.showImages = true;

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let img = document.createElement("img");
    img.setAttribute(ForceMaskAttribute, "true");
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
    document.body.appendChild(img);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "IMG");
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal("src" in events[0].state.attributes, false);
      done();
    }
  });

  it("checks that images source is captured if the config allows it", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Allow images
    config.showImages = true;

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let img = document.createElement("img");
    let src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
    img.src = src;
    document.body.appendChild(img);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "IMG");
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.attributes["src"], src);
      done();
    }
  });

  it("checks that script element and its text are ignored", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let script = document.createElement("script");
    script.innerText = "/*some javascriptcode*/";
    document.body.appendChild(script);

    function callback() {
      observer.disconnect();

      let events = stopObserving();

      assert.equal(events.length, 2);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, Tags.Ignore);
      assert.equal(events[0].state.nodeType, Node.ELEMENT_NODE);

      assert.equal(events[1].state.action, Action.Insert);
      assert.equal(events[1].state.tag, Tags.Ignore);
      assert.equal(events[1].state.nodeType, Node.TEXT_NODE);

      done();
    }
  });

  it("checks that meta element is ignored", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let meta = document.createElement("meta");
    document.body.appendChild(meta);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, Tags.Ignore);
      assert.equal(events[0].state.nodeType, Node.ELEMENT_NODE);
      done();
    }
  });

  it("checks that comment node is ignored", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let comment = document.createComment("some explanation");
    document.body.appendChild(comment);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, Tags.Ignore);
      assert.equal(events[0].state.nodeType, Node.COMMENT_NODE);
      done();
    }
  });

  it("checks that scroll capturing works on inserted element", (done: DoneFn) => {
    let stopObserving = null;
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a scrollable DIV
    let outerDiv = document.createElement("div");
    let innerDiv = document.createElement("div");
    outerDiv.style.overflowY = "auto";
    outerDiv.style.width = "200px";
    outerDiv.style.maxHeight = "100px";
    innerDiv.style.height = "300px";
    outerDiv.appendChild(innerDiv);
    document.body.appendChild(outerDiv);

    function callback() {
      observer.disconnect();

      // Add a node to the document and observe Clarity events
      stopObserving = observeEvents(eventName);

      // Trigger scroll
      outerDiv.addEventListener("scroll", scrollCallback);
      outerDiv.scrollTop = 100;
    }

    function scrollCallback() {
      outerDiv.removeEventListener("scroll", scrollCallback);
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Update);
      assert.equal(events[0].state.source, Source.Scroll);
      done();
    }
  });

  it("checks that scroll capturing works on overflow hidden element after a mutation update", (done: DoneFn) => {
    let stopObserving = null;
    let observer = new MutationObserver(callback);
    let mutationCount = 0;
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a scrollable DIV
    let outerDiv = document.createElement("div");
    let innerDiv = document.createElement("div");
    outerDiv.style.overflowY = "hidden";
    outerDiv.style.width = "200px";
    outerDiv.style.maxHeight = "100px";
    innerDiv.style.height = "300px";
    outerDiv.appendChild(innerDiv);
    document.body.appendChild(outerDiv);

    function callback() {
      mutationCount++;

      if (mutationCount === 1) {
        // Force a mutation to ensure that layout updates also capture scroll position
        outerDiv.setAttribute("data-attribute", "1");
      } else {
        observer.disconnect();

        // Add a node to the document and observe Clarity events
        stopObserving = observeEvents(eventName);

        // Trigger scroll after a mutation update
        outerDiv.addEventListener("scroll", scrollCallback);
        outerDiv.scrollTop = 100;
      }
    }

    function scrollCallback() {
      outerDiv.removeEventListener("scroll", scrollCallback);
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Update);
      assert.equal(events[0].state.source, Source.Scroll);
      done();
    }
  });

  it("checks that scroll capturing works on element that enables scrolling after a mutation update", (done: DoneFn) => {
    let stopObserving = null;
    let observer = new MutationObserver(callback);
    let mutationCount = 0;
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a scrollable DIV
    let outerDiv = document.createElement("div");
    let innerDiv = document.createElement("div");
    outerDiv.style.overflowY = "visible";
    outerDiv.style.width = "200px";
    innerDiv.style.height = "300px";
    outerDiv.appendChild(innerDiv);
    document.body.appendChild(outerDiv);

    function callback() {
      mutationCount++;

      if (mutationCount === 1) {
        // Make the element scrollable
        outerDiv.style.maxHeight = "100px";
        outerDiv.style.overflowY = "hidden";
        // Force a mutation to ensure that layout updates also capture scroll position
        outerDiv.setAttribute("data-attribute", "1");
      } else {
        observer.disconnect();

        // Add a node to the document and observe Clarity events
        stopObserving = observeEvents(eventName);

        // Trigger scroll after a mutation update
        outerDiv.addEventListener("scroll", scrollCallback);
        outerDiv.scrollTop = 100;
      }
    }

    function scrollCallback() {
      outerDiv.removeEventListener("scroll", scrollCallback);
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Update);
      assert.equal(events[0].state.source, Source.Scroll);
      done();
    }
  });

  it("checks that input change capturing works on inserted element", (done: DoneFn) => {
    let stopObserving = null;
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    config.showText = true;

    let newValueString = "new value";
    let input = document.createElement("input");
    document.body.appendChild(input);

    function callback() {
      observer.disconnect();

      // Add a node to the document and observe Clarity events
      stopObserving = observeEvents(eventName);

      // Trigger scroll
      input.addEventListener("change", inputChangeCallback);
      input.value = newValueString;

      // Programmatic value change doesn't trigger "onchange" event, so we need to trigger it manually
      let onChangeEvent = document.createEvent("HTMLEvents");
      onChangeEvent.initEvent("change", false, true);
      input.dispatchEvent(onChangeEvent);
    }

    function inputChangeCallback() {
      input.removeEventListener("change", inputChangeCallback);
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Update);
      assert.equal(events[0].state.source, Source.Input);
      assert.equal(events[0].state.attributes.value, newValueString);
      done();
    }
  });

  it("checks that input change capturing works on inserted textarea element", (done: DoneFn) => {
    let stopObserving = null;
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    config.showText = true;

    let newValueString = "new value";
    let textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    function callback() {
      observer.disconnect();

      // Add a node to the document and observe Clarity events
      stopObserving = observeEvents(eventName);

      // Trigger scroll
      textarea.addEventListener("input", inputChangeCallback);
      textarea.value = newValueString;

      // Programmatic value change doesn't trigger "onchange" event, so we need to trigger it manually
      let onInputEvent = document.createEvent("HTMLEvents");
      onInputEvent.initEvent("input", false, true);
      textarea.dispatchEvent(onInputEvent);
    }

    function inputChangeCallback() {
      textarea.removeEventListener("input", inputChangeCallback);
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Update);
      assert.equal(events[0].state.source, Source.Input);
      assert.equal(events[0].state.attributes.value, newValueString);
      done();
    }
  });

  it("checks that input value is masked on insert if the config is set to not show text", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    config.showText = false;

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let input = document.createElement("input");
    let valueString = "value";
    let maskedValueString = mask(valueString);
    input.setAttribute("value", valueString);
    document.body.appendChild(input);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "INPUT");
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.attributes["value"], maskedValueString);
      done();
    }
  });

  it("checks that input value is masked on input update if the config is set to not show text", (done: DoneFn) => {
    let stopObserving = null;
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    config.showText = false;

    let newValueString = "new value";
    let maskedValueString = mask(newValueString);
    let input = document.createElement("input");
    document.body.appendChild(input);

    function callback() {
      observer.disconnect();

      // Add a node to the document and observe Clarity events
      stopObserving = observeEvents(eventName);

      // Trigger scroll
      input.addEventListener("change", inputChangeCallback);
      input.value = newValueString;

      // Programmatic value change doesn't trigger "onchange" event, so we need to trigger it manually
      let onChangeEvent = document.createEvent("HTMLEvents");
      onChangeEvent.initEvent("change", false, true);
      input.dispatchEvent(onChangeEvent);
    }

    function inputChangeCallback() {
      input.removeEventListener("change", inputChangeCallback);
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Update);
      assert.equal(events[0].state.source, Source.Input);
      assert.equal(events[0].state.attributes.value, maskedValueString);
      done();
    }
  });

  it("checks that input value is masked on insert if the config is set to show text and mask attribute is applied", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    config.showText = true;

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let input = document.createElement("input");
    let valueString = "value";
    let maskedValueString = mask(valueString);
    input.setAttribute("value", valueString);
    input.setAttribute(ForceMaskAttribute, "true");
    document.body.appendChild(input);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "INPUT");
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.attributes["value"], maskedValueString);
      done();
    }
  });

  it("checks that child value is masked when the config is set to show text and parent mask attribute is applied", (done: DoneFn) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    config.showText = true;

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let valueString = "value";
    let input = document.createElement("input");
    let child = document.createTextNode(valueString);
    let maskedValueString = mask(valueString);
    input.setAttribute(ForceMaskAttribute, "true");
    input.appendChild(child);
    document.body.appendChild(input);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 2);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, input.tagName);
      assert.equal(events[1].state.action, Action.Insert);
      assert.equal(events[1].state.tag, "*TXT*");
      assert.equal(events[1].state.content, maskedValueString);
      done();
    }
  });

  // // BUG: This test currently fails
  // it(`checks that child value is masked when the config is set to show text
  //     and skip-parent mask attribute is applied`, (done: DoneFn) => {
  //   let observer = new MutationObserver(callback);
  //   observer.observe(document, { childList: true, subtree: true });

  //   config.showText = true;

  //   // Add a node to the document and observe Clarity events
  //   let stopObserving = observeEvents(eventName);
  //   let valueString = "value";
  //   let skipParent = document.createElement("div");
  //   let parent = document.createElement("div");
  //   let child = document.createTextNode(valueString);
  //   let maskedValueString = mask(valueString);
  //   skipParent.setAttribute(ForceMaskAttribute, "true");
  //   skipParent.appendChild(child);
  //   document.body.appendChild(skipParent);

  //   function callback() {
  //     observer.disconnect();
  //     let events = stopObserving();
  //     assert.equal(events.length, 3);
  //     assert.equal(events[0].state.action, Action.Insert);
  //     assert.equal(events[0].state.tag, skipParent.tagName);
  //     assert.equal(events[1].state.action, Action.Insert);
  //     assert.equal(events[1].state.tag, parent.tagName);
  //     assert.equal(events[2].state.action, Action.Insert);
  //     assert.equal(events[2].state.tag, "*TXT*");
  //     assert.equal(events[2].state.content, maskedValueString);
  //     done();
  //   }
  // });

  it("checks that configurable sensitive attributes are masked when config is set to not show text", (done: DoneFn) => {
    core.teardown();

    let sensitiveAttributeName = "data-sensitive-attribute";
    config.showText = false;
    config.sensitiveAttributes = [sensitiveAttributeName];
    activateCore();

    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let value = "value";
    let maskedValue = mask(value);
    let div = document.createElement("div");
    div.setAttribute(sensitiveAttributeName, value);
    document.body.appendChild(div);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, div.tagName);
      assert.equal(events[0].state.attributes[sensitiveAttributeName], maskedValue);
      done();
    }
  });

  it("checks that default sensitive attributes are masked when config is set to not show text", (done: DoneFn) => {
    core.teardown();

    let sensitiveAttributeName = "placeholder";
    config.showText = false;
    activateCore();

    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(eventName);
    let value = "value";
    let maskedValue = mask(value);
    let div = document.createElement("div");
    div.setAttribute(sensitiveAttributeName, value);
    document.body.appendChild(div);

    function callback() {
      observer.disconnect();
      let events = stopObserving();
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Insert);
      assert.equal(events[0].state.tag, div.tagName);
      assert.equal(events[0].state.attributes[sensitiveAttributeName], maskedValue);
      done();
    }
  });
});
