import { IAddEventMessage, IConfig, IEvent, IWorkerMessage, WorkerMessageType } from "../clarity";
import { start, stop } from "../src/clarity";
import { config } from "../src/config";
import { mapProperties } from "../src/utils";
import { testConfig } from "./clarity";
import EventFromArray from "./fromarray";

declare var fixture;

let sentEvents: IEvent[] = [];
let workerMessages: IWorkerMessage[] = [];
let workerPostMessageSpy: jasmine.Spy = null;
let originalConfig: IConfig = config;

export function setupFixture(plugins?: string[]) {
  fixture.setBase("test");
  fixture.load("clarity.fixture.html");
  jasmine.clock().install();

  workerPostMessageSpy = spyOn(Worker.prototype, "postMessage").and.callFake(mockWorkerOnMessage);
  originalConfig = mapProperties(config, null, true);
  testConfig.plugins = plugins || config.plugins;
  activateCore(testConfig);
}

export function cleanupFixture() {
  fixture.cleanup();
  stop();
  mapProperties(originalConfig, null, true, config);
  jasmine.clock().uninstall();
}

export function activateCore(config?: IConfig) {
  resetSetup();
  start(config);
  waitForStartupAcvitityToFinish();
}

export function getSentEvents() {
  return sentEvents;
}

export function getWorkerMessages() {
  return workerMessages;
}

function resetSetup() {
  sentEvents = [];
  workerMessages = [];
}

function waitForStartupAcvitityToFinish() {
  let currentEventsLength = sentEvents.length;
  let hasNewEvents = true;
  while (hasNewEvents) {
    jasmine.clock().tick(config.delay * 2);
    let newSentEventsLength = sentEvents.length;
    hasNewEvents = newSentEventsLength > currentEventsLength;
    currentEventsLength = newSentEventsLength;
  }
}

function mockWorkerOnMessage(message: any) {
  let thisWorker = this as Worker;
  if (this.isTestWorker) {
    workerPostMessageSpy.and.callThrough();
    thisWorker.postMessage(message);
    workerPostMessageSpy.and.callFake(mockWorkerOnMessage);
  } else {
    switch (message.type) {
      case WorkerMessageType.AddEvent:
        let addEventMsg = message as IAddEventMessage;

        // Events are passed to the worker in the array form, so we need to convert them back to JSON here
        let originalEvent = EventFromArray(addEventMsg.event);
        sentEvents.push(originalEvent);
        break;
      default:
        break;
    }
    workerMessages.push(message);
  }
}
