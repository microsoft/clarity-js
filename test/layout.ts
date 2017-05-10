import { config } from "../src/config";
import * as core from "../src/core";
import { LayoutEventName } from "../src/layout/layout";
import { NodeIndex } from "../src/layout/layoutstateprovider";
import uncompress from "../src/uncompress";
import { cleanupFixture, getEventsByType, observeEvents, setupFixture, triggerSend } from "./utils";

import * as chai from "chai";
import "../src/layout/layout";
import "../src/pointer";
import "../src/viewport";

let assert = chai.assert;

describe("Layout Tests", () => {

  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("checks that dom additions are captured by clarity", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let div = document.createElement("div");
    let span = document.createElement("span");
    span.innerHTML = "Clarity";
    div.appendChild(span);
    document.body.insertBefore(div, document.body.firstChild);

    function callback() {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 3);
      assert.equal(events[0].state.tag, "DIV");
      assert.equal(events[0].state.action, 0);
      assert.equal(events[1].state.tag, "SPAN");
      assert.equal(events[2].state.tag, "*TXT*");

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that dom removals are captured by clarity", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Remove a node from the document and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let dom = document.getElementById("clarity");
    dom.parentNode.removeChild(dom);

    function callback() {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 1);
      assert.equal(events[0].state.tag, "DIV");
      assert.equal(events[0].state.action, 2);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that dom moves are captured correctly by clarity", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Move an existing node in the document and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    backup.appendChild(dom);

    function callback() {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, 3);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that insertBefore works correctly", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Insert a node before an existing node and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    let domIndex = dom[NodeIndex];
    let firstChildIndex = dom.firstChild[NodeIndex];
    dom.insertBefore(backup, dom.firstChild);

    function callback() {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, 3);
      assert.equal(events[0].state.parent, domIndex);
      assert.equal(events[0].state.next, firstChildIndex);

      // Explicitly signal that we are done here
      done();
    }
  });

  //  Currently we stopped capturing CSS rule modifications, so disabling this test
  //  Keeping it in code to use it again, once CSS rule modification capturing is restored
  //
  //  it('ensures we capture css rule modifications via javascript', (done) => {
  //    var observer = new MutationObserver(callback);
  //    observer.observe(document, {"childList": true,"subtree": true});

  //    // Add a style tag and later modify styles using javascript
  //    var dom = document.getElementById("clarity");
  //    var domIndex = dom[NodeIndex];
  //    var style = document.createElement("style");
  //    style.textContent = "body {}";
  //    dom.appendChild(style);
  //    var stylesheet = style.sheet;
  //    var rules = stylesheet["cssRules"] || stylesheet["rules"];
  //    rules[0].style.background = "red";

  //    function callback() {
  //      observer.disconnect();

  //      // Following jasmine feature fast forwards the async delay in setTimeout calls
  //      waitForSend();

  //      // Uncompress recent data from mutations
  //      var events = getEventsByType(LayoutEventName);

  //      assert.equal(core.bytes.length, 2);
  //      assert.equal(events.length, 2);
  //      assert.equal(events[0].state.action, 0);
  //      assert.equal(events[0].state.parent, domIndex);
  //      assert.equal(events[1].state.content.indexOf("red") > 0, true);

  //      // Explicitly signal that we are done here
  //      done();
  //    };
  //  });

  it("checks dom changes are captured accurately when multiple siblings are moved to another parent", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Move multiple nodes from one parent to another and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let dom = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    let backupIndex = backup[NodeIndex];
    let childrenCount = dom.childNodes.length;
    while (dom.childNodes.length > 0) {
      backup.appendChild(dom.childNodes[0]);
    }
    function callback() {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, childrenCount);
      assert.equal(events[0].state.action, 3);
      assert.equal(events[0].state.parent, backupIndex);
      assert.equal(events[4].state.parent, backupIndex);
      assert.equal(events[4].state.next, events[5].state.index);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that insertion of multiple nodes in the same mutation record is handled correctly", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });
    let stopObserving = observeEvents(LayoutEventName);

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
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 3);

      // Check DIV insert event
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

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that removal of multiple nodes in the same mutation record is handled correctly", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });
    let stopObserving = observeEvents(LayoutEventName);

    let dom = document.getElementById("clarity");
    let children = dom.childNodes;
    let childIndices = [];
    for (let i = 0; i < children.length; i++) {
      childIndices.push(children[i][NodeIndex]);
    }

    // Remove all children
    dom.innerHTML = "";

    function callback() {
      observer.disconnect();
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      // Make sure that there is a remove event for every child
      assert.equal(events.length, childIndices.length);
      for (let i = 0; i < childIndices.length; i++) {
        assert.equal(events[i].state.action, Action.Remove);
        assert.equal(events[i].state.index, childIndices[i]);
      }

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that dom additions with immediate attribute change are handled by clarity", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let count = 0;
    let div = document.createElement("div");
    div.innerHTML = "Clarity";
    document.body.appendChild(div);

    function callback(mutations) {
      div.setAttribute("data-clarity", "test");
      if (count++ > 0) {
        observer.disconnect();

        // Following jasmine feature fast forwards the async delay in setTimeout calls
        triggerSend();

        // Uncompress recent data from mutations
        let events = stopObserving();

        assert.equal(events.length, 3);
        assert.equal(events[0].state.tag, "DIV");
        assert.equal(events[0].state.action, 0);
        assert.equal(events[1].state.tag, "*TXT*");

        // Explicitly signal that we are done here
        done();
      }
    }
  });

  it("checks that we do not instrument disconnected dom tree", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let div = document.createElement("div");
    document.body.appendChild(div);
    document.body.removeChild(div);

    function callback(mutations) {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      // Prove that we didn't send any extra instrumentation back for no-op mutation
      assert.equal(events.length, 0);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that we do not instrument child nodes within disconnected dom tree", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    // Add a node to the document and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let div = document.createElement("div");
    let span = document.createElement("span");
    document.body.appendChild(div);
    div.appendChild(span);
    document.body.removeChild(div);

    function callback(mutations) {
      observer.disconnect();
      triggerSend();

      let events = stopObserving();

      // Prove that we didn't send any extra instrumentation back for no-op mutation
      assert.equal(events.length, 0);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that we do not instrument child nodes within a previously observed disconnected dom tree", (done) => {
    let clarityDiv = document.getElementById("clarity");

    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true, attributes: true });

    let stopObserving = observeEvents(LayoutEventName);
    let span = document.createElement("span");
    let clarityDivIndex = clarityDiv[NodeIndex];
    clarityDiv.appendChild(span);
    clarityDiv.parentElement.removeChild(clarityDiv);

    function callback(mutations) {
      observer.disconnect();
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      // Prove that we didn't send any extra instrumentation back for no-op mutation
      assert.equal(events.length, 1);
      assert.equal(events[0].state.action, Action.Remove);
      assert.equal(events[0].state.index, clarityDivIndex);

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that we do not instrument inserted nodes twice", (done) => {
    // Edge case scenario for the test:
    // 1. Node n1 is added to the page
    // 2. Immediately node n2 is appended to n1
    // They both show up as insertions in the same batch of mutations
    // When we serialize n1, we will discover its children and serialize n2 as well
    // Make sure we don't serialize n2 again when we move on to n2 insertion mutation record
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    // Insert a node before an existing node and observe Clarity events
    let stopObserving = observeEvents(LayoutEventName);
    let n1 = document.createElement("div");
    let n2 = document.createElement("span");
    let bodyIndex = document.body[NodeIndex];
    document.body.appendChild(n1);
    n1.appendChild(n2);

    function callback() {
      observer.disconnect();
      triggerSend();

      // Uncompress recent data from mutations
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

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that all kinds of mutations within the same batch have the same mutation sequence", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    let stopObserving = observeEvents(LayoutEventName);
    let divOne = document.createElement("div");
    let divTwo = document.createElement("div");
    let clarityDiv = document.getElementById("clarity");
    let backup = document.getElementById("backup");
    document.body.appendChild(divOne);  // Insert
    clarityDiv.firstElementChild.id = "updatedId"; // Update
    divOne.appendChild(clarityDiv); // Move
    backup.parentElement.removeChild(backup); // Remove

    function callback() {
      observer.disconnect();

      // Following jasmine feature fast forwards the async delay in setTimeout calls
      triggerSend();

      // Uncompress recent data from mutations
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

      // Explicitly signal that we are done here
      done();
    }
  });

  it("checks that mutation sequence number is incremented between mutation callbacks", (done) => {
    let observer = new MutationObserver(callback);
    observer.observe(document, { childList: true, subtree: true });

    let stopObserving = observeEvents(LayoutEventName);
    let divOne = document.createElement("div");
    let divTwo = document.createElement("div");
    let callbackNumber = 0;
    document.body.appendChild(divOne);

    function callback() {
      if (callbackNumber === 1) {
        observer.disconnect();
        triggerSend();

        // Uncompress recent data from mutations
        let events = stopObserving();
        assert.equal(events.length, 2);

        let firstEventSequence = events[0].state.mutationSequence;
        assert.isTrue(firstEventSequence >= 0);
        assert.equal(events[1].state.mutationSequence, firstEventSequence + 1);

        // Explicitly signal that we are done here
        done();
      } else {
        document.body.appendChild(divTwo);
      }
      callbackNumber++;
    }
  });
});
